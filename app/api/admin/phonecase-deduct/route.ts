import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { deductStock, restoreStock, type StockLocation } from '@/lib/sheets-phonecases'
import { appendDeduction, getDeductions, ensureDeductionSheet, markReverted, maybePrune } from '@/lib/sheets-phonecase-log'

const asLocation = (v: unknown): StockLocation | null => {
  const s = v?.toString().trim().toLowerCase() ?? ''
  return s === 'plaza' || s === 'mercury' ? s : null
}

// GET /api/admin/phonecase-deduct — recent deduction history (newest first)
export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    await ensureDeductionSheet()
    const deductions = await getDeductions(120)
    maybePrune()   // sweeps rows past the retention window without blocking the response
    return NextResponse.json({ deductions })
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
  const location = asLocation(body.location)
  const qty      = Math.max(1, parseInt(body.qty?.toString() ?? '1', 10) || 1)
  const note     = body.note?.toString().trim() ?? ''

  if (!model) return NextResponse.json({ error: 'Model is required.' }, { status: 400 })
  if (!location) return NextResponse.json({ error: 'Location must be plaza or mercury.' }, { status: 400 })

  try {
    const updated = await deductStock(brand, model, location, qty)
    if (!updated) return NextResponse.json({ error: 'Model not found.' }, { status: 404 })

    // The timestamp goes out with the response so /admin can offer Revert on this
    // exact log row without waiting for a history reload.
    const time = new Date().toISOString()
    await appendDeduction({ time, brand: updated.brand, model: updated.model, location, qty, source: 'manual', note })
      .catch((err) => console.error('[/api/admin/phonecase-deduct] log error:', err))

    return NextResponse.json({ ok: true, phonecase: updated, deduction: { time, brand: updated.brand, model: updated.model, location, qty, source: 'manual', note, reverted: '' } })
  } catch (err) {
    console.error('[/api/admin/phonecase-deduct] POST error:', err)
    return NextResponse.json({ error: 'Could not deduct.' }, { status: 502 })
  }
}

// PATCH /api/admin/phonecase-deduct — undo one logged deduction: put the stock
// back and stamp the log row as reverted. Body: { time, brand, model }
export async function PATCH(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }) }

  const time  = body.time?.toString().trim() ?? ''
  const brand = body.brand?.toString().trim() ?? ''
  const model = body.model?.toString().trim() ?? ''
  if (!time || !model) return NextResponse.json({ error: 'time and model are required.' }, { status: 400 })

  try {
    // Stamp first: whoever wins that write owns the revert, so a double-tap
    // (or two open tabs) can't give the stock back twice.
    const entry = await markReverted(time, brand, model)
    if (!entry) return NextResponse.json({ error: 'Already reverted, or no longer in history.' }, { status: 409 })

    const location = asLocation(entry.location)
    if (!location) return NextResponse.json({ error: 'Logged shop is not a stock location.' }, { status: 422 })

    const updated = await restoreStock(entry.brand, entry.model, location, entry.qty)
    if (!updated) return NextResponse.json({ error: 'Model is no longer in stock list.' }, { status: 404 })

    return NextResponse.json({ ok: true, phonecase: updated, deduction: entry })
  } catch (err) {
    console.error('[/api/admin/phonecase-deduct] PATCH error:', err)
    return NextResponse.json({ error: 'Could not revert.' }, { status: 502 })
  }
}
