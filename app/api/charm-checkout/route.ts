import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getCharmCatalog } from '@/lib/sheets-inventory'
import { HIDDEN_CHARM_IDS } from '@/app/charm-builder/charms'
import { priceForBuild, priceBreakdown, SINGLE_PRICE, SPECIAL_SUPPLEMENT, type BuyMode } from '@/lib/charm-pricing'

/* ─── Stripe client ─────────────────────────────────────────── */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

/* ─── Types ─────────────────────────────────────────────────── */
interface CharmItem {
  id: string
  name: string
  price: number   // euros — advisory only; the server re-prices from the catalog
}

interface CharmOrderBody {
  mode: BuyMode
  tone: 'silver' | 'gold'
  numLinks: number
  charms: CharmItem[]
  layout?: string[]   // one entry per link slot, in order; '' = empty (plain) link
  totalCents: number
}

const TONE_LABEL: Record<string, string> = { silver: 'Silver', gold: 'Gold' }

const VALID_LINKS = [16, 17, 18, 19, 20]

/* ─── POST /api/charm-checkout ──────────────────────────────── */
export async function POST(request: Request) {
  let body: CharmOrderBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }

  const { numLinks, charms } = body
  const mode: BuyMode = body.mode === 'singles' ? 'singles' : 'bracelet'
  const tone = body.tone === 'gold' ? 'gold' : 'silver'

  // Basic validation
  if (!Array.isArray(charms)) {
    return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 })
  }
  if (mode === 'bracelet' && !VALID_LINKS.includes(numLinks)) {
    return NextResponse.json({ message: 'Invalid bracelet size.' }, { status: 400 })
  }
  if (charms.length === 0) {
    return NextResponse.json({ message: 'Add at least one charm.' }, { status: 400 })
  }

  const origin = request.headers.get('origin') ?? 'https://oddlycraft.netlify.app'

  // Build Stripe line items
  const lineItems: NonNullable<NonNullable<Parameters<typeof stripe.checkout.sessions.create>[0]>['line_items']> = []

  // Resolve charms against the catalog so the client can't invent ids. Prices
  // come from the pricing tiers, not from the catalog row or the request body.
  let known: Record<string, { price: number; name: string; imageUrl: string; special: boolean }>
  try {
    // Hidden charms are dropped here too, so a stale client cache can't order
    // something the shop has pulled from sale.
    const catalog = (await getCharmCatalog()).filter((c) => !HIDDEN_CHARM_IDS.has(c.id))
    known = Object.fromEntries(catalog.map((c) => [c.id, { price: c.price, name: c.name, imageUrl: c.imageUrl, special: c.special }]))
  } catch (err) {
    console.error('[/api/charm-checkout] catalog lookup failed:', err)
    return NextResponse.json({ message: 'Could not verify charm prices. Please try again.' }, { status: 502 })
  }
  const priceById = known

  const grouped: Record<string, { name: string; price: number; qty: number; imageUrl: string; special: boolean }> = {}
  for (const charm of charms) {
    const known = priceById[charm.id]
    if (!known) {
      return NextResponse.json({ message: `Unknown charm: ${charm.id}` }, { status: 400 })
    }
    if (grouped[charm.id]) grouped[charm.id].qty++
    else grouped[charm.id] = { name: known.name, price: known.price, qty: 1, imageUrl: known.imageUrl, special: known.special }
  }

  // Authoritative total from the shared pricing rules. Which charms are special
  // is read from the catalog, never from the request, so the client can't
  // downgrade a €6 charm by lying about it.
  const charmCount = charms.length
  const specialCount = charms.reduce((n, c) => n + (priceById[c.id].special ? 1 : 0), 0)
  const build = { count: charmCount, specialCount, numLinks, mode }
  const authTotalCents = Math.round(priceForBuild(build) * 100)

  if (mode === 'singles') {
    // Loose charms: flat rate each, one line per design so the receipt is itemised.
    for (const { name, qty, imageUrl, special } of Object.values(grouped)) {
      const images = imageUrl.startsWith('http') ? [imageUrl] : []
      lineItems.push({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round((SINGLE_PRICE + (special ? SPECIAL_SUPPLEMENT : 0)) * 100),
          product_data: { name: `Italian Charm — ${name}${special ? ' (special)' : ''}`, images },
        },
        quantity: qty,
      })
    }
  } else {
    // Bracelet build: the tier price covers the frame and every charm, so it has
    // to go over as a single line item or the totals wouldn't add up.
    const names = Object.values(grouped)
      .map(({ name, qty }) => `${name}${qty > 1 ? ` ×${qty}` : ''}`)
      .join(', ')
    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: authTotalCents,
        product_data: {
          name: `OddlyCraft Charm Bracelet — ${charmCount} charms, ${numLinks} links (${TONE_LABEL[tone]})`,
          description: `${priceBreakdown(build)}. Charms: ${names}`.slice(0, 500),
          images: [],
        },
      },
      quantity: 1,
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

  // Create Stripe Checkout Session
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: {
        product_type: mode === 'singles' ? 'italian_charms_singles' : 'italian_charm_bracelet',
        buy_mode: mode,
        metal: tone,
        num_links: mode === 'singles' ? '' : String(numLinks),
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
