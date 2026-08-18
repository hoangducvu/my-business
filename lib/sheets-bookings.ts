import { sheetsClient, spreadsheetId, once, cachedRead, invalidate } from '@/lib/google-sheets'

// ─── Bookings store (Google Sheets) ──────────────────────────────────────────
// Replaces the old "Leads" tab. Every reservation — walk-in or paid — lands here
// and is surfaced in /admin. Columns:
//   A id  B name  C email  D phone  E activity  F submittedAt
//   G date  H time  I partySize  J location  K status  L details
// status:  'confirmed' (free walk-in) | 'pending' (awaiting payment) | 'paid'
// details: free-text note, e.g. the chosen phone model for phone-case bookings

const SHEET = 'Bookings'
const HEADER = ['id', 'name', 'email', 'phone', 'activity', 'submittedAt', 'date', 'time', 'partySize', 'location', 'status', 'details']

const CACHE_KEY = 'bookings'
const CACHE_TTL = 30_000

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

/** Runs once per process — the sheet only needs creating on a fresh spreadsheet. */
export function ensureBookingsSheet(): Promise<void> {
  return once(SHEET, async () => {
    const sheets = sheetsClient()
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
  })
}

export async function appendBooking(b: Booking): Promise<void> {
  await ensureBookingsSheet()
  const sheets = sheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${SHEET}!A:L`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[b.id, b.name, b.email, b.phone, b.activity, b.submittedAt, b.date, b.time, b.partySize, b.location, b.status, b.details]],
    },
  })
  invalidate(CACHE_KEY)
}

// Read all bookings. Returns [] if the sheet doesn't exist yet or the read
// fails, so availability degrades gracefully rather than erroring out.
// `fresh` skips the 30s cache — /admin passes it so the owner always sees the
// booking that just came in.
export async function getBookings(opts: { fresh?: boolean } = {}): Promise<Booking[]> {
  const load = async (): Promise<Booking[]> => {
    const res = await sheetsClient().spreadsheets.values.get({
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
  }
  try {
    if (opts.fresh) {
      invalidate(CACHE_KEY)
      return await load()
    }
    return await cachedRead(CACHE_KEY, CACHE_TTL, load)
  } catch (err) {
    console.error('[sheets-bookings] getBookings read error:', err)
    return []
  }
}

// Flip a booking's status to 'paid' once Stripe confirms payment.
export async function markBookingPaid(id: string): Promise<void> {
  await setBookingStatus(id, 'paid')
}

// Set a booking's status column (K) to an arbitrary value. Returns true if the
// booking row was found and updated. Used by the admin "customer came / done"
// tick (status 'done') as well as markBookingPaid.
export async function setBookingStatus(id: string, status: string): Promise<boolean> {
  const sheets = sheetsClient()
  const ss     = spreadsheetId()
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId: ss,
    range: `${SHEET}!A2:A`,
  })
  const ids = (res.data.values ?? []).map((r) => r[0]?.toString().trim())
  const idx = ids.findIndex((rid) => rid === id)
  if (idx === -1) {
    console.warn('[sheets-bookings] setBookingStatus: booking not found:', id)
    return false
  }
  const rowNum = idx + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: ss,
    range: `${SHEET}!K${rowNum}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  })
  invalidate(CACHE_KEY)
  return true
}
