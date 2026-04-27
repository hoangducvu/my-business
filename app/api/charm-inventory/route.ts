import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getInventory,
  getCharmCatalog,
  updateInventoryQty,
  upsertCharm,
  deleteCharmRow,
  ensureInventorySheet,
} from '@/lib/sheets-inventory'
import { DEFAULT_CHARMS } from '@/app/charm-builder/charms'

const SEED = DEFAULT_CHARMS.map(c => ({
  id: c.id,
  name: c.name,
  category: c.category,
  price: c.price,
  imageUrl: c.imageUrl ?? '',
}))

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

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const { id, delta } = body ?? {}
  if (!id || typeof delta !== 'number') {
    return NextResponse.json({ error: 'Need { id, delta }' }, { status: 400 })
  }
  const result = await updateInventoryQty(id, delta)
  if (!result) return NextResponse.json({ error: 'Charm not found' }, { status: 404 })
  return NextResponse.json(result)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const { id, name, category, price, imageUrl, quantity } = body ?? {}
  if (!id || !name || !category || typeof price !== 'number' || typeof quantity !== 'number') {
    return NextResponse.json({ error: 'Need { id, name, category, price, imageUrl, quantity }' }, { status: 400 })
  }
  await upsertCharm({ id, name, category, price, imageUrl: imageUrl ?? '', quantity })
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const { id, name, category, price, imageUrl, quantity } = body ?? {}
  if (!id || !name || !category || typeof price !== 'number') {
    return NextResponse.json({ error: 'Need { id, name, category, price }' }, { status: 400 })
  }
  await upsertCharm({ id, name, category, price, imageUrl: imageUrl ?? '', quantity: quantity ?? 100 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Need ?id=...' }, { status: 400 })
  const deleted = await deleteCharmRow(id)
  if (!deleted) return NextResponse.json({ error: 'Charm not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
