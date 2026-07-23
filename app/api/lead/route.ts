import { google } from 'googleapis'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createBookingCalendarEvent } from '@/lib/google-calendar'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function siteOrigin(request: Request) {
  return request.headers.get('origin') ?? 'https://oddlycraft.netlify.app'
}

function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

async function ensureInvoicesSheet() {
  const sheets = getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = meta.data.sheets?.some((s) => s.properties?.title === 'Invoices')
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: 'Invoices' } } }] },
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

const ACTIVITY_PRICES: Record<string, number> = {
  phonecase: 2800,
  bracelet:  1500,
}

const ACTIVITY_LABELS: Record<string, string> = {
  phonecase:    'Phone Case (€28)',
  bracelet:     'Italian Charm Bracelet (from €15)',
  pencilcase:   'Pencil Case',
  locket:       'Locket Heart',
  passportcover:'Passport Cover',
  bagcharm:     'Bag Charm',
  beadbracelet: 'Bead Bracelet',
  phonechain:   'Phone Chain',
}

const LOCATION_LABELS: Record<string, string> = {
  plaza:   'The Plaza Sliema — Level 2',
  mercury: 'Mercury Tower — Level B1',
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 }) }

  const email     = body.email?.toString().trim()           ?? ''
  const name      = body.name?.toString().trim()            ?? ''
  const phone     = body.phone?.toString().trim()           ?? ''
  const type      = body.type?.toString()                   ?? 'booking'
  const date      = body.date?.toString()                   ?? ''
  const time      = body.time?.toString()                   ?? ''
  const activity  = body.activity?.toString()               ?? ''
  const location  = body.location?.toString().toLowerCase() ?? ''
  const partySize = Number(body.partySize)                  || 1

  if (!email) return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 })

  // Race-condition guard: re-check slot availability before writing
  if (type === 'booking' && date && time && location) {
    try {
      const sheets   = getSheetsClient()
      const checkRes = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
        range: 'Leads!A2:K',
      })
      const alreadyBooked = (checkRes.data.values ?? []).some((row) =>
        row[4]?.toString().trim() === 'booking' &&
        row[6]?.toString().trim() === date &&
        row[7]?.toString().trim() === time &&
        row[10]?.toString().trim().toLowerCase() === location
      )
      if (alreadyBooked) {
        return NextResponse.json({
          message: 'Sorry, that time slot was just taken. Please choose another time.',
        }, { status: 409 })
      }
    } catch (err) {
      console.error('[/api/lead] Slot availability check error:', err)
    }
  }

  // Write lead to Sheets
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

  if (type === 'newsletter') {
    const [firstname] = name.split(' ')
    return NextResponse.json({
      success: true,
      message: `You're in, ${firstname || email}! We'll be in touch with news and deals.`,
    })
  }

  const unitCents  = ACTIVITY_PRICES[activity] ?? 0
  const totalCents = unitCents * partySize
  const hasPricing = totalCents > 0

  if (!hasPricing) {
    // Walk-in: confirm immediately and add it to the calendar
    try {
      await createBookingCalendarEvent({ name, email, phone, date, time, activity, partySize, location, paid: true })
    } catch (err) {
      console.error('[/api/lead] Calendar event error:', err)
    }
    const [firstname] = name.split(' ')
    return NextResponse.json({
      success: true,
      message: `Booking confirmed, ${firstname || email}! See you there.`,
    })
  }

  // Priced activity — create invoice + Stripe session (Stripe emails the receipt on payment)
  const invoiceId   = crypto.randomUUID()
  const actLabel    = ACTIVITY_LABELS[activity] ?? activity
  const locLabel    = LOCATION_LABELS[location] ?? location
  const description = `${actLabel} × ${partySize} — ${locLabel} on ${date} at ${time}`
  const createdAt   = new Date().toISOString()

  try {
    await ensureInvoicesSheet()
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

  let checkoutUrl: string
  try {
    const origin = siteOrigin(request)
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
      // Stripe emails the customer a payment receipt directly.
      payment_intent_data: { receipt_email: email },
      metadata: {
        invoice_id:    invoiceId,
        lead_id:       leadId,
        customer_name: name,
        phone,
        activity,
        location,
        date,
        time,
        party_size:    String(partySize),
      },
      success_url: `${origin}/?payment=success#book`,
      cancel_url:  `${origin}/?payment=cancelled#book`,
    })
    checkoutUrl = session.url!
  } catch (err) {
    console.error('[/api/lead] Stripe error:', err)
    return NextResponse.json({ message: 'Could not create payment session. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    checkoutUrl,
    message: 'Booking confirmed — completing payment now.',
  })
}
