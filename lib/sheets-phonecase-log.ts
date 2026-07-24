import { google } from 'googleapis'

// ─── Phone case deduction log (Google Sheets) ────────────────────────────────
// An append-only history of every stock deduction — whether an admin tapped a
// "sold one" button / typed a model to deduct, or a paid booking auto-decremented
// stock. Powers the "Deduction history" section in /admin. Columns:
//   A time (ISO)  B brand  C model  D location  E qty  F source  G note
// source: 'manual' (admin action) | 'booking' (paid Stripe webhook)

const SHEET = 'Phonecase_Deductions'
const HEADER = ['time', 'brand', 'model', 'location', 'qty', 'source', 'note']

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

export interface Deduction {
  time:     string
  brand:    string
  model:    string
  location: string
  qty:      number
  source:   string
  note:     string
}

export async function ensureDeductionSheet(): Promise<void> {
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
  console.log('[sheets-phonecase-log] Created Phonecase_Deductions sheet')
}

export async function appendDeduction(d: Omit<Deduction, 'time'> & { time?: string }): Promise<void> {
  await ensureDeductionSheet()
  const sheets = getSheets()
  const time = d.time ?? new Date().toISOString()
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!A:G`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[time, d.brand, d.model, d.location, d.qty, d.source, d.note ?? '']],
    },
  })
}

// Recent deductions, newest first. Returns [] on any error so the admin tab
// still renders if the log can't be read.
export async function getDeductions(limit = 100): Promise<Deduction[]> {
  const sheets = getSheets()
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A2:G`,
    })
    const rows = (res.data.values ?? [])
      .filter((r) => r[0])
      .map((r) => ({
        time:     r[0]?.toString() ?? '',
        brand:    r[1]?.toString() ?? '',
        model:    r[2]?.toString() ?? '',
        location: r[3]?.toString() ?? '',
        qty:      parseInt(r[4]?.toString() ?? '1', 10) || 1,
        source:   r[5]?.toString() ?? '',
        note:     r[6]?.toString() ?? '',
      }))
    return rows.reverse().slice(0, limit)
  } catch (err) {
    console.error('[sheets-phonecase-log] getDeductions read error:', err)
    return []
  }
}
