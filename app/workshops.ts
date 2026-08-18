/**
 * The scheduled workshop sessions.
 *
 * Shared between the homepage ticket rail (app/BookingTickets.tsx) and the
 * booking page (app/book/page.tsx), which looks a session back up from the
 * activity + date in the query string to show its details.
 */

export type ActivityId = 'phonecase' | 'bracelet'
export type LocationId = 'plaza' | 'mercury'

export type Session = {
  id: string
  /** Must match an id in BookingSection's `activities`. */
  activity: ActivityId
  name: string
  /** ISO date, matched against the availability API's date ids on /book. */
  date: string
  when: string
  price: string
  /** Must match a key in BookingSection's LOCATION_INFO. */
  location: LocationId
  venue: string
}

// Hand-maintained schedule — add the next few months here as they're set.
// Two rules, both enforced by the booking form rather than by this list:
// Italian Charm Bracelet runs at The Plaza only, and a date is only ever
// preselected on /book if availability says it's genuinely bookable, so a
// stale entry here degrades to an ordinary empty form rather than a wrong one.
export const SESSIONS: Session[] = [
  { id: 's1', activity: 'phonecase', name: 'Phone Case',             date: '2026-08-15', when: 'Sat, 15 August',    price: '€28',      location: 'plaza',   venue: 'The Plaza Sliema' },
  { id: 's2', activity: 'bracelet',  name: 'Italian Charm Bracelet', date: '2026-08-22', when: 'Sat, 22 August',    price: 'from €15', location: 'plaza',   venue: 'The Plaza Sliema' },
  { id: 's3', activity: 'phonecase', name: 'Phone Case',             date: '2026-08-30', when: 'Sun, 30 August',    price: '€28',      location: 'mercury', venue: 'Mercury Tower' },
  { id: 's4', activity: 'bracelet',  name: 'Italian Charm Bracelet', date: '2026-09-05', when: 'Sat, 5 September',  price: 'from €15', location: 'plaza',   venue: 'The Plaza Sliema' },
  { id: 's5', activity: 'phonecase', name: 'Phone Case',             date: '2026-09-12', when: 'Sat, 12 September', price: '€28',      location: 'mercury', venue: 'Mercury Tower' },
  { id: 's6', activity: 'bracelet',  name: 'Italian Charm Bracelet', date: '2026-09-20', when: 'Sun, 20 September', price: 'from €15', location: 'plaza',   venue: 'The Plaza Sliema' },
  { id: 's7', activity: 'phonecase', name: 'Phone Case',             date: '2026-09-26', when: 'Sat, 26 September', price: '€28',      location: 'plaza',   venue: 'The Plaza Sliema' },
  { id: 's8', activity: 'bracelet',  name: 'Italian Charm Bracelet', date: '2026-10-03', when: 'Sat, 3 October',    price: 'from €15', location: 'plaza',   venue: 'The Plaza Sliema' },
]

/**
 * Finds the session a /book URL is talking about.
 *
 * Both halves have to match: the same workshop runs on several dates, so
 * activity alone would pick an arbitrary one and show the wrong date back to
 * someone who clicked a specific ticket. Returns undefined for a URL that
 * doesn't name a real session — the page then just shows an empty form.
 */
export function findSession(activity?: string, date?: string): Session | undefined {
  if (!activity || !date) return undefined
  return SESSIONS.find((s) => s.activity === activity && s.date === date)
}

/** What each workshop needs to ask about, shown on the booking page. */
export const ACTIVITY_DETAIL: Record<ActivityId, {
  blurb: string
  /** The decision the visitor has to make, spelled out before the form. */
  choice: string
  options: { title: string; body: string; href?: string; cta?: string }[]
}> = {
  phonecase: {
    blurb:
      'Two hours, all materials included, and you walk out with the case on your phone. No design experience needed — we print whatever you come up with.',
    choice: 'We just need to know which phone you have',
    options: [
      {
        title: 'Pick your model in the form below',
        body: 'Choose your brand and model in step 4. We only list what that shop has in stock on the day, so if your model is there, your case is there.',
      },
      {
        title: 'Model not listed?',
        body: 'We can usually order it in for the session — message us and we will confirm before you pay.',
        href: 'https://instagram.com/oddlycraft',
        cta: 'Ask us on Instagram',
      },
    ],
  },
  bracelet: {
    blurb:
      'Build a bracelet from 500+ Italian charms. The base and the session are covered by the deposit; you only pay for the charms you actually choose.',
    choice: 'Two ways to do this one',
    options: [
      {
        title: 'Pay the €15 deposit, choose on the day',
        body: 'The usual way. Turn up, go through the whole charm wall with us, and settle up for the charms you picked at the end of the session.',
      },
      {
        title: 'Design your combo now',
        body: 'Lay out your bracelet in the charm builder first and bring it with you — handy if you already know what you want, or if it is a gift.',
        href: '/charm-builder',
        cta: 'Open the charm builder',
      },
    ],
  },
}
