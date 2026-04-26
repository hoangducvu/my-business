import { NextResponse } from 'next/server'
import { getInventory, updateInventoryQty, ensureInventorySheet } from '@/lib/sheets-inventory'
import { DEFAULT_CHARMS } from '@/app/charm-builder/charms'

export async function GET() {
  // Auto-create sheet on first call if needed
  await ensureInventorySheet(DEFAULT_CHARMS.map(c => ({ id: c.id, name: c.name })))
  const inventory = await getInventory()
  return NextResponse.json(inventory)
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  const id    = body?.id
  const delta = body?.delta

  if (!id || typeof delta !== 'number') {
    return NextResponse.json({ error: 'Invalid payload — need { id, delta }' }, { status: 400 })
  }

  const result = await updateInventoryQty(id, delta)
  if (!result) {
    return NextResponse.json({ error: 'Charm not found in inventory' }, { status: 404 })
  }
  return NextResponse.json(result)
}
