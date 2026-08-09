import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { ensurePhonecaseSheet, getPhonecases, upsertPhonecase, deletePhonecase } from '@/lib/sheets-phonecases'

// GET /api/admin/phonecases — full phone-case stock list (seeds sheet on first call)
export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    await ensurePhonecaseSheet()
    return NextResponse.json({ phonecases: await getPhonecases({ fresh: true }) })
  } catch (err) {
    console.error('[/api/admin/phonecases] GET error:', err)
    return NextResponse.json({ error: 'Could not read phone cases.' }, { status: 502 })
  }
}

// PUT /api/admin/phonecases — add or update one model (matched on brand+model)
export async function PUT(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }) }

  const brand = body.brand?.toString().trim() ?? ''
  const model = body.model?.toString().trim() ?? ''
  if (!model) return NextResponse.json({ error: 'Model is required.' }, { status: 400 })

  const n = (v: unknown) => Math.max(0, parseInt(v?.toString() ?? '0', 10) || 0)
  try {
    // Alibaba is a supplier-intake field: whatever is entered is MOVED into the
    // Plaza shop (Plaza += Alibaba) and the Alibaba column resets to 0, so stock
    // is only ever counted once in the Total.
    const incoming = n(body.alibaba)
    await upsertPhonecase({
      brand,
      model,
      plaza:   n(body.plaza) + incoming,
      mercury: n(body.mercury),
      alibaba: 0,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/admin/phonecases] PUT error:', err)
    return NextResponse.json({ error: 'Could not save.' }, { status: 502 })
  }
}

// DELETE /api/admin/phonecases?brand=..&model=..
export async function DELETE(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')?.trim() ?? ''
  const model = searchParams.get('model')?.trim() ?? ''
  if (!model) return NextResponse.json({ error: 'Model is required.' }, { status: 400 })
  try {
    const ok = await deletePhonecase(brand, model)
    return NextResponse.json({ ok })
  } catch (err) {
    console.error('[/api/admin/phonecases] DELETE error:', err)
    return NextResponse.json({ error: 'Could not delete.' }, { status: 502 })
  }
}
