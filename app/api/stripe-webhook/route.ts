import { google } from 'googleapis'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { invoiceEmailHtml } from '@/lib/invoice-email'

// ─── clients ────────────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})
const resend = new Resend(process.env.RESEND_API_KEY)

function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

// ─── Invoices sheet column index (0-based) ───────────────────────────────────
// A  invoice_id      0
// B  customer_name   1
// C  customer_email  2
// D  amount_cents    3
// E  currency        4
// F  description     5
// G  status          6  ← set to 'paid'
// H  paid_at         7  ← set to ISO timestamp
// I  created_at      8
// J  lead_id         9

// Next.js App Router: disable body parsing so we can verify Stripe's raw body
export const config = { api: { bodyParser: false } }

// ─── POST /api/stripe-webhook ────────────────────────────────────────────────

export async function POST(request: Request) {
  const sig     = request.headers.get('stripe-signature') ?? ''
  const secret  = process.env.STRIPE_WEBHOOK_SECRET!
  const rawBody = Buffer.from(await request.arrayBuffer())

  // 1. Verify signature
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('[/api/stripe-webhook] Signature verification failed:', err)
    return NextResponse.json({ message: 'Webhook signature invalid.' }, { status: 400 })
  }

  // 2. Only handle checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session    = event.data.object as Stripe.Checkout.Session
  const invoice_id = session.metadata?.invoice_id?.trim()

  if (!invoice_id) {
    console.warn('[/api/stripe-webhook] No invoice_id in session metadata:', session.id)
    return NextResponse.json({ received: true })
  }

  // 3. Find invoice row in Invoices sheet
  let rowIndex: number | undefined
  let invoiceRow: string[] | undefined

  try {
    const sheets = getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      range: 'Invoices!A:J',
    })
    const rows = res.data.values ?? []
    const dataRows = rows.slice(1) // skip header
    const idx = dataRows.findIndex((row) => row[0]?.toString().trim() === invoice_id)
    if (idx !== -1) {
      rowIndex   = idx + 2  // +1 for slice offset, +1 for header
      invoiceRow = dataRows[idx]
    }
  } catch (err) {
    console.error('[/api/stripe-webhook] Sheets read error:', err)
    return NextResponse.json({ message: 'Sheets read failed.' }, { status: 502 })
  }

  if (rowIndex === undefined || !invoiceRow) {
    console.warn(`[/api/stripe-webhook] invoice_id ${invoice_id} not found in sheet.`)
    return NextResponse.json({ received: true, warning: 'invoice_id not found' })
  }

  // 4. Mark invoice as paid in sheet
  const paid_at = new Date().toISOString()
  try {
    const sheets = getSheetsClient()
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      range: `Invoices!G${rowIndex}:H${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['paid', paid_at]] },
    })
    console.log(`[/api/stripe-webhook] Invoice ${invoice_id} marked paid at ${paid_at}`)
  } catch (err) {
    console.error('[/api/stripe-webhook] Sheets write error:', err)
    return NextResponse.json({ message: 'Sheets write failed.' }, { status: 502 })
  }

  // 5. Send invoice confirmation email
  const customerEmail = invoiceRow[2]?.toString() || session.customer_email || ''
  const customerName  = invoiceRow[1]?.toString() || session.metadata?.customer_name || ''
  const amountCents   = parseInt(invoiceRow[3] ?? '0', 10)
  const currency      = invoiceRow[4]?.toString() || 'EUR'
  const description   = invoiceRow[5]?.toString() || 'OddlyCraft session'

  if (customerEmail) {
    try {
      await resend.emails.send({
        from:    process.env.RESEND_FROM!,
        to:      customerEmail,
        subject: '🎉 Payment confirmed — your OddlyCraft receipt',
        html: invoiceEmailHtml({
          name:        customerName,
          email:       customerEmail,
          invoiceId:   invoice_id,
          description,
          amountCents,
          currency,
          paidAt:      paid_at,
        }),
      })
    } catch (err) {
      console.error('[/api/stripe-webhook] Invoice email error:', err)
      // Non-fatal — sheet is already updated
    }
  }

  return NextResponse.json({ received: true, invoice_id, paid_at })
}
