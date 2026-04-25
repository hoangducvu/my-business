import { google } from 'googleapis'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

// ─── clients ────────────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  return google.sheets({ version: 'v4', auth })
}

// ─── Invoices sheet column index (0-based) ───────────────────────────────────
// A  invoice_id
// B  customer_name
// C  customer_email
// D  amount_cents   (integer, e.g. 2800 = €28.00)
// E  currency       (e.g. EUR)
// F  description
// G  status
// H  paid_at
// I  created_at

const COL = {
  invoice_id:     0,
  customer_name:  1,
  customer_email: 2,
  amount_cents:   3,
  currency:       4,
  description:    5,
  status:         6,
}

// ─── POST /api/create-checkout ───────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Parse body
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 }) }

  const invoice_id = body.invoice_id?.toString().trim()
  if (!invoice_id) {
    return NextResponse.json({ message: 'invoice_id is required.' }, { status: 400 })
  }

  // 2. Look up invoice row in Google Sheets
  let invoiceRow: string[] | undefined
  try {
    const sheets = getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      range: 'Invoices!A:I',
    })
    const rows = res.data.values ?? []
    // Skip header row (row 0), find matching invoice_id
    invoiceRow = rows.slice(1).find(
      (row) => row[COL.invoice_id]?.toString().trim() === invoice_id
    )
  } catch (err) {
    console.error('[/api/create-checkout] Sheets read error:', err)
    return NextResponse.json({ message: 'Could not read invoice data.' }, { status: 502 })
  }

  if (!invoiceRow) {
    return NextResponse.json({ message: `Invoice ${invoice_id} not found.` }, { status: 404 })
  }

  const status = invoiceRow[COL.status]?.toString().toLowerCase()
  if (status === 'paid') {
    return NextResponse.json({ message: 'Invoice already paid.' }, { status: 409 })
  }

  const amountCents = parseInt(invoiceRow[COL.amount_cents] ?? '0', 10)
  const currency    = (invoiceRow[COL.currency] ?? 'EUR').toLowerCase()
  const description = invoiceRow[COL.description] ?? 'Invoice payment'
  const customerEmail = invoiceRow[COL.customer_email]?.toString().trim() || undefined
  const customerName  = invoiceRow[COL.customer_name]?.toString().trim()  || undefined

  if (!amountCents || amountCents <= 0) {
    return NextResponse.json({ message: 'Invalid invoice amount.' }, { status: 422 })
  }

  // 3. Create Stripe Checkout Session
  let session: Stripe.Checkout.Session
  try {
    const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: { name: description },
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        invoice_id,
        customer_name: customerName ?? '',
      },
      success_url: `${origin}/portal?payment=success&invoice=${invoice_id}`,
      cancel_url:  `${origin}/portal?payment=cancelled&invoice=${invoice_id}`,
    })
  } catch (err) {
    console.error('[/api/create-checkout] Stripe error:', err)
    return NextResponse.json({ message: 'Could not create checkout session.' }, { status: 502 })
  }

  return NextResponse.json({ url: session.url })
}
