// ─── Charm bracelet pricing ──────────────────────────────────────────────────
// Shared by the builder UI and /api/charm-checkout so the price the customer is
// shown always equals the price the server charges. Never fork this logic.
//
//   • Under 6 charms: €4 a charm plus €1 for every plain link left on the frame.
//   • 6, 9 and 18 charms hit fixed combo prices (€36 / €45 / €75).
//   • Between combos: the combo below, plus €4 per extra charm.
//   • A completely full bracelet is priced off the €75 18-link combo, ±€4 per
//     link, so a smaller or larger wrist pays proportionally (17 → €71, 19 → €79).
//   • A "special" charm adds €2 on top of whatever the total already is, which
//     is what makes it €6 against a standard charm's €4.
//   • Buying charms loose ("singles") is a flat rate per charm — no frame.

export const CHARM_PRICE = 4.0        // one charm, when charged individually
export const PLAIN_LINK_PRICE = 1.0   // one empty link on the frame
export const SPECIAL_SUPPLEMENT = 2.0 // what a special charm adds to any total
export const SPECIAL_PRICE = CHARM_PRICE + SPECIAL_SUPPLEMENT  // €6 headline
export const SINGLE_PRICE = 5.0       // loose charm, bought without a bracelet
export const STEP_PRICE = 4.0         // each charm past a combo

/** Charm count → fixed combo price (bracelet included). */
export const COMBOS: Record<number, number> = { 6: 36, 9: 45, 18: 75 }

const TIERS = [6, 9, 18] as const

/** The bracelet size the €75 combo is quoted for. */
export const STANDARD_LINKS = 18
/** Added or removed per link when the wrist needs a different size. */
export const LINK_STEP = 4.0

export type BuyMode = 'bracelet' | 'singles'

export interface CharmBuild {
  /** Total charms placed. */
  count: number
  /** How many of those are special (each adds SPECIAL_SUPPLEMENT). */
  specialCount: number
  /** Bracelet size in links. Ignored for singles. */
  numLinks: number
  mode: BuyMode
}

/** What a completely filled bracelet of this size costs, before specials. */
export function fullBraceletPrice(numLinks: number): number {
  return COMBOS[STANDARD_LINKS] + (numLinks - STANDARD_LINKS) * LINK_STEP
}

/** Highest combo at or below `count`, or null when below the first one. */
function comboBelow(count: number): number | null {
  let tier: number | null = null
  for (const t of TIERS) if (count >= t) tier = t
  return tier
}

/** The rule as written, before the fairness cap below. */
function rawBase(count: number, numLinks: number): number {
  if (count <= 0) return 0

  // A full frame is quoted off the 18-link combo, whatever the wrist size.
  if (count >= numLinks) return fullBraceletPrice(numLinks)

  const tier = comboBelow(count)
  return tier === null
    ? count * CHARM_PRICE + (numLinks - count) * PLAIN_LINK_PRICE
    : COMBOS[tier] + (count - tier) * STEP_PRICE
}

/**
 * Bracelet price before the special-charm supplement, plus the count it was
 * quoted at.
 *
 * Stepping €4 up from a combo can overshoot a combo further along — 17 charms
 * steps to €77 while 18 is a flat €75 — so nobody is ever charged more than a
 * bracelet carrying *more* charms would cost. Taking the running minimum over
 * every larger count makes that true by construction at any bracelet size,
 * rather than patching the two counts where it happens to bite today.
 */
function braceletBase(count: number, numLinks: number): { price: number; atCount: number } {
  if (count <= 0) return { price: 0, atCount: 0 }

  let price = rawBase(count, numLinks)
  let atCount = count
  for (let n = count + 1; n <= numLinks; n++) {
    const candidate = rawBase(n, numLinks)
    if (candidate < price) {
      price = candidate
      atCount = n
    }
  }
  return { price, atCount }
}

/** Total euros for a build. The only pricing entry point — UI and server share it. */
export function priceForBuild(build: CharmBuild): number {
  const { count, specialCount, numLinks, mode } = build
  if (count <= 0) return 0

  const specials = Math.min(Math.max(specialCount, 0), count) * SPECIAL_SUPPLEMENT

  if (mode === 'singles') return count * SINGLE_PRICE + specials
  return braceletBase(count, numLinks).price + specials
}

/** Short human explanation of how the current total was reached. */
export function priceBreakdown(build: CharmBuild): string {
  const { count, specialCount, numLinks, mode } = build
  if (count <= 0) return 'No charms yet'

  const specials = Math.min(Math.max(specialCount, 0), count)
  const extra = specials > 0
    ? ` + ${specials} special × €${SPECIAL_SUPPLEMENT.toFixed(2)}`
    : ''

  if (mode === 'singles') {
    return `${count} × €${SINGLE_PRICE.toFixed(2)} per charm${extra}`
  }

  if (count >= numLinks) {
    const full = `Full ${numLinks}-link bracelet €${fullBraceletPrice(numLinks).toFixed(0)}`
    return numLinks === STANDARD_LINKS ? `${full}${extra}` : `${full} (${numLinks - STANDARD_LINKS > 0 ? '+' : '−'}€${Math.abs((numLinks - STANDARD_LINKS) * LINK_STEP)} for size)${extra}`
  }

  // When the cap kicks in the quote comes from a larger count, so explain that
  // rather than a step that doesn't add up to the total shown.
  const { price, atCount } = braceletBase(count, numLinks)
  if (atCount !== count) {
    return atCount >= numLinks
      ? `Full ${numLinks}-link price €${price.toFixed(0)} — the rest of the links are free${extra}`
      : `Priced at the ${atCount}-charm rate €${price.toFixed(0)} — cheaper than ${count}${extra}`
  }

  const tier = comboBelow(count)
  if (tier === null) {
    const plain = numLinks - count
    return `${count} × €${CHARM_PRICE.toFixed(2)} + ${plain} plain link${plain === 1 ? '' : 's'} × €${PLAIN_LINK_PRICE.toFixed(2)}${extra}`
  }
  if (tier === count) return `${count}-charm combo — bracelet included${extra}`
  return `${tier}-charm combo €${COMBOS[tier]} + ${count - tier} × €${STEP_PRICE.toFixed(2)}${extra}`
}

/**
 * The next count that would unlock a better rate, for a gentle upsell nudge.
 *
 * Bounded by the bracelet: a 16-link frame can never reach the 18-charm combo,
 * so the nudge there points at filling the frame instead of a price the
 * customer could never actually get.
 */
export function nextCombo(count: number, numLinks: number): { at: number; price: number } | null {
  for (const t of TIERS) {
    if (count < t && t <= numLinks) return { at: t, price: COMBOS[t] }
  }
  if (count < numLinks) return { at: numLinks, price: fullBraceletPrice(numLinks) }
  return null
}
