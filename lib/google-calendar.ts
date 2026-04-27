import { google } from 'googleapis'
import { getActivityLabel, getLocationLabel } from '@/lib/email-templates'

function getCalendarClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
  return google.calendar({ version: 'v3', auth })
}

// ─── Create a booking event in Google Calendar ───────────────────────────────

export async function createBookingCalendarEvent(opts: {
  name:      string
  email:     string
  phone?:    string
  date:      string    // YYYY-MM-DD
  time:      string    // HH:00
  activity:  string
  partySize: number
  location:  string
  paid?:     boolean
}): Promise<void> {
  const { name, email, phone, date, time, activity, partySize, location, paid = false } = opts

  const actLabel = getActivityLabel(activity)
  const locLabel = getLocationLabel(location)

  // Build ISO datetime strings for Malta timezone
  const [hourStr] = time.split(':')
  const hour      = parseInt(hourStr, 10)
  const endHour   = Math.min(hour + 1, 23)
  const pad       = (n: number) => String(n).padStart(2, '0')
  const startDT   = `${date}T${pad(hour)}:00:00`
  const endDT     = `${date}T${pad(endHour)}:00:00`

  const statusBadge = paid ? '✅ PAID' : '⏳ PENDING'
  const summary     = `${actLabel} — ${name} ×${partySize} [${statusBadge}]`
  const description = [
    `Activity: ${actLabel}`,
    `Customer: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    `Party: ${partySize} ${partySize === 1 ? 'person' : 'people'}`,
    `Location: ${locLabel}`,
    `Status: ${paid ? 'Paid' : 'Pending confirmation'}`,
  ].filter(Boolean).join('\n')

  const calendar = getCalendarClient()

  await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID!,
    sendUpdates: 'none',
    requestBody: {
      summary,
      description,
      location: locLabel,
      start: { dateTime: startDT, timeZone: 'Europe/Malta' },
      end:   { dateTime: endDT,   timeZone: 'Europe/Malta' },
      colorId: paid ? '2' : '11',  // 2=sage(paid), 11=tomato(pending)
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },  // 1 day before
          { method: 'popup', minutes: 24 * 60 },  // 1 day before (popup)
        ],
      },
    },
  })
}
