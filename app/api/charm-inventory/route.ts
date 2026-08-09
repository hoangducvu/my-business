import { NextResponse } from 'next/server'
import { getInventory, getCharmCatalog, ensureInventorySheet } from '@/lib/sheets-inventory'
import { CHARMS, HIDDEN_CHARM_IDS } from '@/app/charm-builder/charms'

const BY_ID = new Map(CHARMS.map(c => [c.id, c]))

const SEED = CHARMS.map(c => ({
  id: c.id,
  name: c.name,
  category: c.category,
  imageUrl: c.imageUrl ?? '',
}))

// Stock moves as customers buy, so this is short — long enough to absorb a burst
// of shoppers, short enough that a sold-out charm greys out quickly.
const CACHE = { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' }

// Public read-only inventory. Writes are handled by the /api/admin routes.
export async function GET(request: Request) {
  await ensureInventorySheet(SEED)
  const url = new URL(request.url)
  const catalog = url.searchParams.get('catalog') === '1'

  if (catalog) {
    const rows = (await getCharmCatalog()).filter(r => !HIDDEN_CHARM_IDS.has(r.id))
    const inventory: Record<string, number> = {}
    const charms = rows.map(r => {
      inventory[r.id] = r.quantity
      // Tone and swatch colour aren't stored in the sheet — look them up from the
      // bundled catalogue so the sheet stays a simple stock/price table.
      const def = BY_ID.get(r.id)
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        price: r.price,
        imageUrl: r.imageUrl || undefined,
        emoji: '',
        tone: def?.tone ?? 'silver',
        bg: def?.bg ?? '#F5E8FF',
        special: r.special,
      }
    })
    return NextResponse.json({ charms, inventory }, { headers: CACHE })
  }

  const inventory = await getInventory()
  return NextResponse.json(inventory, { headers: CACHE })
}
