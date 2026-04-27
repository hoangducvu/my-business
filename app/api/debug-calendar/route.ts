import { NextResponse } from 'next/server'
import { createBookingCalendarEvent } from '@/lib/google-calendar'

export async function GET() {
  try {
    await createBookingCalendarEvent({
      name:      'Debug Test',
      email:     'test@test.com',
      date:      new Date().toISOString().slice(0, 10),
      time:      '14:00',
      activity:  'pencilcase',
      partySize: 1,
      location:  'plaza',
      paid:      true,
    })
    return NextResponse.json({ success: true, message: 'Calendar event created ✅' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
