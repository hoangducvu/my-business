import { NextResponse } from 'next/server'
import { ensurePhonecaseSheet, getPhonecases, type StockLocation } from '@/lib/sheets-phonecases'

// GET /api/phonecase-models[?location=plaza|mercury]
// Public list for the booking form's model picker. When a location is given,
// each model reports how much stock is left at that shop.
export const revalidate = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const loc = searchParams.get('location')?.toLowerCase()
  const location: StockLocation | null = loc === 'plaza' || loc === 'mercury' ? loc : null

  try {
    await ensurePhonecaseSheet()
    const models = (await getPhonecases()).map((p) => ({
      brand: p.brand,
      model: p.model,
      stock: location ? p[location] : p.total,
    }))
    return NextResponse.json({ models }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
    })
  } catch (err) {
    console.error('[/api/phonecase-models] error:', err)
    return NextResponse.json({ models: [] }, { status: 200 })
  }
}
