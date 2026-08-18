import { sheetsClient, spreadsheetId, once, cachedRead, invalidate } from '@/lib/google-sheets'
import { CHARM_PRICE, SPECIAL_PRICE } from '@/lib/charm-pricing'

const SHEET = 'Charm_Inventory'

// Sheet columns: A=id  B=name  C=category  D=price  E=imageUrl  F=quantity  G=special
// Old 3-col format (A=id B=name C=quantity) is auto-detected and migrated.
//
// Price is no longer edited per charm — it follows the special flag (€4 standard,
// €6 special). Column D is still written so the sheet reads sensibly on its own,
// but `special` in column G is the source of truth.

const HEADER = ['id', 'name', 'category', 'price', 'imageUrl', 'quantity', 'special']

const CATALOG_KEY = 'charm-catalog'
const CATALOG_TTL = 30_000

export interface CharmRow {
  id: string
  name: string
  category: string
  price: number
  imageUrl: string
  quantity: number
  /** Special charms cost €6 instead of €4. */
  special: boolean
  rowIndex: number
}

/** Sheets round-trips booleans as TRUE/FALSE strings, so accept both. */
function toBool(cell: unknown): boolean {
  const s = cell?.toString().trim().toLowerCase()
  return s === 'true' || s === 'yes' || s === '1'
}

export function priceFor(special: boolean): number {
  return special ? SPECIAL_PRICE : CHARM_PRICE
}

/**
 * Header + rows in a single batchGet.
 *
 * The header tells us which layout the sheet is in, but asking for it in its own
 * `values.get` doubled the round-trips on every read — batchGet returns both
 * ranges in one call.
 */
async function readSheet(): Promise<{ fmt: 'old' | 'new'; header: string[]; rows: string[][] }> {
  const sheets = sheetsClient()
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: spreadsheetId(),
    ranges: [`${SHEET}!A1:G1`, `${SHEET}!A2:G`],
  })
  const [headerRange, dataRange] = res.data.valueRanges ?? []
  const header = (headerRange?.values?.[0] ?? []) as string[]
  return {
    fmt: header[2]?.toString().toLowerCase() === 'category' ? 'new' : 'old',
    header,
    rows: (dataRange?.values ?? []) as string[][],
  }
}

function parseCatalog(fmt: 'old' | 'new', rows: string[][]): CharmRow[] {
  const out: CharmRow[] = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const id = row[0]?.toString().trim()
    if (!id) continue
    if (fmt === 'old') {
      const qty = parseInt(row[2]?.toString() ?? '0', 10)
      out.push({ id, name: row[1]?.toString().trim() ?? id, category: 'Custom', price: CHARM_PRICE, imageUrl: '', quantity: isNaN(qty) ? 0 : qty, special: false, rowIndex: i + 2 })
    } else {
      const qty = parseInt(row[5]?.toString() ?? '0', 10)
      // Column G is absent on sheets written before specials existed, which reads
      // as false — the right default for every charm already in the shop.
      const special = toBool(row[6])
      out.push({
        id,
        name: row[1]?.toString().trim() ?? id,
        category: row[2]?.toString().trim() || 'Custom',
        // Derived, never read from column D: the flag is what sets the price.
        price: priceFor(special),
        imageUrl: row[4]?.toString().trim() ?? '',
        quantity: isNaN(qty) ? 0 : qty,
        special,
        rowIndex: i + 2,
      })
    }
  }
  return out
}

/**
 * The whole catalogue. `fresh` skips the cache — /admin passes it so the owner
 * never sees stock they have just edited served from a stale read.
 */
export async function getCharmCatalog(opts: { fresh?: boolean } = {}): Promise<CharmRow[]> {
  const load = async () => {
    const { fmt, rows } = await readSheet()
    return parseCatalog(fmt, rows)
  }
  if (opts.fresh) {
    invalidate(CATALOG_KEY)
    return load()
  }
  return cachedRead(CATALOG_KEY, CATALOG_TTL, load)
}

export async function getInventory(): Promise<Record<string, number>> {
  try {
    const out: Record<string, number> = {}
    for (const row of await getCharmCatalog()) out[row.id] = row.quantity
    return out
  } catch { return {} }
}

export async function upsertCharm(charm: Omit<CharmRow, 'rowIndex' | 'price'>): Promise<void> {
  const sheets = sheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!A2:A`,
  })
  const ids = (res.data.values ?? []).map(r => r[0]?.toString().trim())
  const rowIdx = ids.findIndex(id => id === charm.id)
  // Price is derived from the flag, so callers can't set the two out of step.
  const rowData = [charm.id, charm.name, charm.category, priceFor(charm.special), charm.imageUrl, charm.quantity, charm.special]

  if (rowIdx === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A2`,
      valueInputOption: 'RAW',
      requestBody: { values: [rowData] },
    })
  } else {
    const sheetRow = rowIdx + 2
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A${sheetRow}:G${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [rowData] },
    })
  }
  invalidate(CATALOG_KEY)
}

export async function deleteCharmRow(id: string): Promise<boolean> {
  const sheets = sheetsClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId() })
  const sheetId = meta.data.sheets?.find(s => s.properties?.title === SHEET)?.properties?.sheetId
  if (sheetId == null) return false

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!A2:A`,
  })
  const ids = (res.data.values ?? []).map(r => r[0]?.toString().trim())
  const rowIdx = ids.findIndex(rid => rid === id)
  if (rowIdx === -1) return false

  const sheetRow = rowIdx + 2
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: sheetRow - 1, endIndex: sheetRow },
        },
      }],
    },
  })
  invalidate(CATALOG_KEY)
  return true
}

export async function updateInventoryQty(id: string, delta: number): Promise<{ quantity: number } | null> {
  const sheets = sheetsClient()
  const { fmt, rows } = await readSheet()
  const rowIdx = rows.findIndex(r => r[0]?.toString().trim() === id)
  if (rowIdx === -1) return null

  const qtyCol = fmt === 'new' ? 5 : 2
  const current = parseInt(rows[rowIdx][qtyCol]?.toString() ?? '0', 10)
  const newQty = Math.max(0, current + delta)
  const sheetRow = rowIdx + 2
  const colLetter = fmt === 'new' ? 'F' : 'C'

  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!${colLetter}${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[newQty]] },
  })
  invalidate(CATALOG_KEY)
  return { quantity: newQty }
}

/**
 * Creates or migrates the sheet. Runs once per process — this used to fire on
 * every public inventory request, costing two extra round-trips to confirm a
 * sheet that has existed since the first deploy.
 */
export function ensureInventorySheet(
  charms: Array<{ id: string; name: string; category: string; imageUrl: string }>
): Promise<void> {
  return once(SHEET, async () => {
    const sheets = sheetsClient()
    const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId() })
    const exists = meta.data.sheets?.some(s => s.properties?.title === SHEET)

    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId(),
        requestBody: { requests: [{ addSheet: { properties: { title: SHEET } } }] },
      })
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId(),
        range: `${SHEET}!A1:G1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADER] },
      })
      const rows = charms.map(c => [c.id, c.name, c.category, CHARM_PRICE, c.imageUrl, 100, false])
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId(),
        range: `${SHEET}!A2`,
        valueInputOption: 'RAW',
        requestBody: { values: rows },
      })
      invalidate(CATALOG_KEY)
      return
    }

    const { fmt, header, rows } = await readSheet()

    // Migrate old 3-col sheet to the full format.
    if (fmt === 'old') {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId(),
        range: `${SHEET}!A1:G1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADER] },
      })
      if (rows.length > 0) {
        const updated = rows.map(row => {
          const id = row[0]?.toString().trim() ?? ''
          const def = charms.find(c => c.id === id)
          const qty = parseInt(row[2]?.toString() ?? '0', 10)
          return [id, def?.name ?? row[1] ?? id, def?.category ?? 'Custom', CHARM_PRICE, def?.imageUrl ?? '', isNaN(qty) ? 100 : qty, false]
        })
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId(),
          range: `${SHEET}!A2:G${rows.length + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: updated },
        })
      }
      invalidate(CATALOG_KEY)
      return
    }

    // Sheets written before specials existed stop at column F. Widening just the
    // header is enough — a blank column G already reads as "not special".
    if (header[6]?.toString().trim().toLowerCase() !== 'special') {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId(),
        range: `${SHEET}!A1:G1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADER] },
      })
      invalidate(CATALOG_KEY)
    }
  })
}

// ─── Categories ──────────────────────────────────────────────────────────────
const CAT_SHEET = 'Charm_Categories'
const CAT_KEY = 'charm-categories'
const CAT_TTL = 60_000

export function ensureCategoriesSheet(defaults: string[]): Promise<void> {
  return once(CAT_SHEET, async () => {
    const sheets = sheetsClient()
    const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId() })
    const exists = meta.data.sheets?.some(s => s.properties?.title === CAT_SHEET)
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId(),
        requestBody: { requests: [{ addSheet: { properties: { title: CAT_SHEET } } }] },
      })
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId(),
        range: `${CAT_SHEET}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [['name'], ...defaults.map(d => [d])] },
      })
      invalidate(CAT_KEY)
    }
  })
}

export async function getCategories(opts: { fresh?: boolean } = {}): Promise<string[]> {
  const load = async () => {
    const res = await sheetsClient().spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${CAT_SHEET}!A2:A`,
    })
    return (res.data.values ?? []).map(r => r[0]?.toString().trim()).filter(Boolean) as string[]
  }
  try {
    if (opts.fresh) {
      invalidate(CAT_KEY)
      return await load()
    }
    return await cachedRead(CAT_KEY, CAT_TTL, load)
  } catch { return [] }
}

export async function addCategory(name: string): Promise<void> {
  await sheetsClient().spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${CAT_SHEET}!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: [[name]] },
  })
  invalidate(CAT_KEY)
}

export async function deleteCategory(name: string): Promise<boolean> {
  const sheets = sheetsClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId() })
  const sheetId = meta.data.sheets?.find(s => s.properties?.title === CAT_SHEET)?.properties?.sheetId
  if (sheetId == null) return false

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${CAT_SHEET}!A2:A`,
  })
  const names = (res.data.values ?? []).map(r => r[0]?.toString().trim())
  const rowIdx = names.findIndex(n => n === name)
  if (rowIdx === -1) return false

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: rowIdx + 1, endIndex: rowIdx + 2 },
        },
      }],
    },
  })
  invalidate(CAT_KEY)
  return true
}
