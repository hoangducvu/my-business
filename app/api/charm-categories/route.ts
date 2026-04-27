import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategories, addCategory, deleteCategory, ensureCategoriesSheet } from '@/lib/sheets-inventory'
import { CATEGORIES } from '@/app/charm-builder/charms'

const DEFAULTS = [...CATEGORIES]

export async function GET() {
  await ensureCategoriesSheet(DEFAULTS)
  const cats = await getCategories()
  return NextResponse.json({ categories: cats.length > 0 ? cats : DEFAULTS, defaults: DEFAULTS })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const name = body?.name?.toString().trim()
  if (!name) return NextResponse.json({ error: 'Need { name }' }, { status: 400 })
  if ((await getCategories()).includes(name)) {
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
  }
  await addCategory(name)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const url = new URL(request.url)
  const name = url.searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'Need ?name=...' }, { status: 400 })
  const deleted = await deleteCategory(name)
  if (!deleted) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
