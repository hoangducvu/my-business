import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// ── Shop schedule ──────────────────────────────────────────────────────────
// JS day-of-week: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

const SCHEDULE: Record<string, (day: number) => number[] | null> = {
  plaza: (_day) => range(10, 18),      // Mon-Sun 10:00-18:00 (9 slots)
  mercury: (day) => {
    if (day === 5) return range(16, 19) // Fri  16:00-19:00 (4 slots)
    if (day === 6) return range(11, 19) // Sat  11:00-19:00 (9 slots)
    if (day === 0) return range(11, 19) // Sun  11:00-19:00 (9 slots)
    return null                         // closed Mon-Thu
  },
}

export interface AvailabilityDate {
  id:         string    // YYYY-MM-DD
  display:    string    // "May 9"
  day:        string    // "Fri"
  slots:      string[]  // available (unbooked) time slots e.g. ["10:00","11:00"]
  totalSlots: number    // total scheduled slots for this day
}

export const revalidate = 60

function padHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

function formatDate(dateStr: string): { display: string; day: string } {
  const d = new Date(dateStr + 'T12:00:00Z')
  return {
    display: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    day:     d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')?.toLowerCase()

  if (!location || !(location in SCHEDULE)) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
  }

  const slotsForDay = SCHEDULE[location]

  try {
    // Read booked slots from Leads sheet (type=booking, column K=location)
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    const sheets    = google.sheets({ version: 'v4', auth })
    const sheetsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      range:         'Leads!A2:K',
    })

    // Build set of booked "date|time" keys for this location
    const booked = new Set<string>()
    for (const row of sheetsRes.data.values ?? []) {
      const rowType     = row[4]?.toString().trim()
      const rowDate     = row[6]?.toString().trim()
      const rowTime     = row[7]?.toString().trim()
      const rowLocation = row[10]?.toString().trim().toLowerCase()
      if (rowType === 'booking' && rowDate && rowTime && rowLocation === location) {
        booked.add(`${rowDate}|${rowTime}`)
      }
    }

    // Generate next 21 days
    const dates: AvailabilityDate[] = []
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    for (let i = 0; i < 21; i++) {
      const d    = new Date(today.getTime() + i * 86400000)
      const dow  = d.getUTCDay()
      const id   = d.toISOString().slice(0, 10)
      const hours = slotsForDay(dow)
      if (!hours) continue

      const allSlots = hours.map(padHour)
      const available = allSlots.filter((t) => !booked.has(`${id}|${t}`))

      dates.push({
        id,
        ...formatDate(id),
        slots:      available,
        totalSlots: allSlots.length,
      })
    }

    return NextResponse.json({ dates }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
    })

  } catch (err) {
    console.error('[/api/availability] Error:', err)
    return NextResponse.json({ error: 'Failed to load availability' }, { status: 502 })
  }
}
