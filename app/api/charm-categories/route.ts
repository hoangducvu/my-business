import { NextResponse } from 'next/server'
import { getCategories, ensureCategoriesSheet } from '@/lib/sheets-inventory'
import { CATEGORIES } from '@/app/charm-builder/charms'

const DEFAULTS = [...CATEGORIES]

// Public read-only categories. Writes are handled by the /api/admin routes.
export async function GET() {
  await ensureCategoriesSheet(DEFAULTS)
  const cats = await getCategories()
  return NextResponse.json({ categories: cats.length > 0 ? cats : DEFAULTS, defaults: DEFAULTS })
}
