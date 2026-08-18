import { sheetsClient, spreadsheetId, once } from '@/lib/google-sheets'

// ─── Phone case deduction log (Google Sheets) ────────────────────────────────
// An append-only history of every stock deduction — whether an admin tapped a
// "sold one" button / typed a model to deduct, or a paid booking auto-decremented
// stock. Powers the "Deduction history" section in /admin. Columns:
//   A time (ISO)  B brand  C model  D location  E qty  F source  G note
//   H reverted (ISO when the deduction was undone, blank while it stands)
// source: 'manual' (admin action) | 'booking' (paid Stripe webhook)
//
// The log is a short-term "did I mis-tap something?" record, not an archive:
// rows older than RETENTION_DAYS are hidden on read and swept off the sheet.

const SHEET = 'Phonecase_Deductions'
const HEADER = ['time', 'brand', 'model', 'location', 'qty', 'source', 'note', 'reverted']

/** History self-deletes after a week — see pruneDeductions. */
export const RETENTION_DAYS = 7

export interface Deduction {
  time:     string
  brand:    string
  model:    string
  location: string
  qty:      number
  source:   string
  note:     string
  reverted: string
}

/** Runs once per process rather than ahead of every append and every log read. */
export function ensureDeductionSheet(): Promise<void> {
  return once(SHEET, async () => {
    const sheets = sheetsClient()
    const id     = spreadsheetId()
    const meta   = await sheets.spreadsheets.get({ spreadsheetId: id })
    const exists = meta.data.sheets?.some((s) => s.properties?.title === SHEET)

    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: id,
        requestBody: { requests: [{ addSheet: { properties: { title: SHEET } } }] },
      })
      console.log('[sheets-phonecase-log] Created Phonecase_Deductions sheet')
    }

    // Idempotent: also upgrades sheets written before the `reverted` column.
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${SHEET}!A1:H1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER] },
    })
  })
}

export async function appendDeduction(d: Omit<Deduction, 'time' | 'reverted'> & { time?: string }): Promise<void> {
  await ensureDeductionSheet()
  const sheets = sheetsClient()
  const time = d.time ?? new Date().toISOString()
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!A:H`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[time, d.brand, d.model, d.location, d.qty, d.source, d.note ?? '', '']],
    },
  })
}

const cutoff = () => Date.now() - RETENTION_DAYS * 86_400_000

function toDeduction(r: string[]): Deduction {
  return {
    time:     r[0]?.toString() ?? '',
    brand:    r[1]?.toString() ?? '',
    model:    r[2]?.toString() ?? '',
    location: r[3]?.toString() ?? '',
    qty:      parseInt(r[4]?.toString() ?? '1', 10) || 1,
    source:   r[5]?.toString() ?? '',
    note:     r[6]?.toString() ?? '',
    reverted: r[7]?.toString() ?? '',
  }
}

// Rows younger than the retention window count; anything unparseable is treated
// as current so a malformed date never silently hides (or deletes) a row.
const withinWindow = (time: string): boolean => {
  const t = Date.parse(time)
  return isNaN(t) || t >= cutoff()
}

// Recent deductions, newest first. Returns [] on any error so the admin tab
// still renders if the log can't be read.
export async function getDeductions(limit = 100): Promise<Deduction[]> {
  const sheets = sheetsClient()
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A2:H`,
    })
    const rows = (res.data.values ?? [])
      .filter((r) => r[0])
      .map(toDeduction)
      .filter((d) => withinWindow(d.time))
    return rows.reverse().slice(0, limit)
  } catch (err) {
    console.error('[sheets-phonecase-log] getDeductions read error:', err)
    return []
  }
}

// ─── Revert ──────────────────────────────────────────────────────────────────

/**
 * Stamps a logged deduction as reverted and reports what needs putting back.
 * Matched on time+brand+model rather than a row index so a concurrent prune
 * (which shifts every row up) can't make a revert hit the wrong entry.
 *
 * Returns null when there is no such standing deduction — either it was never
 * logged, or it has already been reverted, which makes a double-tap a no-op
 * instead of handing the stock back twice.
 */
export async function markReverted(
  time: string, brand: string, model: string,
): Promise<Deduction | null> {
  const sheets = sheetsClient()
  const id     = spreadsheetId()
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId: id, range: `${SHEET}!A2:H`,
  })
  const rows = res.data.values ?? []
  const idx = rows.findIndex((r) =>
    (r[0]?.toString() ?? '') === time &&
    (r[1]?.toString() ?? '') === brand &&
    (r[2]?.toString() ?? '') === model &&
    !(r[7]?.toString() ?? '').trim()
  )
  if (idx === -1) return null

  const d = toDeduction(rows[idx] as string[])
  const stamp = new Date().toISOString()
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${SHEET}!H${idx + 2}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[stamp]] },
  })
  return { ...d, reverted: stamp }
}

// ─── Retention sweep ─────────────────────────────────────────────────────────

let lastPrune = 0
const PRUNE_EVERY = 60 * 60 * 1000   // at most hourly per process

/**
 * Deletes log rows older than RETENTION_DAYS. Rows are contiguous-batched and
 * removed bottom-up so earlier deletions don't shift the indices of later ones.
 * Fire-and-forget: a failed sweep just means the rows linger until the next one
 * (they're already hidden from the UI by getDeductions).
 */
export async function pruneDeductions(): Promise<number> {
  const sheets = sheetsClient()
  const id     = spreadsheetId()
  const meta   = await sheets.spreadsheets.get({ spreadsheetId: id })
  const sheetId = meta.data.sheets?.find((s) => s.properties?.title === SHEET)?.properties?.sheetId
  if (sheetId == null) return 0

  const res  = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${SHEET}!A2:A` })
  const rows = res.data.values ?? []

  // 0-based sheet row indices (row 0 is the header) of everything expired.
  const stale: number[] = []
  rows.forEach((r, i) => {
    const time = r[0]?.toString() ?? ''
    if (time && !withinWindow(time)) stale.push(i + 1)
  })
  if (!stale.length) return 0

  // Collapse runs into [start, end) ranges, then delete from the bottom up.
  const ranges: [number, number][] = []
  for (const i of stale) {
    const last = ranges[ranges.length - 1]
    if (last && last[1] === i) last[1] = i + 1
    else ranges.push([i, i + 1])
  }
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      requests: ranges.reverse().map(([startIndex, endIndex]) => ({
        deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex, endIndex } },
      })),
    },
  })
  console.log(`[sheets-phonecase-log] Pruned ${stale.length} deduction rows older than ${RETENTION_DAYS} days`)
  return stale.length
}

/** Throttled, non-blocking sweep — safe to call on every history read. */
export function maybePrune(): void {
  if (Date.now() - lastPrune < PRUNE_EVERY) return
  lastPrune = Date.now()
  pruneDeductions().catch((err) => {
    lastPrune = 0
    console.error('[sheets-phonecase-log] prune error:', err)
  })
}
