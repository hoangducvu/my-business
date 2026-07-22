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

// GET /api/admin/bookings — recent leads + invoices (newest first)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
  try {
    const sheets = getSheets()
    const [leadsRes, invRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'Leads!A2:K' }).catch(() => null),
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'Invoices!A2:J' }).catch(() => null),
    ])

    // Leads: A id, B name, C email, D phone, E type, F submittedAt, G date, H time, I activity, J partySize, K location
    const leads = (leadsRes?.data.values ?? []).map((r) => ({
      id:          r[0]  ?? '',
      name:        r[1]  ?? '',
      email:       r[2]  ?? '',
      phone:       r[3]  ?? '',
      type:        r[4]  ?? '',
      submittedAt: r[5]  ?? '',
      date:        r[6]  ?? '',
      time:        r[7]  ?? '',
      activity:    r[8]  ?? '',
      partySize:   r[9]  ?? '',
      location:    r[10] ?? '',
    })).reverse()

    // Invoices: A id, B name, C email, D amount_cents, E currency, F description, G status, H paid_at, I created_at, J lead_id
    const invoices = (invRes?.data.values ?? []).map((r) => ({
      invoiceId:   r[0] ?? '',
      name:        r[1] ?? '',
      email:       r[2] ?? '',
      amountCents: parseInt(r[3] ?? '0', 10) || 0,
      currency:    r[4] ?? 'EUR',
      description: r[5] ?? '',
      status:      r[6] ?? '',
      paidAt:      r[7] ?? '',
      createdAt:   r[8] ?? '',
      leadId:      r[9] ?? '',
    })).reverse()

    return NextResponse.json({ leads: leads.slice(0, 200), invoices: invoices.slice(0, 200) })
  } catch (err) {
    console.error('[/api/admin/bookings] read error:', err)
    return NextResponse.json({ error: 'Could not read bookings.' }, { status: 502 })
  }
}
