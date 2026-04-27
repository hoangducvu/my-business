import { google } from 'googleapis'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { invoiceEmailHtml } from '@/lib/invoice-email'
import {
  bookingConfirmEmailHtml,
  ownerBookingNotifHtml,
  charmOrderInvoiceEmailHtml,
  ownerCharmNotifHtml,
} from '@/lib/email-templates'
import { createBookingCalendarEvent } from '@/lib/google-calendar'

const OWNER_EMAIL = 'vuhoangduc1701@gmail.com'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Missing RESEND_API_KEY env var')
  return new Resend(key)
}

function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export const config = { api: { bodyParser: false } }

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

  const invoice_id = meta.invoice_id?.trim()
  if (!invoice_id) {
    console.warn('[/api/stripe-webhook] No invoice_id or product_type in metadata:', session.id)
    return NextResponse.json({ received: true })
  }

  return handleBookingPayment(session, meta, invoice_id, paid_at)
}

async function handleCharmOrder(
  session:  Stripe.Checkout.Session,
  meta:     Record<string, string>,
  paid_at:  string,
) {
  const customerEmail = session.customer_email ?? meta.customer_email ?? ''
  const metal         = meta.metal ?? 'silver'
  const numLinks      = parseInt(meta.num_links ?? '18', 10)
  const charms        = meta.charms ?? ''
  const totalCents    = parseInt(meta.total_cents ?? '0', 10)

  try {
    await ensureCharmOrdersSheet()
    const sheets = getSheetsClient()
    await sheets.spreadsheets.values.append({
      spreadsheetId:    process.env.GOOGLE_SPREADSHEET_ID!,
      range:            'CharmOrders!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[session.id, customerEmail, metal, numLinks, charms, totalCents, paid_at]],
      },
    })
  } catch (err) {
    console.error('[/api/stripe-webhook] CharmOrders sheet write error:', err)
  }

  if (customerEmail) {
    const resend = getResend()
    await Promise.allSettled([
      resend.emails.send({
        from:    process.env.RESEND_FROM!,
        to:      customerEmail,
        subject: 'Your OddlyCraft charm bracelet order is confirmed!',
        html:    charmOrderInvoiceEmailHtml({ email: customerEmail, metal, numLinks, charms, totalCents, paidAt: paid_at }),
      }),
      resend.emails.send({
        from:    process.env.RESEND_FROM!,
        to:      OWNER_EMAIL,
        subject: `New Charm Order from ${customerEmail}`,
        html:    ownerCharmNotifHtml({ email: customerEmail, metal, numLinks, charms, totalCents, paidAt: paid_at }),
      }),
    ])
  }

  console.log('[/api/stripe-webhook] Charm order processed:', session.id)
  return NextResponse.json({ received: true, type: 'charm_order', session_id: session.id })
}

async function handleBookingPayment(
  session:    Stripe.Checkout.Session,
  meta:       Record<string, string>,
  invoice_id: string,
  paid_at:    string,
) {
  let rowIndex:   number | undefined
  let invoiceRow: string[] | undefined

  try {
    const sheets = getSheetsClient()
    const res    = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      range:         'Invoices!A:J',
    })
    const rows     = res.data.values ?? []
    const dataRows = rows.slice(1)
    const idx      = dataRows.findIndex((row) => row[0]?.toString().trim() === invoice_id)
    if (idx !== -1) {
      rowIndex   = idx + 2
      invoiceRow = dataRows[idx]
    }
  } catch (err) {
    console.error('[/api/stripe-webhook] Sheets read error:', err)
    return NextResponse.json({ message: 'Sheets read failed.' }, { status: 502 })
  }

  if (rowIndex === undefined || !invoiceRow) {
    console.warn('[/api/stripe-webhook] invoice_id not found:', invoice_id)
    return NextResponse.json({ received: true, warning: 'invoice_id not found' })
  }

  try {
    const sheets = getSheetsClient()
    await sheets.spreadsheets.values.update({
      spreadsheetId:    process.env.GOOGLE_SPREADSHEET_ID!,
      range:            `Invoices!G${rowIndex}:H${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody:      { values: [['paid', paid_at]] },
    })
  } catch (err) {
    console.error('[/api/stripe-webhook] Sheets write error:', err)
    return NextResponse.json({ message: 'Sheets write failed.' }, { status: 502 })
  }

  const customerEmail = invoiceRow[2]?.toString() || session.customer_email || ''
  const customerName  = invoiceRow[1]?.toString() || meta.customer_name || ''
  const amountCents   = parseInt(invoiceRow[3] ?? '0', 10)
  const currency      = invoiceRow[4]?.toString() || 'EUR'
  const description   = invoiceRow[5]?.toString() || 'OddlyCraft session'

  const activity  = meta.activity   ?? ''
  const location  = meta.location   ?? ''
  const date      = meta.date       ?? ''
  const time      = meta.time       ?? ''
  const phone     = meta.phone      ?? ''
  const partySize = parseInt(meta.party_size ?? '1', 10)
  const isBooking = !!(activity && location && date && time)

  if (customerEmail) {
    const resend = getResend()

    if (isBooking) {
      await Promise.allSettled([
        resend.emails.send({
          from:    process.env.RESEND_FROM!,
          to:      customerEmail,
          subject: '✅ Booking confirmed and paid — OddlyCraft Malta',
          html:    bookingConfirmEmailHtml({ name: customerName, email: customerEmail, date, time, activity, partySize, location, paid: true }),
        }),
        resend.emails.send({
          from:    process.env.RESEND_FROM!,
          to:      OWNER_EMAIL,
          subject: `✅ Paid Booking: ${customerName} — ${activity} on ${date} at ${time}`,
          html:    ownerBookingNotifHtml({ name: customerName, email: customerEmail, date, time, activity, partySize, location, paid: true }),
        }),
        // Create calendar event now that payment is confirmed
        createBookingCalendarEvent({ name: customerName, email: customerEmail, phone, date, time, activity, partySize, location, paid: true })
          .catch((err) => console.error('[/api/stripe-webhook] Calendar event error:', err)),
      ])
    } else {
      await Promise.allSettled([
        resend.emails.send({
          from:    process.env.RESEND_FROM!,
          to:      customerEmail,
          subject: 'Payment confirmed - your OddlyCraft receipt',
          html:    invoiceEmailHtml({ name: customerName, email: customerEmail, invoiceId: invoice_id, description, amountCents, currency, paidAt: paid_at }),
        }),
        resend.emails.send({
          from:    process.env.RESEND_FROM!,
          to:      OWNER_EMAIL,
          subject: `Invoice Paid: ${invoice_id.slice(0, 8).toUpperCase()} from ${customerEmail}`,
          text:    `Invoice ${invoice_id} paid by ${customerName} <${customerEmail}>\nAmount: ${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}\nDescription: ${description}\nPaid at: ${paid_at}`,
        }),
      ])
    }
  }

  console.log('[/api/stripe-webhook] Invoice', invoice_id, 'marked paid at', paid_at)
  return NextResponse.json({ received: true, invoice_id, paid_at })
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
      range:            'CharmOrders!A1:G1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['stripe_session_id', 'customer_email', 'metal', 'num_links', 'charms', 'total_cents', 'paid_at']],
      },
    })
    console.log('[stripe-webhook] Created CharmOrders sheet')
  }
}
