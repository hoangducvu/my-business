import type { Metadata } from 'next'
import Link from 'next/link'
import BookingSection from '../BookingSection'
import SiteFooter from '../SiteFooter'
import SiteNav from '../SiteNav'
import { findSession } from '../workshops'
import TicketDetail from './TicketDetail'

export const metadata: Metadata = {
  title: 'Reserve Your Spot — OddlyCraft Malta',
  description:
    'Pick a date, a time and what you want to make. Registering guarantees your place and lets us prep your materials.',
}

/**
 * The booking table, on its own route.
 *
 * It used to sit at the bottom of the homepage, which meant everyone scrolled
 * past a date picker before they'd decided what they were making. Now the
 * workshop tickets on the homepage link here, each carrying its own workshop
 * and date in the query string so the form opens already part-filled:
 *
 *   /book?activity=phonecase&date=2026-08-15&location=plaza
 *
 * Arriving with no query at all is still fine — that's just an empty form.
 */
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  // Query strings are user input: take the first value if a key is repeated,
  // and hand it over as a plain string. BookingSection validates it against its
  // own lists before selecting anything.
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  // Undefined when someone came straight to /book rather than via a ticket —
  // then there is no particular session to describe, and the form stands alone.
  const session = findSession(one(params.activity), one(params.date))

  return (
    <main className="min-h-screen" style={{ background: '#fffeee', fontFamily: 'var(--font-nunito), sans-serif' }}>
      <SiteNav />

      {/* The nav is transparent and overlaps whatever is beneath it, so this
          page needs its own clearance where the homepage uses the video. */}
      <div style={{ height: 'var(--nav-h)' }} />

      <div className="px-4 pt-6">
        <Link
          href="/#tickets"
          className="inline-flex items-center gap-2 text-sm font-black hover:opacity-60 transition"
          style={{ color: '#005CFF' }}
        >
          ← Back to workshops
        </Link>
      </div>

      {session ? (
        <TicketDetail session={session} />
      ) : (
        /* Arrived via "I Want A Date" rather than a ticket — no particular
           session to describe, so say what to do instead of showing nothing. */
        <div className="px-4 pt-8">
          <div
            className="max-w-4xl mx-auto rounded-3xl px-6 py-5 sm:px-8"
            style={{ border: '3px solid #F2678F', background: '#F8F2C4', color: '#F2678F' }}
          >
            <h2 className="text-xl sm:text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-baloo), sans-serif' }}>
              Pick your own date
            </h2>
            <p className="font-semibold" style={{ color: '#B8456C' }}>
              Choose a shop, a day and a time below, then tell us what you&apos;d like to make —
              every workshop we run is in the list.
            </p>
          </div>
        </div>
      )}

      <BookingSection
        initialActivity={one(params.activity)}
        initialDate={one(params.date)}
        initialLocation={one(params.location)}
      />

      <SiteFooter />
    </main>
  )
}
