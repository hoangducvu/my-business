import { google } from 'googleapis'
import { getActivityLabel, getLocationLabel } from '@/lib/labels'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

/**
 * True once the shop's own Google account is wired up.
 *
 * A service account cannot invite attendees — Google rejects it with "Service
 * accounts cannot invite attendees without Domain-Wide Delegation of Authority"
 * — so bookings land on the shop calendar but the customer never receives an
 * invitation. Acting as a real account fixes that, which is why this path
 * exists. See scripts/setup-calendar-oauth.mjs for the one-time setup.
 */
export function usingRealAccount(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  )
}

function buildAuth() {
  if (usingRealAccount()) {
    // The refresh token is long-lived; the library swaps it for an access token
    // on demand and caches that for the hour it is valid.
    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    )
    oauth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN })
    return oauth
  }

  // Fallback until the real account is set up: bookings are still recorded on
  // the shop calendar, just without a customer invite.
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
    scopes: SCOPES,
  })
}

let calendarClient: ReturnType<typeof google.calendar> | undefined

// One client per process so the OAuth token is fetched once, not per booking.
function getCalendarClient() {
  if (!calendarClient) {
    calendarClient = google.calendar({ version: 'v3', auth: buildAuth() })
  }
  return calendarClient
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

  const reminders = {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 },  // 1 day before
      { method: 'popup', minutes: 24 * 60 },  // 1 day before (popup)
    ],
  }

  const baseEvent = {
    summary,
    description,
    location: locLabel,
    start: { dateTime: startDT, timeZone: 'Europe/Malta' },
    end:   { dateTime: endDT,   timeZone: 'Europe/Malta' },
    colorId: paid ? '2' : '11',  // 2=sage(paid), 11=tomato(pending)
    reminders,
  }

  // Try to invite the customer as an attendee so they get a calendar event too.
  // Google emails them an invitation (RSVP) they can add to their own calendar.
  try {
    await calendar.events.insert({
      calendarId:  process.env.GOOGLE_CALENDAR_ID!,
      sendUpdates: 'all',  // notify the customer of the invite
      requestBody: {
        ...baseEvent,
        attendees: email ? [{ email, displayName: name, responseStatus: 'accepted' }] : undefined,
      },
    })
  } catch (err) {
    // Expected while still on the service account: it cannot invite attendees.
    // Fall back to the shop's own event so the booking is never lost.
    const hint = usingRealAccount()
      ? 'Running as the real account, so this is unexpected — check the token still has calendar scope.'
      : 'Still on the service account, which cannot invite customers. Run scripts/setup-calendar-oauth.mjs to switch.'
    console.warn(`[calendar] Attendee invite failed — created shop-only event. ${hint}`, err)
    await calendar.events.insert({
      calendarId:  process.env.GOOGLE_CALENDAR_ID!,
      sendUpdates: 'none',
      requestBody: baseEvent,
    })
  }
}
