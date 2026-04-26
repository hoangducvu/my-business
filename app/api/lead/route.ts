import arcjet, { detectBot, shield, slidingWindow, validateEmail } from '@arcjet/next'
import { google } from 'googleapis'
import { Resend } from 'resend'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { bookingConfirmEmailHtml, ownerBookingNotifHtml } from '@/lib/email-templates'
import { createBookingCalendarEvent } from '@/lib/google-calendar'

const OWNER_EMAIL = 'vuhoangduc1701@gmail.com'

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({ mode: 'LIVE', allow: [] }),
    slidingWindow({ mode: 'LIVE', characteristics: ['ip.src'], interval: '1h', max: 5 }),
    validateEmail({ mode: 'LIVE', deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'] }),
  ],
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Missing RESEND_API_KEY env var')
  return new Resend(key)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

// Auto-creates the Invoices tab with headers if it doesn't exist yet
async function ensureInvoicesSheet() {
  const sheets = getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!

  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = meta.data.sheets?.some((s) => s.properties?.title === 'Invoices')

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'Invoices' } } }],
      },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Invoices!A1:J1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['invoice_id','customer_name','customer_email','amount_cents','currency','description','status','paid_at','created_at','lead_id']],
      },
    })
    console.log('[lead] Created Invoices sheet with headers')
  }
}

// ─── Activity price map (cents) ─────────────────────────────────────────────
const ACTIVITY_PRICES: Record<string, number> = {
  phonecase: 2800,   // €28.00
  bracelet:  1500,   // €15.00 deposit
}

const ACTIVITY_LABELS: Record<string, string> = {
  phonecase:  'Phone Case (€28)',
  bracelet:   'Italian Charm Bracelet (from €15)',
  pencilcase: 'Pencil Case',
  locket:     'Locket Heart',
  nightlamp:  'Night Lamp',
}

const LOCATION_LABELS: Record<string, string> = {
  plaza:   'The Plaza Sliema — Level 2',
  mercury: 'Mercury Tower — Level B1',
}


function newsletterEmailHtml(name: string) {
  const firstName = name.split(' ')[0] || name
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FFF0F4;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF0F4;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#7B1A38;padding:28px 32px;text-align:center;">
    <p style="margin:0;font-size:28px;">🎉</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">You're on the list!</h1>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 16px;font-size:16px;color:#3D0E1E;">Hey <strong>${firstName}</strong> 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      Welcome to the OddlyCraft community! Watch your inbox for exclusive deals, new workshops, and early-bird spots.
    </p>
    <p style="margin:0;font-size:14px;color:#9B3A54;">Can't wait to craft with you ♡<br><strong>The OddlyCraft Team</strong></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── POST /api/lead ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Parse body
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 }) }

  // 2. Extract fields
  const email     = body.email?.toString().trim()         ?? ''
  const name      = body.name?.toString().trim()          ?? ''
  const phone     = body.phone?.toString().trim()         ?? ''
  const type      = body.type?.toString()                 ?? 'booking'
  const date      = body.date?.toString()                 ?? ''
  const time      = body.time?.toString()                 ?? ''
  const activity  = body.activity?.toString()             ?? ''
  const location  = body.location?.toString().toLowerCase() ?? ''
  const partySize = Number(body.partySize)                || 1

  // 3. Validate email
  if (!email) return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 })

  // 4. Arcjet
  const decision = await aj.protect(request, { email })
  if (decision.isErrored()) {
    console.warn('[/api/lead] Arcjet error — allowing through:', decision.reason)
  } else if (decision.isDenied()) {
    if (decision.reason.isBot())       return NextResponse.json({ message: 'Automated requests are not allowed.' }, { status: 403 })
    if (decision.reason.isRateLimit()) return NextResponse.json({ message: 'Too many submissions. Please wait and try again.' }, { status: 429 })
    if (decision.reason.isEmail())     return NextResponse.json({ message: 'Please enter a valid, working email address.' }, { status: 400 })
    if (decision.reason.isShield())    return NextResponse.json({ message: 'Request blocked.' }, { status: 403 })
    return NextResponse.json({ message: 'Request denied.' }, { status: 403 })
  }

  // 5. Write to Leads sheet
  let leadId: string
  try {
    const sheets  = getSheetsClient()
    leadId        = crypto.randomUUID()
    const submittedAt = new Date().toISOString()
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      range: 'Leads!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[leadId, name, email, phone, type, submittedAt, date, time, activity, partySize, location]] },
    })
  } catch (err) {
    console.error('[/api/lead] Failed to write to Leads sheet:', err)
    return NextResponse.json({ message: 'Could not process your submission. Please try again.' }, { status: 502 })
  }

  // 6. For newsletter, just send email and return
  if (type === 'newsletter') {
    try {
      await getResend().emails.send({
        from: process.env.RESEND_FROM!,
        to: email,
        subject: '🎉 Welcome to OddlyCraft!',
        html: newsletterEmailHtml(name),
      })
    } catch (err) {
      console.error('[/api/lead] Newsletter email error:', err)
    }
    const [firstname] = name.split(' ')
    return NextResponse.json({
      success: true,
      message: `You're in, ${firstname || email}! Watch your inbox for exclusive deals.`,
    })
  }

  // 7. Booking — check if activity has a Stripe price
  const unitCents   = ACTIVITY_PRICES[activity] ?? 0
  const totalCents  = unitCents * partySize
  const hasPricing  = totalCents > 0

  if (!hasPricing) {
    // Walk-in activity — send confirmation email to customer + owner, create calendar event
    const resend = getResend()
    const [customerResult, ownerResult] = await Promise.allSettled([
      resend.emails.send({
        from:    process.env.RESEND_FROM!,
        to:      email,
        subject: '🎨 Your OddlyCraft spot is confirmed!',
        html:    bookingConfirmEmailHtml({ name, email, date, time, activity, partySize, location, paid: false }),
      }),
      resend.emails.send({
        from:    process.env.RESEND_FROM!,
        to:      OWNER_EMAIL,
        subject: `📋 New Booking: ${name} — ${activity} on ${date} at ${time}`,
        html:    ownerBookingNotifHtml({ name, email, phone, date, time, activity, partySize, location, paid: false }),
      }),
    ])
    if (customerResult.status === 'rejected') console.error('[/api/lead] Customer email error:', customerResult.reason)
    if (ownerResult.status === 'rejected')   console.error('[/api/lead] Owner email error:', ownerResult.reason)

    createBookingCalendarEvent({ name, email, phone, date, time, activity, partySize, location, paid: false })
      .catch((err) => console.error('[/api/lead] Calendar event error:', err))

    const [firstname] = name.split(' ')
    return NextResponse.json({
      success: true,
      message: `Booking confirmed, ${firstname || email}! Check your inbox for details.`,
    })
  }

  // 8. Priced activity — create Invoice row and Stripe Checkout Session
  const invoiceId  = crypto.randomUUID()
  const actLabel   = ACTIVITY_LABELS[activity] ?? activity
  const locLabel   = LOCATION_LABELS[location] ?? location
  const description = `${actLabel} × ${partySize} — ${locLabel} on ${date} at ${time}`
  const createdAt  = new Date().toISOString()

  // Write invoice row: A=invoice_id B=customer_name C=customer_email D=amount_cents E=currency F=description G=status H=paid_at I=created_at J=lead_id
  try {
    await ensureInvoicesSheet()   // creates tab + headers if missing
    const sheets = getSheetsClient()
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      range: 'Invoices!A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[invoiceId, name, email, totalCents, 'EUR', description, 'pending', '', createdAt, leadId]],
      },
    })
  } catch (err) {
    console.error('[/api/lead] Failed to write Invoice row:', err)
    return NextResponse.json({ message: 'Could not create invoice. Please try again.' }, { status: 502 })
  }

  // Create Stripe Checkout Session
  let checkoutUrl: string
  try {
    const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: totalCents,
          product_data: { name: description },
        },
        quantity: 1,
      }],
      customer_email: email,
      metadata: {
        invoice_id:    invoiceId,
        lead_id:       leadId,
        customer_name: name,
        activity,
        location,
        date,
        time,
        party_size:    String(partySize),
      },
      success_url: `${origin}/portal?payment=success&invoice=${invoiceId}`,
      cancel_url:  `${origin}/?payment=cancelled#book`,
    })
    checkoutUrl = session.url!
  } catch (err) {
    console.error('[/api/lead] Stripe error:', err)
    return NextResponse.json({ message: 'Could not create payment session. Please try again.' }, { status: 502 })
  }

  // Notify owner + create calendar event (pending until Stripe payment completes)
  const resend = getResend()
  await Promise.allSettled([
    resend.emails.send({
      from:    process.env.RESEND_FROM!,
      to:      OWNER_EMAIL,
      subject: `⏳ Pending Payment: ${name} — ${activity} on ${date} at ${time}`,
      html:    ownerBookingNotifHtml({ name, email, phone, date, time, activity, partySize, location, paid: false }),
    }),
    createBookingCalendarEvent({ name, email, phone, date, time, activity, partySize, location, paid: false })
      .catch((err) => console.error('[/api/lead] Calendar event error:', err)),
  ])

  return NextResponse.json({
    success: true,
    checkoutUrl,
    message: 'Booking confirmed — completing payment now.',
  })
}
tySize, location, paid: false })
      .catch((err) => console.error('[/api/lead] Calendar event error:', err)),
  ])

  return NextResponse.json({
    success: true,
    checkoutUrl,
    message: 'Booking confirmed — completing payment now.',
  })
}
