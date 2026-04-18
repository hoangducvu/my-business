import arcjet, { detectBot, shield, slidingWindow, validateEmail } from '@arcjet/next'
import { NextResponse } from 'next/server'

// ── Arcjet instance — created once at module level ────────────────────────────
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // General attack protection (SQLi, XSS, path traversal, etc.)
    shield({ mode: 'LIVE' }),

    // Block all automated bots — allow: [] means no bots permitted
    detectBot({ mode: 'LIVE', allow: [] }),

    // 5 submissions per IP per hour
    slidingWindow({
      mode: 'LIVE',
      characteristics: ['ip.src'],
      interval: '1h',
      max: 5,
    }),

    // Reject disposable, invalid, and no-MX-record email addresses.
    // FREE (gmail, yahoo etc.) is intentionally allowed — real customers use them.
    validateEmail({
      mode: 'LIVE',
      deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
    }),
  ],
})

const HUBSPOT_CONTACTS_URL = 'https://api.hubapi.com/crm/v3/objects/contacts'

export async function POST(request: Request) {
  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }

  // ── 2. Extract fields ──────────────────────────────────────────────────────
  const email   = body.email?.toString().trim()   ?? ''
  const name    = body.name?.toString().trim()    ?? ''
  const phone   = body.phone?.toString().trim()   ?? ''
  const company = body.company?.toString().trim() ?? ''
  const type    = body.type?.toString()           ?? 'booking'
  const date      = body.date?.toString()     ?? ''
  const time      = body.time?.toString()     ?? ''
  const activity  = body.activity?.toString() ?? ''
  const partySize = body.partySize != null ? String(body.partySize) : ''

  // ── 3. Quick empty check — needed before Arcjet since it requires the email ─
  if (!email) {
    return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
  }

  // ── 4. Arcjet — bot detection, rate limit, email validation ───────────────
  // validateEmail requires the email to be passed as the second argument.
  // If Arcjet itself errors (network issue etc.) we log but let the request
  // through so a real user is never blocked by an infra outage.
  const decision = await aj.protect(request, { email })

  if (decision.isErrored()) {
    console.warn('[/api/lead] Arcjet error — allowing request through:', decision.reason)
  } else if (decision.isDenied()) {
    if (decision.reason.isBot()) {
      return NextResponse.json(
        { message: 'Automated requests are not allowed.' },
        { status: 403 }
      )
    }
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { message: 'Too many submissions. Please wait a while and try again.' },
        { status: 429 }
      )
    }
    if (decision.reason.isEmail()) {
      return NextResponse.json(
        { message: 'Please enter a valid, working email address.' },
        { status: 400 }
      )
    }
    if (decision.reason.isShield()) {
      return NextResponse.json(
        { message: 'Request blocked.' },
        { status: 403 }
      )
    }
    return NextResponse.json({ message: 'Request denied.' }, { status: 403 })
  }

  // ── 5. Guard — API key must be configured ─────────────────────────────────
  const apiKey = process.env.HUBSPOT_API_KEY
  if (!apiKey || apiKey === 'your_hubspot_private_app_token_here') {
    console.error('[/api/lead] HUBSPOT_API_KEY is not set')
    return NextResponse.json(
      { message: 'Server configuration error. Please contact us directly.' },
      { status: 500 }
    )
  }

  // ── 6. Build HubSpot contact properties ───────────────────────────────────
  const [firstname = '', ...rest] = name.split(' ')
  const lastname = rest.join(' ')

  const properties: Record<string, string> = { email }
  if (firstname) properties.firstname = firstname
  if (lastname)  properties.lastname  = lastname
  if (phone)     properties.phone     = phone
  if (company)   properties.company   = company

  // ── 7. POST to HubSpot ────────────────────────────────────────────────────
  let hubspotRes: Response
  try {
    hubspotRes = await fetch(HUBSPOT_CONTACTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ properties }),
    })
  } catch (err) {
    console.error('[/api/lead] Network error reaching HubSpot:', err)
    return NextResponse.json(
      { message: 'Could not reach our CRM. Please try again.' },
      { status: 502 }
    )
  }

  // ── 8. Handle HubSpot response ────────────────────────────────────────────
  if (!hubspotRes.ok) {
    const errBody = await hubspotRes.json().catch(() => ({})) as { message?: string; error?: string }
    console.error('[/api/lead] HubSpot error', hubspotRes.status, errBody)

    // 409 = contact already exists — fine, they're in the CRM
    if (hubspotRes.status !== 409) {
      return NextResponse.json(
        { message: 'Could not save your details. Please try again or contact us directly.' },
        { status: 502 }
      )
    }
  }

  // ── 9. Success ─────────────────────────────────────────────────────────────
  const displayName = firstname || email
  const message =
    type === 'newsletter'
      ? `You're in, ${displayName}! 🎉 Watch your inbox for exclusive deals.`
      : `Woohoo! Spot reserved, ${displayName}! 🎉 We'll confirm within 1 hour at ${email}.`

  return NextResponse.json({ success: true, message })
}
