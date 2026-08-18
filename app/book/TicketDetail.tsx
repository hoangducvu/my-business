import Link from 'next/link'
import { ACTIVITY_DETAIL, type Session } from '../workshops'

/**
 * The "what am I actually booking" panel, shown above the form when someone
 * arrives here from a specific workshop ticket.
 *
 * The form underneath asks *when* and *how many*. This answers the questions
 * that are particular to the workshop itself — which phone for a phone case,
 * deposit-or-design-now for a bracelet — before anyone gets as far as paying.
 */
export default function TicketDetail({ session }: { session: Session }) {
  const detail = ACTIVITY_DETAIL[session.activity]

  return (
    <section className="px-4 pt-8" aria-labelledby="ticket-detail-heading">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl overflow-hidden" style={{ border: '3px solid #F2678F', background: '#F8F2C4' }}>

          {/* Header — mirrors the ticket that was clicked, so it's obvious the
              right one was picked up. */}
          <div className="p-6 sm:p-8" style={{ color: '#F2678F' }}>
            <div className="text-xs font-black uppercase tracking-[0.16em] opacity-75 mb-2">
              {session.venue}
            </div>
            <h2
              id="ticket-detail-heading"
              className="text-3xl sm:text-4xl font-black leading-tight mb-1"
              style={{ fontFamily: 'var(--font-baloo), sans-serif' }}
            >
              {session.name}
            </h2>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-black">
              <span className="text-lg">{session.when}</span>
              <span className="text-lg">{session.price}</span>
            </div>
            <p className="mt-4 max-w-2xl font-semibold leading-relaxed" style={{ color: '#B8456C' }}>
              {detail.blurb}
            </p>
          </div>

          {/* The workshop-specific decision */}
          <div className="p-6 sm:p-8" style={{ background: '#fffeee', borderTop: '3px dashed rgba(242, 103, 143, 0.45)' }}>
            <h3 className="font-black text-lg mb-4" style={{ color: '#F2678F' }}>
              {detail.choice}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {detail.options.map((opt) => (
                <div
                  key={opt.title}
                  className="rounded-2xl p-5 flex flex-col"
                  style={{ background: '#F8F2C4', border: '2px solid rgba(242, 103, 143, 0.4)' }}
                >
                  <div className="font-black mb-1.5" style={{ color: '#F2678F' }}>{opt.title}</div>
                  <p className="text-sm font-semibold leading-relaxed flex-1" style={{ color: '#B8456C' }}>
                    {opt.body}
                  </p>
                  {opt.href && opt.cta && (
                    opt.href.startsWith('/') ? (
                      <Link
                        href={opt.href}
                        className="inline-block mt-4 px-4 py-2.5 rounded-xl font-black text-sm text-center transition hover:opacity-85"
                        style={{ background: '#F2678F', color: '#fffeee' }}
                      >
                        {opt.cta}
                      </Link>
                    ) : (
                      <a
                        href={opt.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 px-4 py-2.5 rounded-xl font-black text-sm text-center transition hover:opacity-85"
                        style={{ background: '#F2678F', color: '#fffeee' }}
                      >
                        {opt.cta}
                      </a>
                    )
                  )}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm font-bold" style={{ color: '#B8456C' }}>
              Your date and workshop are already filled in below — pick a time and you&apos;re done.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
