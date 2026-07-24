import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { deductStock, type StockLocation } from '@/lib/sheets-phonecases'
import { appendDeduction, getDeductions, ensureDeductionSheet } from '@/lib/sheets-phonecase-log'

// GET /api/admin/phonecase-deduct — recent deduction history (newest first)
export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    await ensureDeductionSheet()
    return NextResponse.json({ deductions: await getDeductions(120) })
  } catch (err) {
    console.error('[/api/admin/phonecase-deduct] GET error:', err)
    return NextResponse.json({ error: 'Could not read history.' }, { status: 502 })
  }
}

// POST /api/admin/phonecase-deduct — deduct stock for one model at one shop and
// log it to the deduction history. Body: { brand, model, location, qty?, note? }
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }) }

  const brand    = body.brand?.toString().trim() ?? ''
  const model    = body.model?.toString().trim() ?? ''
  const locInput = body.location?.toString().trim().toLowerCase() ?? ''
  const qty      = Math.max(1, parseInt(body.qty?.toString() ?? '1', 10) || 1)
  const note     = body.note?.toString().trim() ?? ''

  if (!model) return NextResponse.json({ error: 'Model is required.' }, { status: 400 })
  if (locInput !== 'plaza' && locInput !== 'mercury') {
    return NextResponse.json({ error: 'Location must be plaza or mercury.' }, { status: 400 })
  }
  const location = locInput as StockLocation

  try {
    const updated = await deductStock(brand, model, location, qty)
    if (!updated) return NextResponse.json({ error: 'Model not found.' }, { status: 404 })

    await appendDeduction({ brand: updated.brand, model: updated.model, location, qty, source: 'manual', note })
      .catch((err) => console.error('[/api/admin/phonecase-deduct] log error:', err))

    return NextResponse.json({ ok: true, phonecase: updated })
  } catch (err) {
    console.error('[/api/admin/phonecase-deduct] POST error:', err)
    return NextResponse.json({ error: 'Could not deduct.' }, { status: 502 })
  }
}
