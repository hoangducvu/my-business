import { google } from 'googleapis'
import { PHONECASE_SEED } from '@/lib/phonecase-seed'

// ─── Phone case stock (Google Sheets) ────────────────────────────────────────
// One row per phone model, stock split across the two shops (Plaza, Mercury) and
// two warehouse/supplier sources (Nhà Ngọc, Alibaba). TOTAL is always the sum of
// the four and is recomputed on every write. Columns:
//   A brand  B model  C plaza  D mercury  E nhaNgoc  F alibaba  G total
// Keyed on brand+model (model names repeat across brands, e.g. iPhone vs Redmi "14 PRO").

const SHEET = 'Phonecase_Inventory'
const HEADER = ['brand', 'model', 'plaza', 'mercury', 'nhaNgoc', 'alibaba', 'total']

function spreadsheetId() {
  return process.env.GOOGLE_SPREADSHEET_ID!
}

function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export interface Phonecase {
  brand:   string
  model:   string
  plaza:   number
  mercury: number
  nhaNgoc: number
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
  const total = pc.plaza + pc.mercury + pc.nhaNgoc + pc.alibaba
  return [pc.brand, pc.model, pc.plaza, pc.mercury, pc.nhaNgoc, pc.alibaba, total]
}

// Create the sheet and seed it from the owner's stock file if it doesn't exist.
export async function ensurePhonecaseSheet(): Promise<void> {
  const sheets = getSheets()
  const id     = spreadsheetId()
  const meta   = await sheets.spreadsheets.get({ spreadsheetId: id })
  const exists = meta.data.sheets?.some((s) => s.properties?.title === SHEET)
  if (exists) return

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    requestBody: { requests: [{ addSheet: { properties: { title: SHEET } } }] },
  })
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${SHEET}!A1:G1`,
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
  console.log(`[sheets-phonecases] Created + seeded ${SHEET} with ${rows.length} models`)
}

export async function getPhonecases(): Promise<Phonecase[]> {
  const sheets = getSheets()
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A2:G`,
    })
    return (res.data.values ?? [])
      .filter((r) => (r[1]?.toString() ?? '').trim())   // needs a model
      .map((r) => ({
        brand:   r[0]?.toString() ?? '',
        model:   r[1]?.toString() ?? '',
        plaza:   toInt(r[2]),
        mercury: toInt(r[3]),
        nhaNgoc: toInt(r[4]),
        alibaba: toInt(r[5]),
        total:   toInt(r[2]) + toInt(r[3]) + toInt(r[4]) + toInt(r[5]),
      }))
  } catch (err) {
    console.error('[sheets-phonecases] getPhonecases read error:', err)
    return []
  }
}

// Find the 1-based sheet row for a brand+model, or -1.
async function findRow(brand: string, model: string): Promise<number> {
  const sheets = getSheets()
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
  const sheets  = getSheets()
  const id      = spreadsheetId()
  const rowNum  = await findRow(pc.brand, pc.model)
  const values  = [rowValues(pc)]

  if (rowNum === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: id, range: `${SHEET}!A2`, valueInputOption: 'RAW', requestBody: { values },
    })
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: id, range: `${SHEET}!A${rowNum}:G${rowNum}`, valueInputOption: 'RAW', requestBody: { values },
    })
  }
}

export async function deletePhonecase(brand: string, model: string): Promise<boolean> {
  const sheets = getSheets()
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
  return true
}

// Decrement the stock at a shop location (Plaza/Mercury) for a booked model.
// Floors at 0 and keeps TOTAL in sync. Returns the new row, or null if not found.
export async function deductStock(
  brand: string, model: string, location: StockLocation, qty: number,
): Promise<Phonecase | null> {
  const sheets = getSheets()
  const id     = spreadsheetId()
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId: id, range: `${SHEET}!A2:G`,
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
    nhaNgoc: toInt(r[4]),
    alibaba: toInt(r[5]),
  }
  pc[location] = Math.max(0, pc[location] - Math.max(0, qty))

  const rowNum = idx + 2
  const values = rowValues(pc)
  await sheets.spreadsheets.values.update({
    spreadsheetId: id, range: `${SHEET}!A${rowNum}:G${rowNum}`, valueInputOption: 'RAW', requestBody: { values: [values] },
  })
  return { ...pc, total: pc.plaza + pc.mercury + pc.nhaNgoc + pc.alibaba }
}
