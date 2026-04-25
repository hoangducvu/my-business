import { google } from 'googleapis'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

// Users sheet columns:
// A  id
// B  email
// C  password_hash
// D  name
// E  created_at
// F  role
// G  phone (optional)
// H  reset_token (optional)
// I  reset_token_expires (ISO timestamp, optional)

export interface SheetUser {
  id:                  string
  email:               string
  password_hash:       string
  name:                string
  created_at:          string
  role:                string
  phone:               string
  reset_token:         string
  reset_token_expires: string
}

function sheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

async function getAllUserRows(): Promise<Array<{ row: string[]; rowNum: number }>> {
  const sheets = sheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users!A2:I',
  })
  return (res.data.values ?? []).map((row, i) => ({ row, rowNum: i + 2 }))
}

function rowToUser(row: string[]): SheetUser {
  return {
    id:                  row[0] ?? '',
    email:               row[1] ?? '',
    password_hash:       row[2] ?? '',
    name:                row[3] ?? '',
    created_at:          row[4] ?? '',
    role:                row[5] ?? '',
    phone:               row[6] ?? '',
    reset_token:         row[7] ?? '',
    reset_token_expires: row[8] ?? '',
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<SheetUser | null> {
  const rows = await getAllUserRows()
  const found = rows.find((r) => r.row[1]?.toLowerCase() === email.toLowerCase())
  return found ? rowToUser(found.row) : null
}

export async function createUser(user: {
  id: string
  email: string
  password_hash: string
  name: string
  created_at: string
  role: string
  phone: string
}): Promise<void> {
  const sheets = sheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users!A:I',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        user.id,
        user.email,
        user.password_hash,
        user.name,
        user.created_at,
        user.role,
        user.phone,
        '',   // reset_token
        '',   // reset_token_expires
      ]],
    },
  })
}

export async function setUserResetToken(
  email: string,
  token: string,
  expiresAt: string,
): Promise<void> {
  const rows = await getAllUserRows()
  const found = rows.find((r) => r.row[1]?.toLowerCase() === email.toLowerCase())
  if (!found) return

  const sheets = sheetsClient()
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `Users!H${found.rowNum}`, values: [[token]] },
        { range: `Users!I${found.rowNum}`, values: [[expiresAt]] },
      ],
    },
  })
}

export async function findUserByResetToken(
  token: string,
): Promise<{ user: SheetUser; rowNum: number } | null> {
  const rows = await getAllUserRows()
  const found = rows.find((r) => r.row[7] === token)
  return found ? { user: rowToUser(found.row), rowNum: found.rowNum } : null
}

export async function resetUserPassword(
  rowNum: number,
  newPasswordHash: string,
): Promise<void> {
  const sheets = sheetsClient()
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `Users!C${rowNum}`, values: [[newPasswordHash]] },
        { range: `Users!H${rowNum}:I${rowNum}`, values: [['', '']] },
      ],
    },
  })
}
