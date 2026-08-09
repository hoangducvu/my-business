import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { getCategories, addCategory, deleteCategory } from '@/lib/sheets-inventory'

// GET /api/admin/categories
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  try {
    return NextResponse.json({ categories: await getCategories({ fresh: true }) })
  } catch (err) {
    console.error('[/api/admin/categories] read error:', err)
    return NextResponse.json({ error: 'Could not read categories.' }, { status: 502 })
  }
}

// POST /api/admin/categories — { name }
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  let b: { name?: string }
  try { b = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const name = (b.name ?? '').toString().trim()
  if (!name) return NextResponse.json({ error: 'name is required.' }, { status: 400 })

  try {
    await addCategory(name)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/admin/categories] add error:', err)
    return NextResponse.json({ error: 'Could not add category.' }, { status: 502 })
  }
}

// DELETE /api/admin/categories?name=...
export async function DELETE(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const name = new URL(request.url).searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'name is required.' }, { status: 400 })

  try {
    const deleted = await deleteCategory(name)
    return NextResponse.json({ ok: deleted })
  } catch (err) {
    console.error('[/api/admin/categories] delete error:', err)
    return NextResponse.json({ error: 'Could not delete category.' }, { status: 502 })
  }
}
