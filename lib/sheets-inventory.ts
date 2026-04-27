import { google } from 'googleapis'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!
const SHEET = 'Charm_Inventory'

// Sheet columns: A=id  B=name  C=category  D=price  E=imageUrl  F=quantity
// Old 3-col format (A=id B=name C=quantity) is auto-detected and migrated.

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export interface CharmRow {
  id: string
  name: string
  category: string
  price: number
  imageUrl: string
  quantity: number
  rowIndex: number
}

async function getSheetFormat(
  sheets: ReturnType<typeof google.sheets>
): Promise<'old' | 'new'> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A1:F1`,
    })
    const header = res.data.values?.[0] ?? []
    return header[2]?.toString().toLowerCase() === 'category' ? 'new' : 'old'
  } catch {
    return 'old'
  }
}

export async function getInventory(): Promise<Record<string, number>> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  try {
    const fmt = await getSheetFormat(sheets)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A2:F`,
    })
    const rows = res.data.values ?? []
    const out: Record<string, number> = {}
    for (const row of rows) {
      const id = row[0]?.toString().trim()
      if (!id) continue
      const rawQty = fmt === 'new' ? row[5] : row[2]
      const qty = parseInt(rawQty?.toString() ?? '0', 10)
      out[id] = isNaN(qty) ? 0 : qty
    }
    return out
  } catch { return {} }
}

export async function getCharmCatalog(): Promise<CharmRow[]> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const fmt = await getSheetFormat(sheets)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A2:F`,
  })
  const rows = res.data.values ?? []
  const out: CharmRow[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const id = row[0]?.toString().trim()
    if (!id) continue
    if (fmt === 'old') {
      const qty = parseInt(row[2]?.toString() ?? '0', 10)
      out.push({ id, name: row[1]?.toString().trim() ?? id, category: 'Custom', price: 3.50, imageUrl: '', quantity: isNaN(qty) ? 0 : qty, rowIndex: i + 2 })
    } else {
      const qty = parseInt(row[5]?.toString() ?? '0', 10)
      const price = parseFloat(row[3]?.toString() ?? '3.50')
      out.push({
        id,
        name: row[1]?.toString().trim() ?? id,
        category: row[2]?.toString().trim() || 'Custom',
        price: isNaN(price) ? 3.50 : price,
        imageUrl: row[4]?.toString().trim() ?? '',
        quantity: isNaN(qty) ? 0 : qty,
        rowIndex: i + 2,
      })
    }
  }
  return out
}

export async function upsertCharm(charm: Omit<CharmRow, 'rowIndex'>): Promise<void> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A2:A`,
  })
  const ids = (res.data.values ?? []).map(r => r[0]?.toString().trim())
  const rowIdx = ids.findIndex(id => id === charm.id)
  const rowData = [charm.id, charm.name, charm.category, charm.price, charm.imageUrl, charm.quantity]

  if (rowIdx === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A2`,
      valueInputOption: 'RAW',
      requestBody: { values: [rowData] },
    })
  } else {
    const sheetRow = rowIdx + 2
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A${sheetRow}:F${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [rowData] },
    })
  }
}

export async function deleteCharmRow(id: string): Promise<boolean> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheetId = meta.data.sheets?.find(s => s.properties?.title === SHEET)?.properties?.sheetId
  if (sheetId == null) return false

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A2:A`,
  })
  const ids = (res.data.values ?? []).map(r => r[0]?.toString().trim())
  const rowIdx = ids.findIndex(rid => rid === id)
  if (rowIdx === -1) return false

  const sheetRow = rowIdx + 2
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: sheetRow - 1, endIndex: sheetRow },
        },
      }],
    },
  })
  return true
}

export async function updateInventoryQty(id: string, delta: number): Promise<{ quantity: number } | null> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const fmt = await getSheetFormat(sheets)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A2:F`,
  })
  const rows = res.data.values ?? []
  const rowIdx = rows.findIndex(r => r[0]?.toString().trim() === id)
  if (rowIdx === -1) return null

  const qtyCol = fmt === 'new' ? 5 : 2
  const current = parseInt(rows[rowIdx][qtyCol]?.toString() ?? '0', 10)
  const newQty = Math.max(0, current + delta)
  const sheetRow = rowIdx + 2
  const colLetter = fmt === 'new' ? 'F' : 'C'

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!${colLetter}${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[newQty]] },
  })
  return { quantity: newQty }
}

export async function ensureInventorySheet(
  charms: Array<{ id: string; name: string; category: string; price: number; imageUrl: string }>
) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const exists = meta.data.sheets?.some(s => s.properties?.title === SHEET)

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET } } }] },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A1:F1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['id', 'name', 'category', 'price', 'imageUrl', 'quantity']] },
    })
    const rows = charms.map(c => [c.id, c.name, c.category, c.price, c.imageUrl, 100])
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A2`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    })
    return
  }

  // Migrate old 3-col sheet to new 6-col format
  const fmt = await getSheetFormat(sheets)
  if (fmt === 'old') {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A1:F1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['id', 'name', 'category', 'price', 'imageUrl', 'quantity']] },
    })
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A2:C`,
    })
    const rows = res.data.values ?? []
    if (rows.length > 0) {
      const updated = rows.map(row => {
        const id = row[0]?.toString().trim() ?? ''
        const def = charms.find(c => c.id === id)
        const qty = parseInt(row[2]?.toString() ?? '0', 10)
        return [id, def?.name ?? row[1] ?? id, def?.category ?? 'Custom', def?.price ?? 3.50, def?.imageUrl ?? '', isNaN(qty) ? 100 : qty]
      })
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET}!A2:F${rows.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: updated },
      })
    }
  }
}

// ─── Categories ──────────────────────────────────────────────────────────────
const CAT_SHEET = 'Charm_Categories'

export async function ensureCategoriesSheet(defaults: string[]) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const exists = meta.data.sheets?.some(s => s.properties?.title === CAT_SHEET)
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: CAT_SHEET } } }] },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CAT_SHEET}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['name'], ...defaults.map(d => [d])] },
    })
  }
}

export async function getCategories(): Promise<string[]> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CAT_SHEET}!A2:A`,
    })
    return (res.data.values ?? []).map(r => r[0]?.toString().trim()).filter(Boolean)
  } catch { return [] }
}

export async function addCategory(name: string): Promise<void> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${CAT_SHEET}!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: [[name]] },
  })
}

export async function deleteCategory(name: string): Promise<boolean> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheetId = meta.data.sheets?.find(s => s.properties?.title === CAT_SHEET)?.properties?.sheetId
  if (sheetId == null) return false

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${CAT_SHEET}!A2:A`,
  })
  const names = (res.data.values ?? []).map(r => r[0]?.toString().trim())
  const rowIdx = names.findIndex(n => n === name)
  if (rowIdx === -1) return false

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: rowIdx + 1, endIndex: rowIdx + 2 },
        },
      }],
    },
  })
  return true
}
