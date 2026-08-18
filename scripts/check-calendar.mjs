/**
 * Checks the Google Calendar integration and reports which account it is using.
 *
 *   node scripts/check-calendar.mjs          read-only checks, changes nothing
 *   node scripts/check-calendar.mjs --full   also creates a test event, verifies
 *                                            it, then deletes it again
 *
 * The --full run is the only way to prove customer invitations work, because
 * that is decided by Google at insert time. It books a slot in 2030 so a stray
 * event could never be mistaken for a real booking, and any attendee address
 * uses example.com, which is reserved and undeliverable.
 */
import fs from 'node:fs'
import path from 'node:path'
import { google } from 'googleapis'

// Load .env.local the same way Next does, so this matches what the app sees.
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line.includes('=') || line.trimStart().startsWith('#')) continue
    const i = line.indexOf('=')
    const key = line.slice(0, i).trim()
    if (!process.env[key]) process.env[key] = line.slice(i + 1).trim()
  }
}

const CAL_ID = process.env.GOOGLE_CALENDAR_ID
const SCOPES = ['https://www.googleapis.com/auth/calendar']
const full = process.argv.includes('--full')

let fail = 0
const ok = (l, d = '') => console.log(`  ok    ${l}${d ? '  — ' + d : ''}`)
const bad = (l, d = '') => { fail++; console.log(`  FAIL  ${l}${d ? '  — ' + d : ''}`) }

const real = Boolean(
  process.env.GOOGLE_OAUTH_CLIENT_ID &&
  process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
  process.env.GOOGLE_OAUTH_REFRESH_TOKEN
)

let auth
if (real) {
  auth = new google.auth.OAuth2(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_CLIENT_SECRET)
  auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN })
} else {
  auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? '{}'),
    scopes: SCOPES,
  })
}
const calendar = google.calendar({ version: 'v3', auth })

console.log(`\nMode: ${real ? 'REAL ACCOUNT (OAuth) — customers can be invited' : 'SERVICE ACCOUNT — customers cannot be invited'}`)
if (!real) console.log('      run scripts/setup-calendar-oauth.mjs to switch')

console.log('\n=== credentials ===')
try {
  if (real) {
    const { token } = await auth.getAccessToken()
    token ? ok('refresh token exchanges for an access token') : bad('no access token returned')
    try {
      const me = await google.oauth2({ version: 'v2', auth }).userinfo.get()
      console.log(`        acting as ${me.data.email}`)
    } catch { /* userinfo scope optional */ }
  } else {
    const client = await auth.getClient()
    const t = await client.getAccessToken()
    t?.token ? ok('service account can mint an access token') : bad('no access token')
    console.log(`        acting as ${JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON).client_email}`)
  }
} catch (e) {
  bad('authentication failed', e.message)
  console.log('\n(if the refresh token expired, re-run scripts/setup-calendar-oauth.mjs)')
  process.exit(1)
}

console.log('\n=== calendar ===')
try {
  const cal = await calendar.calendars.get({ calendarId: CAL_ID })
  ok('calendar reachable', `"${cal.data.summary}" (${cal.data.timeZone})`)
} catch (e) {
  bad('cannot reach GOOGLE_CALENDAR_ID', `${e.code ?? ''} ${e.message}`)
}

try {
  const res = await calendar.events.list({
    calendarId: CAL_ID, timeMin: new Date().toISOString(),
    maxResults: 5, singleEvents: true, orderBy: 'startTime',
  })
  const items = res.data.items ?? []
  ok('can read events', `${items.length} upcoming`)
  for (const e of items) console.log(`        · ${(e.start?.dateTime ?? e.start?.date ?? '?').slice(0, 16)}  ${e.summary}`)
} catch (e) {
  bad('cannot read events', e.message)
}

if (!full) {
  console.log('\n=== write access (probe only, nothing created) ===')
  try {
    await calendar.events.insert({ calendarId: CAL_ID, requestBody: {} })
  } catch (e) {
    const code = e.code ?? e.response?.status
    if (code === 400) ok('write authorised', 'rejected on payload, not permission')
    else if (code === 403) bad('write denied', 'account lacks writer access to this calendar')
    else if (code === 404) bad('calendar not found', 'share it with this account, or use GOOGLE_CALENDAR_ID=primary')
    else bad('unexpected', `${code} ${e.message}`)
  }
  console.log('\nRun with --full to also verify customer invitations.')
} else {
  console.log('\n=== full round trip (creates then deletes one event) ===')
  const DATE = '2030-11-14'
  let id = null
  try {
    const res = await calendar.events.insert({
      calendarId: CAL_ID,
      sendUpdates: 'none', // never email the placeholder address
      requestBody: {
        summary: 'ZZ SETUP CHECK — auto-deleted',
        description: 'Created by scripts/check-calendar.mjs. Deleted automatically.',
        start: { dateTime: `${DATE}T15:00:00`, timeZone: 'Europe/Malta' },
        end:   { dateTime: `${DATE}T16:00:00`, timeZone: 'Europe/Malta' },
        attendees: [{ email: 'nobody@example.com', displayName: 'Invite capability probe' }],
      },
    })
    id = res.data.id
    ok('event created')
    const invited = (res.data.attendees ?? []).length > 0
    if (invited) ok('CUSTOMER INVITATIONS WORK', 'attendee accepted by Google')
    else bad('attendee was dropped', 'customers will not receive invitations')
  } catch (e) {
    if (/Domain-Wide Delegation/.test(e.message)) {
      bad('CUSTOMER INVITATIONS DO NOT WORK', 'service accounts cannot invite attendees')
      console.log('        the app falls back to a shop-only event, so bookings are still recorded')
    } else {
      bad('could not create event', `${e.code ?? ''} ${e.message}`)
    }
  }
  if (id) {
    try {
      await calendar.events.delete({ calendarId: CAL_ID, eventId: id, sendUpdates: 'none' })
      ok('test event deleted — calendar left clean')
    } catch (e) {
      bad('could not delete test event', `remove "ZZ SETUP CHECK" on ${DATE} by hand: ${e.message}`)
    }
  }
}

console.log(`\n${fail === 0 ? '✓ all checks passed' : '✗ ' + fail + ' problem(s)'}`)
process.exit(fail === 0 ? 0 : 1)
