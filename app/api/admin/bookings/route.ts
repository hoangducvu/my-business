import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { getBookings } from '@/lib/sheets-bookings'

// GET /api/admin/bookings — recent bookings (newest first)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const bookings = (await getBookings()).reverse().slice(0, 300)
    return NextResponse.json({ bookings })
  } catch (err) {
    console.error('[/api/admin/bookings] read error:', err)
    return NextResponse.json({ error: 'Could not read bookings.' }, { status: 502 })
  }
}
