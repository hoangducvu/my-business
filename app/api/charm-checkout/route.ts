import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getCharmCatalog } from '@/lib/sheets-inventory'

/* ─── Stripe client ─────────────────────────────────────────── */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

/* ─── Types ─────────────────────────────────────────────────── */
interface CharmItem {
  id: string
  name: string
  price: number   // euros
}

interface CharmOrderBody {
  metal: 'silver' | 'gold' | 'bronze'
  numLinks: number
  charms: CharmItem[]
  layout?: string[]   // one entry per link slot, in order; '' = empty (plain) link
  totalCents: number
}

/* ─── Metal labels ──────────────────────────────────────────── */
const METAL_LABEL: Record<string, string> = {
  silver: 'Silver',
  gold: 'Gold (+€6.00)',
  bronze: 'Bronze (+€3.00)',
}

const BASE_PRICES: Record<number, number> = {
  16: 10.00, 17: 10.50, 18: 11.00, 19: 11.50, 20: 12.00,
}
const METAL_SURCHARGE: Record<string, number> = {
  silver: 0, gold: 6.00, bronze: 3.00,
}

/* ─── POST /api/charm-checkout ──────────────────────────────── */
export async function POST(request: Request) {
  let body: CharmOrderBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }

  const { metal, numLinks, charms } = body

  // Basic validation
  if (!metal || !numLinks || !Array.isArray(charms)) {
    return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 })
  }
  if (!BASE_PRICES[numLinks]) {
    return NextResponse.json({ message: 'Invalid bracelet size.' }, { status: 400 })
  }
  if (charms.length === 0) {
    return NextResponse.json({ message: 'Add at least one charm.' }, { status: 400 })
  }

  const origin = request.headers.get('origin') ?? 'https://oddlycraft.netlify.app'

  // Build Stripe line items
  const lineItems: NonNullable<NonNullable<Parameters<typeof stripe.checkout.sessions.create>[0]>['line_items']> = []

  // 1. Bracelet base (frame + links)
  const basePriceCents = Math.round(BASE_PRICES[numLinks] * 100)
  lineItems.push({
    price_data: {
      currency: 'eur',
      unit_amount: basePriceCents,
      product_data: {
        name: `OddlyCraft Italian Charm Bracelet — ${numLinks} links (${METAL_LABEL[metal]})`,
        description: `${numLinks}-link ${metal} bracelet frame with clasp`,
        images: [],
      },
    },
    quantity: 1,
  })

  // 2. Metal surcharge (if any)
  const surcharge = METAL_SURCHARGE[metal]
  if (surcharge > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(surcharge * 100),
        product_data: {
          name: `${METAL_LABEL[metal]} finish upgrade`,
        },
      },
      quantity: 1,
    })
  }

  // 3. Individual charms — resolve authoritative prices from the catalog so the
  //    client cannot tamper with per-charm prices sent in the request body.
  let priceById: Record<string, { price: number; name: string; imageUrl: string }>
  try {
    const catalog = await getCharmCatalog()
    priceById = Object.fromEntries(catalog.map((c) => [c.id, { price: c.price, name: c.name, imageUrl: c.imageUrl }]))
  } catch (err) {
    console.error('[/api/charm-checkout] catalog lookup failed:', err)
    return NextResponse.json({ message: 'Could not verify charm prices. Please try again.' }, { status: 502 })
  }

  const grouped: Record<string, { name: string; price: number; qty: number; imageUrl: string }> = {}
  for (const charm of charms) {
    const known = priceById[charm.id]
    if (!known) {
      return NextResponse.json({ message: `Unknown charm: ${charm.id}` }, { status: 400 })
    }
    if (grouped[charm.id]) grouped[charm.id].qty++
    else grouped[charm.id] = { name: known.name, price: known.price, qty: 1, imageUrl: known.imageUrl }
  }

  for (const { name, price, qty, imageUrl } of Object.values(grouped)) {
    // Stripe only accepts publicly-fetchable image URLs; skip uploaded data-URLs
    // so the picture shows on Checkout/receipt without ever breaking the session.
    const images = imageUrl.startsWith('http') ? [imageUrl] : []
    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(price * 100),
        product_data: { name: `Italian Charm — ${name}`, images },
      },
      quantity: qty,
    })
  }

  // Build order summary + machine-readable id:qty list (for the webhook) for metadata
  const charmSummary = Object.values(grouped)
    .map(({ name, qty }) => `${name}${qty > 1 ? ` ×${qty}` : ''}`)
    .join(', ')
  const charmQtyMeta = Object.entries(grouped)
    .map(([id, g]) => `${id}:${g.qty}`)
    .join(',')

  // Ordered bracelet layout (charm per link, '' = plain link) so the owner can
  // see the assembled bracelet exactly as the customer built it. Only keep known
  // charm ids; drop it if it would blow the 500-char Stripe metadata limit.
  const layoutStr = (Array.isArray(body.layout) ? body.layout : [])
    .map((id) => { const s = (id ?? '').toString(); return s && priceById[s] ? s : '' })
    .join('|')
  const layoutMeta = layoutStr.replace(/\|+$/, '').length && layoutStr.length <= 500 ? layoutStr : ''

  // Authoritative total (base + metal surcharge + catalog-priced charms)
  const authTotalCents =
    basePriceCents +
    (surcharge > 0 ? Math.round(surcharge * 100) : 0) +
    Object.values(grouped).reduce((sum, g) => sum + Math.round(g.price * 100) * g.qty, 0)

  // Create Stripe Checkout Session
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: {
        product_type: 'italian_charm_bracelet',
        metal,
        num_links: String(numLinks),
        charms: charmSummary.slice(0, 500), // Stripe metadata max 500 chars per key
        charm_qty: charmQtyMeta.slice(0, 500), // id:qty list — used by the webhook to decrement stock
        layout: layoutMeta, // ordered per-link charm ids ('' = plain link) for the owner's assembly view
        total_cents: String(authTotalCents),
      },
      success_url: `${origin}/charm-builder?payment=success`,
      cancel_url: `${origin}/charm-builder?payment=cancelled`,
    })
  } catch (err) {
    console.error('[/api/charm-checkout] Stripe error:', err)
    return NextResponse.json({ message: 'Could not create checkout session.' }, { status: 502 })
  }

  return NextResponse.json({ url: session.url })
}
