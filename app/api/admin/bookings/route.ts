import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { getBookings, setBookingStatus } from '@/lib/sheets-bookings'

// GET /api/admin/bookings — recent bookings (newest first)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const bookings = (await getBookings({ fresh: true })).reverse().slice(0, 300)
    return NextResponse.json({ bookings })
  } catch (err) {
    console.error('[/api/admin/bookings] read error:', err)
    return NextResponse.json({ error: 'Could not read bookings.' }, { status: 502 })
  }
}

// PATCH /api/admin/bookings — update one booking's status.
// Body: { id, status }  e.g. { id, status: 'done' } when the customer shows up.
export async function PATCH(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }) }

  const id     = body.id?.toString().trim() ?? ''
  const status = body.status?.toString().trim().toLowerCase() ?? ''
  const ALLOWED = ['pending', 'confirmed', 'paid', 'done', 'no-show']
  if (!id) return NextResponse.json({ error: 'Booking id is required.' }, { status: 400 })
  if (!ALLOWED.includes(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })

  try {
    const ok = await setBookingStatus(id, status)
    if (!ok) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/admin/bookings] PATCH error:', err)
    return NextResponse.json({ error: 'Could not update booking.' }, { status: 502 })
  }
}
