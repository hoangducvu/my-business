import { NextResponse } from 'next/server'
import { getInventory, getCharmCatalog, ensureInventorySheet } from '@/lib/sheets-inventory'
import { DEFAULT_CHARMS } from '@/app/charm-builder/charms'

const SEED = DEFAULT_CHARMS.map(c => ({
  id: c.id,
  name: c.name,
  category: c.category,
  price: c.price,
  imageUrl: c.imageUrl ?? '',
}))

// Public read-only inventory. Writes are handled by the /api/admin routes.
export async function GET(request: Request) {
  await ensureInventorySheet(SEED)
  const url = new URL(request.url)
  const catalog = url.searchParams.get('catalog') === '1'

  if (catalog) {
    const rows = await getCharmCatalog()
    const inventory: Record<string, number> = {}
    const charms = rows.map(r => {
      inventory[r.id] = r.quantity
      const def = DEFAULT_CHARMS.find(c => c.id === r.id)
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        price: r.price,
        imageUrl: r.imageUrl || undefined,
        emoji: def?.emoji ?? '★',
        bg: def?.bg ?? '#F5E8FF',
      }
    })
    return NextResponse.json({ charms, inventory })
  }

  const inventory = await getInventory()
  return NextResponse.json(inventory)
}
