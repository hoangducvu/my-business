import { sheetsClient, spreadsheetId, once, cachedRead, invalidate } from '@/lib/google-sheets'
import { PHONECASE_SEED } from '@/lib/phonecase-seed'

// ─── Phone case stock (Google Sheets) ────────────────────────────────────────
// One row per phone model, stock split across the two shops (Plaza, Mercury) and
// a supplier source (Alibaba). TOTAL is always the sum of the three and is
// recomputed on every write. Columns:
//   A brand  B model  C plaza  D mercury  E alibaba  F total
// Keyed on brand+model (model names repeat across brands, e.g. iPhone vs Redmi "14 PRO").

const SHEET = 'Phonecase_Inventory'
const HEADER = ['brand', 'model', 'plaza', 'mercury', 'alibaba', 'total']

const CACHE_KEY = 'phonecases'
const CACHE_TTL = 30_000

export interface Phonecase {
  brand:   string
  model:   string
  plaza:   number
  mercury: number
  alibaba: number
  total:   number
}

// Only these two locations map to a stock column bookings can deduct from.
export type StockLocation = 'plaza' | 'mercury'

const key = (brand: string, model: string) =>
  `${brand.trim().toLowerCase()}|${model.trim().toLowerCase()}`

function toInt(x: unknown): number {
  const n = parseInt(x?.toString() ?? '0', 10)
  return isNaN(n) ? 0 : n
}

function rowValues(pc: Omit<Phonecase, 'total'>): (string | number)[] {
  const total = pc.plaza + pc.mercury + pc.alibaba
  return [pc.brand, pc.model, pc.plaza, pc.mercury, pc.alibaba, total]
}

// Create the sheet and seed it from the owner's stock file if it doesn't exist.
// If the sheet already exists in the old 7-column layout (with a Nhà Ngọc column),
// migrate it in place: drop that column and recompute totals.
//
// Runs once per process: the check costs two round-trips and used to run on every
// booking-form load, long after the sheet had settled into its final shape.
export function ensurePhonecaseSheet(): Promise<void> {
  return once(SHEET, async () => {
    const sheets = sheetsClient()
    const id     = spreadsheetId()
    const meta   = await sheets.spreadsheets.get({ spreadsheetId: id })
    const exists = meta.data.sheets?.some((s) => s.properties?.title === SHEET)

    if (exists) {
      const sheetId = meta.data.sheets?.find((s) => s.properties?.title === SHEET)?.properties?.sheetId
      await migrateDropNhaNgoc(sheets, id, sheetId ?? null)
      return
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET } } }] },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${SHEET}!A1:F1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER] },
    })
    const rows = PHONECASE_SEED.map((s) => rowValues({ ...s }))
    await sheets.spreadsheets.values.append({
      spreadsheetId: id,
      range: `${SHEET}!A2`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    })
    invalidate(CACHE_KEY)
    console.log(`[sheets-phonecases] Created + seeded ${SHEET} with ${rows.length} models`)
  })
}

// One-time migration: the sheet used to be
//   A brand  B model  C plaza  D mercury  E nhaNgoc  F alibaba  G total
// Delete the Nhà Ngọc column (E) so alibaba shifts to E and total to F, then
// recompute totals (the old total counted the removed column). Idempotent —
// once the header no longer contains "nhaNgoc" it does nothing.
async function migrateDropNhaNgoc(
  sheets: ReturnType<typeof sheetsClient>,
  id: string,
  sheetId: number | null,
): Promise<void> {
  if (sheetId == null) return
  const header = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${SHEET}!A1:G1` })
  const cols = (header.data.values?.[0] ?? []).map((c) => c?.toString().toLowerCase())
  if (!cols.includes('nhangoc')) return

  // Delete column E (0-based index 4 = Nhà Ngọc)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      requests: [{
        deleteDimension: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 } },
      }],
    },
  })

  // Rewrite header and recompute totals across the (now 6-column) rows.
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${SHEET}!A1:F1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADER] },
  })
  const data = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${SHEET}!A2:F` })
  const rows = data.data.values ?? []
  if (rows.length) {
    const recomputed = rows.map((r) => {
      const plaza = toInt(r[2]), mercury = toInt(r[3]), alibaba = toInt(r[4])
      return [r[0] ?? '', r[1] ?? '', plaza, mercury, alibaba, plaza + mercury + alibaba]
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${SHEET}!A2:F${rows.length + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: recomputed },
    })
  }
  invalidate(CACHE_KEY)
  console.log(`[sheets-phonecases] Migrated ${SHEET}: dropped Nhà Ngọc column`)
}

/** `fresh` skips the cache — /admin passes it so a just-saved edit reads back. */
export async function getPhonecases(opts: { fresh?: boolean } = {}): Promise<Phonecase[]> {
  const load = async (): Promise<Phonecase[]> => {
    const res = await sheetsClient().spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A2:F`,
    })
    return (res.data.values ?? [])
      .filter((r) => (r[1]?.toString() ?? '').trim())   // needs a model
      .map((r) => ({
        brand:   r[0]?.toString() ?? '',
        model:   r[1]?.toString() ?? '',
        plaza:   toInt(r[2]),
        mercury: toInt(r[3]),
        alibaba: toInt(r[4]),
        total:   toInt(r[2]) + toInt(r[3]) + toInt(r[4]),
      }))
  }
  try {
    if (opts.fresh) {
      invalidate(CACHE_KEY)
      return await load()
    }
    return await cachedRead(CACHE_KEY, CACHE_TTL, load)
  } catch (err) {
    console.error('[sheets-phonecases] getPhonecases read error:', err)
    return []
  }
}

// Find the 1-based sheet row for a brand+model, or -1.
async function findRow(brand: string, model: string): Promise<number> {
  const sheets = sheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!A2:B`,
  })
  const rows = res.data.values ?? []
  const idx = rows.findIndex((r) => key(r[0]?.toString() ?? '', r[1]?.toString() ?? '') === key(brand, model))
  return idx === -1 ? -1 : idx + 2
}

// Add a new model or overwrite an existing one (matched on brand+model).
export async function upsertPhonecase(pc: Omit<Phonecase, 'total'>): Promise<void> {
  await ensurePhonecaseSheet()
  const sheets  = sheetsClient()
  const id      = spreadsheetId()
  const rowNum  = await findRow(pc.brand, pc.model)
  const values  = [rowValues(pc)]

  if (rowNum === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: id, range: `${SHEET}!A2`, valueInputOption: 'RAW', requestBody: { values },
    })
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: id, range: `${SHEET}!A${rowNum}:F${rowNum}`, valueInputOption: 'RAW', requestBody: { values },
    })
  }
  invalidate(CACHE_KEY)
}

export async function deletePhonecase(brand: string, model: string): Promise<boolean> {
  const sheets = sheetsClient()
  const id     = spreadsheetId()
  const meta   = await sheets.spreadsheets.get({ spreadsheetId: id })
  const sheetId = meta.data.sheets?.find((s) => s.properties?.title === SHEET)?.properties?.sheetId
  if (sheetId == null) return false

  const rowNum = await findRow(brand, model)
  if (rowNum === -1) return false

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      requests: [{
        deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: rowNum - 1, endIndex: rowNum } },
      }],
    },
  })
  invalidate(CACHE_KEY)
  return true
}

// Decrement the stock at a shop location (Plaza/Mercury) for a booked model.
// Floors at 0 and keeps TOTAL in sync. Returns the new row, or null if not found.
export async function deductStock(
  brand: string, model: string, location: StockLocation, qty: number,
): Promise<Phonecase | null> {
  const sheets = sheetsClient()
  const id     = spreadsheetId()
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId: id, range: `${SHEET}!A2:F`,
  })
  const rows = res.data.values ?? []
  const idx  = rows.findIndex((r) => key(r[0]?.toString() ?? '', r[1]?.toString() ?? '') === key(brand, model))
  if (idx === -1) {
    console.warn('[sheets-phonecases] deductStock: model not found:', brand, model)
    return null
  }

  const r = rows[idx]
  const pc: Omit<Phonecase, 'total'> = {
    brand:   r[0]?.toString() ?? brand,
    model:   r[1]?.toString() ?? model,
    plaza:   toInt(r[2]),
    mercury: toInt(r[3]),
    alibaba: toInt(r[4]),
  }
  pc[location] = Math.max(0, pc[location] - Math.max(0, qty))

  const rowNum = idx + 2
  const values = rowValues(pc)
  await sheets.spreadsheets.values.update({
    spreadsheetId: id, range: `${SHEET}!A${rowNum}:F${rowNum}`, valueInputOption: 'RAW', requestBody: { values: [values] },
  })
  invalidate(CACHE_KEY)
  return { ...pc, total: pc.plaza + pc.mercury + pc.alibaba }
}
