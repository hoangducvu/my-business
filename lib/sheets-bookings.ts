import { google } from 'googleapis'

// ─── Bookings store (Google Sheets) ──────────────────────────────────────────
// Replaces the old "Leads" tab. Every reservation — walk-in or paid — lands here
// and is surfaced in /admin. Columns:
//   A id  B name  C email  D phone  E activity  F submittedAt
//   G date  H time  I partySize  J location  K status  L details
// status:  'confirmed' (free walk-in) | 'pending' (awaiting payment) | 'paid'
// details: free-text note, e.g. the chosen phone model for phone-case bookings

const SHEET = 'Bookings'
const HEADER = ['id', 'name', 'email', 'phone', 'activity', 'submittedAt', 'date', 'time', 'partySize', 'location', 'status', 'details']

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

export interface Booking {
  id:          string
  name:        string
  email:       string
  phone:       string
  activity:    string
  submittedAt: string
  date:        string
  time:        string
  partySize:   number
  location:    string
  status:      string
  details:     string
}

export async function ensureBookingsSheet(): Promise<void> {
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
    range: `${SHEET}!A1:L1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADER] },
  })
  console.log('[sheets-bookings] Created Bookings sheet with headers')
}

export async function appendBooking(b: Booking): Promise<void> {
  await ensureBookingsSheet()
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!A:L`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[b.id, b.name, b.email, b.phone, b.activity, b.submittedAt, b.date, b.time, b.partySize, b.location, b.status, b.details]],
    },
  })
}

// Read all bookings. Returns [] if the sheet doesn't exist yet or the read
// fails, so availability degrades gracefully rather than erroring out.
export async function getBookings(): Promise<Booking[]> {
  const sheets = getSheets()
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${SHEET}!A2:L`,
    })
    return (res.data.values ?? [])
      .filter((r) => r[0])
      .map((r) => ({
        id:          r[0]?.toString()  ?? '',
        name:        r[1]?.toString()  ?? '',
        email:       r[2]?.toString()  ?? '',
        phone:       r[3]?.toString()  ?? '',
        activity:    r[4]?.toString()  ?? '',
        submittedAt: r[5]?.toString()  ?? '',
        date:        r[6]?.toString()  ?? '',
        time:        r[7]?.toString()  ?? '',
        partySize:   parseInt(r[8]?.toString() ?? '1', 10) || 1,
        location:    r[9]?.toString()  ?? '',
        status:      r[10]?.toString() ?? '',
        details:     r[11]?.toString() ?? '',
      }))
  } catch (err) {
    console.error('[sheets-bookings] getBookings read error:', err)
    return []
  }
}

// Flip a booking's status to 'paid' once Stripe confirms payment.
export async function markBookingPaid(id: string): Promise<void> {
  const sheets = getSheets()
  const ss     = spreadsheetId()
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId: ss,
    range: `${SHEET}!A2:A`,
  })
  const ids = (res.data.values ?? []).map((r) => r[0]?.toString().trim())
  const idx = ids.findIndex((rid) => rid === id)
  if (idx === -1) {
    console.warn('[sheets-bookings] markBookingPaid: booking not found:', id)
    return
  }
  const rowNum = idx + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: ss,
    range: `${SHEET}!K${rowNum}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['paid']] },
  })
}
