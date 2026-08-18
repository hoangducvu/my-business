import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createBookingCalendarEvent } from '@/lib/google-calendar'
import { appendBooking, getBookings } from '@/lib/sheets-bookings'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function siteOrigin(request: Request) {
  return request.headers.get('origin') ?? 'https://oddlycraft.netlify.app'
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

  const email      = body.email?.toString().trim()           ?? ''
  const name       = body.name?.toString().trim()            ?? ''
  const phone      = body.phone?.toString().trim()           ?? ''
  const date       = body.date?.toString()                   ?? ''
  const time       = body.time?.toString()                   ?? ''
  const activity   = body.activity?.toString()               ?? ''
  const location   = body.location?.toString().toLowerCase() ?? ''
  const partySize  = Number(body.partySize)                  || 1
  const phoneBrand = body.phoneBrand?.toString().trim()      ?? ''
  const phoneModel = body.phoneModel?.toString().trim()      ?? ''

  if (!email) return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 })
  if (!date || !time || !activity || !location) {
    return NextResponse.json({ message: 'Please choose a location, date, time and activity.' }, { status: 400 })
  }
  if (activity === 'phonecase' && !phoneModel) {
    return NextResponse.json({ message: 'Please choose your phone model.' }, { status: 400 })
  }

  const details = activity === 'phonecase' && phoneModel
    ? `${phoneBrand} ${phoneModel}`.trim()
    : ''

  // Race-condition guard: re-check slot availability before writing
  try {
    // Must bypass the read cache: a cached list would defeat the guard.
    const existing = await getBookings({ fresh: true })
    const taken = existing.some((b) => b.date === date && b.time === time && b.location === location)
    if (taken) {
      return NextResponse.json({
        message: 'Sorry, that time slot was just taken. Please choose another time.',
      }, { status: 409 })
    }
  } catch (err) {
    console.error('[/api/book] Slot availability check error:', err)
  }

  const unitCents  = ACTIVITY_PRICES[activity] ?? 0
  const totalCents = unitCents * partySize
  const hasPricing = totalCents > 0

  const bookingId   = crypto.randomUUID()
  const submittedAt = new Date().toISOString()
  const status      = hasPricing ? 'pending' : 'confirmed'

  // Record the booking (this reserves the slot). Paid bookings start 'pending'
  // and are flipped to 'paid' by the Stripe webhook once payment clears.
  try {
    await appendBooking({ id: bookingId, name, email, phone, activity, submittedAt, date, time, partySize, location, status, details })
  } catch (err) {
    console.error('[/api/book] Failed to write booking:', err)
    return NextResponse.json({ message: 'Could not process your booking. Please try again.' }, { status: 502 })
  }

  if (!hasPricing) {
    // Walk-in: confirm immediately and add it to the calendar
    try {
      await createBookingCalendarEvent({ name, email, phone, date, time, activity, partySize, location, paid: true })
    } catch (err) {
      console.error('[/api/book] Calendar event error:', err)
    }
    const [firstname] = name.split(' ')
    return NextResponse.json({
      success: true,
      message: `Booking confirmed, ${firstname || email}! See you there.`,
    })
  }

  // Priced activity — create a Stripe Checkout session. Stripe emails the
  // customer their payment receipt directly on success.
  const actLabel    = ACTIVITY_LABELS[activity] ?? activity
  const locLabel    = LOCATION_LABELS[location] ?? location
  const description = `${actLabel} × ${partySize} — ${locLabel} on ${date} at ${time}`

  let checkoutUrl: string
  try {
    const origin  = siteOrigin(request)
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
      payment_intent_data: { receipt_email: email },
      metadata: {
        booking_id:    bookingId,
        customer_name: name,
        phone,
        activity,
        location,
        date,
        time,
        party_size:    String(partySize),
        phone_brand:   phoneBrand,
        phone_model:   phoneModel,
      },
      success_url: `${origin}/?payment=success#book`,
      cancel_url:  `${origin}/?payment=cancelled#book`,
    })
    checkoutUrl = session.url!
  } catch (err) {
    console.error('[/api/book] Stripe error:', err)
    return NextResponse.json({ message: 'Could not create payment session. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    checkoutUrl,
    message: 'Booking created — completing payment now.',
  })
}
