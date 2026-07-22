import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { getCharmCatalog, upsertCharm, deleteCharmRow } from '@/lib/sheets-inventory'

// GET /api/admin/inventory — full charm catalog (stock, price, category, image)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  try {
    const charms = await getCharmCatalog()
    return NextResponse.json({ charms })
  } catch (err) {
    console.error('[/api/admin/inventory] read error:', err)
    return NextResponse.json({ error: 'Could not read inventory.' }, { status: 502 })
  }
}

// PUT /api/admin/inventory — add or update a charm (keyed by id)
export async function PUT(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let b: Record<string, unknown>
  try { b = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const id   = (b.id   ?? '').toString().trim()
  const name = (b.name ?? '').toString().trim()
  if (!id || !name) {
    return NextResponse.json({ error: 'id and name are required.' }, { status: 400 })
  }

  try {
    await upsertCharm({
      id,
      name,
      category: (b.category ?? 'Custom').toString().trim() || 'Custom',
      price:    Math.max(0, Number(b.price) || 0),
      imageUrl: (b.imageUrl ?? '').toString().trim(),
      quantity: Math.max(0, parseInt((b.quantity ?? '0').toString(), 10) || 0),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/admin/inventory] write error:', err)
    return NextResponse.json({ error: 'Could not save charm.' }, { status: 502 })
  }
}

// DELETE /api/admin/inventory?id=... — remove a charm
export async function DELETE(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  try {
    const deleted = await deleteCharmRow(id)
    return NextResponse.json({ ok: deleted })
  } catch (err) {
    console.error('[/api/admin/inventory] delete error:', err)
    return NextResponse.json({ error: 'Could not delete charm.' }, { status: 502 })
  }
}
