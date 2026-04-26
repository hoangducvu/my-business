import Stripe from 'stripe'
import { NextResponse } from 'next/server'

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

  const { metal, numLinks, charms, totalCents } = body

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

  const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

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

  // 3. Individual charms (grouped by id for cleaner invoice)
  const grouped: Record<string, { name: string; price: number; qty: number }> = {}
  for (const charm of charms) {
    if (grouped[charm.id]) {
      grouped[charm.id].qty++
    } else {
      grouped[charm.id] = { name: charm.name, price: charm.price, qty: 1 }
    }
  }
  for (const { name, price, qty } of Object.values(grouped)) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(price * 100),
        product_data: { name: `Italian Charm — ${name}` },
      },
      quantity: qty,
    })
  }

  // Build order summary for metadata
  const charmSummary = Object.values(grouped)
    .map(({ name, qty }) => `${name}${qty > 1 ? ` ×${qty}` : ''}`)
    .join(', ')

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
        total_cents: String(totalCents),
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
