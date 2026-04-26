import { google } from 'googleapis'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!
const SHEET = 'Charm_Inventory'

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

// Sheet columns: A=id  B=name  C=quantity

export async function getInventory(): Promise<Record<string, number>> {
  const auth  = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A2:C`,
    })
    const rows = res.data.values ?? []
    const out: Record<string, number> = {}
    for (const row of rows) {
      const id  = row[0]?.toString().trim()
      const qty = parseInt(row[2]?.toString() ?? '0', 10)
      if (id) out[id] = isNaN(qty) ? 0 : qty
    }
    return out
  } catch { return {} }
}

export async function updateInventoryQty(id: string, delta: number): Promise<{ quantity: number } | null> {
  const auth   = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const res  = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A2:C`,
  })
  const rows   = res.data.values ?? []
  const rowIdx = rows.findIndex(r => r[0]?.toString().trim() === id)
  if (rowIdx === -1) return null

  const current = parseInt(rows[rowIdx][2]?.toString() ?? '0', 10)
  const newQty  = Math.max(0, current + delta)
  const sheetRow = rowIdx + 2   // 1-indexed + header row

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!C${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[newQty]] },
  })
  return { quantity: newQty }
}

/** Called on first boot if the Charm_Inventory sheet does not exist. */
export async function ensureInventorySheet(
  charms: Array<{ id: string; name: string }>
) {
  const auth   = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const meta   = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const exists = meta.data.sheets?.some(s => s.properties?.title === SHEET)

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET } } }] },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A1:C1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['id', 'name', 'quantity']] },
    })
    const rows = charms.map(c => [c.id, c.name, 100])
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A2`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    })
  }
}
