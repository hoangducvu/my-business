import { google } from 'googleapis'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createBookingCalendarEvent } from '@/lib/google-calendar'
import { updateInventoryQty } from '@/lib/sheets-inventory'
import { markBookingPaid } from '@/lib/sheets-bookings'
import { deductStock } from '@/lib/sheets-phonecases'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export async function POST(request: Request) {
  const sig     = request.headers.get('stripe-signature') ?? ''
  const secret  = process.env.STRIPE_WEBHOOK_SECRET!
  const rawBody = Buffer.from(await request.arrayBuffer())

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('[/api/stripe-webhook] Signature verification failed:', err)
    return NextResponse.json({ message: 'Webhook signature invalid.' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta    = (session.metadata ?? {}) as Record<string, string>
  const paid_at = new Date().toISOString()

  if (meta.product_type === 'italian_charm_bracelet') {
    return handleCharmOrder(session, meta, paid_at)
  }

  const booking_id = meta.booking_id?.trim()
  if (!booking_id) {
    console.warn('[/api/stripe-webhook] No booking_id or product_type in metadata:', session.id)
    return NextResponse.json({ received: true })
  }

  return handleBookingPayment(session, meta, booking_id, paid_at)
}

// ─── Charm-bracelet order: record + decrement stock (Stripe emails the receipt) ─
async function handleCharmOrder(
  session:  Stripe.Checkout.Session,
  meta:     Record<string, string>,
  paid_at:  string,
) {
  const customerEmail = session.customer_email ?? session.customer_details?.email ?? ''
  const metal         = meta.metal ?? 'silver'
  const numLinks      = parseInt(meta.num_links ?? '18', 10)
  const charms        = meta.charms ?? ''
  const charmQty      = meta.charm_qty ?? ''   // id:qty list — used to show charm images in admin
  const totalCents    = parseInt(meta.total_cents ?? '0', 10)

  try {
    await ensureCharmOrdersSheet()
    const sheets = getSheetsClient()
    await sheets.spreadsheets.values.append({
      spreadsheetId:    process.env.GOOGLE_SPREADSHEET_ID!,
      range:            'CharmOrders!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[session.id, customerEmail, metal, numLinks, charms, totalCents, paid_at, charmQty]],
      },
    })
  } catch (err) {
    console.error('[/api/stripe-webhook] CharmOrders sheet write error:', err)
  }

  if (charmQty) {
    await Promise.allSettled(
      charmQty.split(',').map((pair) => {
        const [id, q] = pair.split(':')
        const n = parseInt(q ?? '0', 10)
        return id && n > 0 ? updateInventoryQty(id.trim(), -n) : Promise.resolve(null)
      })
    )
  }

  console.log('[/api/stripe-webhook] Charm order processed:', session.id)
  return NextResponse.json({ received: true, type: 'charm_order', session_id: session.id })
}

// ─── Booking payment: mark the booking paid + add to calendar ──────────────────
async function handleBookingPayment(
  session:    Stripe.Checkout.Session,
  meta:       Record<string, string>,
  booking_id: string,
  paid_at:    string,
) {
  try {
    await markBookingPaid(booking_id)
  } catch (err) {
    console.error('[/api/stripe-webhook] Failed to mark booking paid:', err)
    return NextResponse.json({ message: 'Booking update failed.' }, { status: 502 })
  }

  const customerEmail = session.customer_email ?? session.customer_details?.email ?? ''
  const customerName  = meta.customer_name ?? ''
  const activity      = meta.activity ?? ''
  const location      = meta.location ?? ''
  const date          = meta.date     ?? ''
  const time          = meta.time     ?? ''
  const phone         = meta.phone    ?? ''
  const partySize     = parseInt(meta.party_size ?? '1', 10)
  const isBooking     = !!(activity && location && date && time)

  if (isBooking) {
    // Create the calendar event now that payment is confirmed
    await createBookingCalendarEvent({ name: customerName, email: customerEmail, phone, date, time, activity, partySize, location, paid: true })
      .catch((err) => console.error('[/api/stripe-webhook] Calendar event error:', err))
  }

  // Deduct phone-case stock from the shop the booking is for (Plaza/Mercury).
  if (activity === 'phonecase' && meta.phone_model && (location === 'plaza' || location === 'mercury')) {
    await deductStock(meta.phone_brand ?? '', meta.phone_model, location, partySize)
      .catch((err) => console.error('[/api/stripe-webhook] Phone-case stock deduct error:', err))
  }

  console.log('[/api/stripe-webhook] Booking', booking_id, 'marked paid at', paid_at)
  return NextResponse.json({ received: true, booking_id, paid_at })
}

async function ensureCharmOrdersSheet() {
  const sheets        = getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
  const meta          = await sheets.spreadsheets.get({ spreadsheetId })
  const exists        = meta.data.sheets?.some((s) => s.properties?.title === 'CharmOrders')

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: 'CharmOrders' } } }] },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range:            'CharmOrders!A1:H1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['stripe_session_id', 'customer_email', 'metal', 'num_links', 'charms', 'total_cents', 'paid_at', 'charm_qty']],
      },
    })
    console.log('[stripe-webhook] Created CharmOrders sheet')
  }
}
