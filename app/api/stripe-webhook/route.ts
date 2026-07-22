import { google } from 'googleapis'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { updateInventoryQty } from '@/lib/sheets-inventory'

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

  // Only charm-bracelet orders are handled now (Stripe emails the receipt itself).
  if (meta.product_type !== 'italian_charm_bracelet') {
    return NextResponse.json({ received: true })
  }

  const paid_at       = new Date().toISOString()
  const customerEmail = session.customer_email ?? session.customer_details?.email ?? ''
  const metal         = meta.metal ?? 'silver'
  const numLinks      = parseInt(meta.num_links ?? '18', 10)
  const charms        = meta.charms ?? ''
  const totalCents    = parseInt(meta.total_cents ?? '0', 10)

  // 1. Record the order
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

  // 2. Decrement real stock now that payment is confirmed (charm_qty is "id:qty,id:qty").
  const charmQty = meta.charm_qty ?? ''
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
  return NextResponse.json({ received: true, session_id: session.id })
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
