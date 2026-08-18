/**
 * One-time setup: connect the shop's own Google account to the booking calendar.
 *
 * Why this exists
 * ---------------
 * The service account cannot invite customers. Google rejects it with "Service
 * accounts cannot invite attendees without Domain-Wide Delegation of Authority",
 * so a booking lands on the shop calendar but the customer never gets an
 * invitation. Acting as a real Google account removes that limit.
 *
 * Everything below runs on this machine. You sign in to Google in your own
 * browser; the only thing that comes back here is a refresh token, which is
 * printed for you to paste into .env.local. Nothing is uploaded anywhere.
 *
 * Before running — in console.cloud.google.com, project polar-leaf-482007-f3:
 *   1. APIs & Services → OAuth consent screen
 *        · User type: External
 *        · Fill in app name + your support email, then Save
 *        · Under "Test users", add the Google account that owns the shop calendar
 *          (leaving the app in Testing mode is fine — see the note at the end)
 *   2. APIs & Services → Credentials → Create credentials → OAuth client ID
 *        · Application type: Web application
 *        · Authorised redirect URI: http://localhost:5787/callback
 *        · Copy the client ID and client secret
 *   3. Make sure the Google Calendar API is enabled for the project.
 *
 * Then run:
 *   node scripts/setup-calendar-oauth.mjs <client-id> <client-secret>
 */
import http from 'node:http'
import { google } from 'googleapis'

const PORT = 5787
const REDIRECT = `http://localhost:${PORT}/callback`
const SCOPES = ['https://www.googleapis.com/auth/calendar']

const [, , clientId, clientSecret] = process.argv
if (!clientId || !clientSecret) {
  console.error('Usage: node scripts/setup-calendar-oauth.mjs <client-id> <client-secret>')
  console.error('Get both from Google Cloud Console → APIs & Services → Credentials.')
  process.exit(1)
}

const oauth = new google.auth.OAuth2(clientId, clientSecret, REDIRECT)

// prompt:'consent' forces Google to return a refresh token even if this account
// has authorised the app before — without it a repeat run yields only an access
// token and the setup silently produces nothing usable.
const authUrl = oauth.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
})

console.log('\n1. Open this URL and sign in as the account that owns the shop calendar:\n')
console.log(`   ${authUrl}\n`)
console.log('2. Approve the calendar permission. You will be redirected back here.\n')
console.log(`   (waiting on ${REDIRECT} …)\n`)

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    if (url.pathname !== '/callback') { res.writeHead(404).end(); return }

    const err = url.searchParams.get('error')
    const got = url.searchParams.get('code')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(
      `<body style="font-family:system-ui;padding:3rem;text-align:center">
         <h2>${err ? 'Authorisation failed' : 'Connected'}</h2>
         <p>${err ? err : 'You can close this tab and go back to the terminal.'}</p>
       </body>`
    )
    server.close()
    err ? reject(new Error(err)) : resolve(got)
  })
  server.listen(PORT)
  setTimeout(() => { server.close(); reject(new Error('timed out after 5 minutes')) }, 5 * 60_000)
})

const { tokens } = await oauth.getToken(code)
if (!tokens.refresh_token) {
  console.error('\nGoogle did not return a refresh token.')
  console.error('Revoke the app at https://myaccount.google.com/permissions and run this again.')
  process.exit(1)
}

// Confirm the token actually works against the calendar before handing it over.
oauth.setCredentials({ refresh_token: tokens.refresh_token })
const calendar = google.calendar({ version: 'v3', auth: oauth })
try {
  const me = await google.oauth2({ version: 'v2', auth: oauth }).userinfo.get()
  console.log(`\n✓ Signed in as ${me.data.email}`)
} catch { /* userinfo scope not granted — not fatal */ }

const calId = process.env.GOOGLE_CALENDAR_ID
if (calId) {
  try {
    const cal = await calendar.calendars.get({ calendarId: calId })
    console.log(`✓ Can reach calendar "${cal.data.summary}" (${cal.data.timeZone})`)
  } catch (e) {
    console.warn(`! Could not reach GOOGLE_CALENDAR_ID (${e.message})`)
    console.warn('  Either share that calendar with the account you just signed in as,')
    console.warn('  or set GOOGLE_CALENDAR_ID=primary to use its own calendar.')
  }
}

console.log('\n─────────────────────────────────────────────────────────────')
console.log('Add these three lines to .env.local AND to Netlify env vars:\n')
console.log(`GOOGLE_OAUTH_CLIENT_ID=${clientId}`)
console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${clientSecret}`)
console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`)
console.log('\n─────────────────────────────────────────────────────────────')
console.log('The app picks these up automatically and stops using the service')
console.log('account for calendar work. Verify with:')
console.log('  node scripts/check-calendar.mjs')
console.log('\nNote: while the OAuth consent screen is in "Testing" mode Google')
console.log('expires refresh tokens after 7 days. Publish the app (consent screen')
console.log('→ Publish) to make it permanent. No verification review is needed')
console.log('while it is only used by your own account.')
