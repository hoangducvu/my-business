import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { isAdminAuthed } from '@/lib/admin-auth'

function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  return google.sheets({ version: 'v4', auth })
}

// GET /api/admin/orders — recent charm-bracelet orders (newest first)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
  try {
    const sheets = getSheets()
    const res = await sheets.spreadsheets.values
      .get({ spreadsheetId, range: 'CharmOrders!A2:G' })
      .catch(() => null)

    // CharmOrders: A session_id, B email, C metal, D num_links, E charms, F total_cents, G paid_at
    const orders = (res?.data.values ?? []).map((r) => ({
      sessionId:  r[0] ?? '',
      email:      r[1] ?? '',
      metal:      r[2] ?? '',
      numLinks:   r[3] ?? '',
      charms:     r[4] ?? '',
      totalCents: parseInt(r[5] ?? '0', 10) || 0,
      paidAt:     r[6] ?? '',
    })).reverse()

    return NextResponse.json({ orders: orders.slice(0, 200) })
  } catch (err) {
    console.error('[/api/admin/orders] read error:', err)
    return NextResponse.json({ error: 'Could not read orders.' }, { status: 502 })
  }
}
