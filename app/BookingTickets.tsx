'use client'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TicketIcon } from './ButtonIcons'
import { SESSIONS } from './workshops'

/**
 * "Book Your Upcoming Workshop" — the scheduled sessions as a rail of tear-off
 * tickets you drag sideways, with arrow buttons either side.
 *
 * Every ticket is a link into /book carrying its own workshop, date and shop,
 * so the booking form opens part-filled. The form itself is not on this page —
 * see app/book/page.tsx.
 *
 * Dragging is layered *on top of* a normally scrollable element rather than
 * replacing its scrolling: the container is a real overflow-x scroller, so
 * trackpads, shift+wheel, touch and the keyboard all keep working untouched,
 * and the pointer handlers only add mouse-drag for people who have neither a
 * trackpad nor a touchscreen. The arrows are a third way into the same
 * scrollLeft, for anyone who wouldn't think to try either.
 */

/**
 * The stub's barcode. Purely decorative — it encodes nothing.
 *
 * Bar widths come from a hash of the ticket id rather than Math.random: the
 * same ticket has to draw the same barcode on the server and on the client, or
 * React reports a hydration mismatch and the pattern flickers on load.
 */
function Barcode({ seed }: { seed: string }) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0
  const next = () => { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return h >>> 16 }

  const bars: React.ReactElement[] = []
  let x = 0
  for (let i = 0; i < 28; i++) {
    const w = 1 + (next() % 3)
    bars.push(<rect key={i} x={x} y="0" width={w} height="100" fill="currentColor" />)
    x += w + 1 + (next() % 2)
  }
  // preserveAspectRatio="none" so the bars stretch to whatever the stub gives
  // them without the whole barcode shrinking to fit.
  return (
    <svg className="ticket__barcode" viewBox={`0 0 ${x} 100`} preserveAspectRatio="none" aria-hidden focusable="false">
      {bars}
    </svg>
  )
}

export default function BookingTickets() {
  const railRef = useRef<HTMLDivElement>(null)
  // The live drag flag is a ref, not state: state updates are asynchronous, so
  // the first pointermove after pointerdown would still see `false` and drop
  // the movement. `dragging` state exists purely to swap the cursor.
  const isDown = useRef(false)
  const [dragging, setDragging] = useState(false)
  // Whether the pointer actually moved. A click that happens to land on a card
  // must still follow its link; only a real drag should swallow it.
  const moved = useRef(false)
  const start = useRef({ x: 0, scroll: 0 })
  const [canScroll, setCanScroll] = useState({ left: false, right: false })

  const syncArrows = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const max = rail.scrollWidth - rail.clientWidth
    setCanScroll({
      // A pixel of slack: fractional scroll positions mean scrollLeft rarely
      // lands exactly on 0 or on max.
      left: rail.scrollLeft > 1,
      right: rail.scrollLeft < max - 1,
    })
  }, [])

  useEffect(() => {
    syncArrows()
    // Overflow depends on the rail's width, so a resize can flip an arrow on
    // or off without anything being scrolled. Measured a frame late: read
    // straight from the observer callback and scrollWidth still reports the
    // pre-resize value, which leaves the arrow stuck in its old state until
    // something else nudges the rail.
    const rail = railRef.current
    if (!rail) return
    let frame = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(syncArrows)
    })
    ro.observe(rail)
    return () => { cancelAnimationFrame(frame); ro.disconnect() }
  }, [syncArrows])

  // Handles for the in-flight glide, so a second arrow click retargets the
  // animation instead of racing the first one.
  const glideFrame = useRef(0)
  const glideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Where the current glide is heading, or null when nothing is in flight.
  // Clicking twice quickly should advance two whole tickets, so the second
  // click measures from the first one's destination rather than from wherever
  // the animation happens to have got to.
  const glideTarget = useRef<number | null>(null)
  useEffect(() => () => {
    cancelAnimationFrame(glideFrame.current)
    clearTimeout(glideTimer.current)
  }, [])

  /**
   * Glides one ticket along, easing the whole way.
   *
   * Two things make this smooth rather than a jump, and both are load-bearing:
   *
   * 1. SNAP IS SUSPENDED for the duration. `scroll-snap-type` re-snaps on every
   *    programmatic write to scrollLeft, so an rAF animation that sets a new
   *    position sixty times a second gets yanked onto the nearest ticket on the
   *    very first frame — which is exactly the "pops instead of sliding" the
   *    animation was meant to avoid. It goes back on at the end.
   * 2. THE TARGET IS A REAL SNAP POSITION — the scrollLeft at which the next
   *    ticket is centred, the same place snap would have chosen. So when snap
   *    is switched back on it has nothing to correct and there's no jolt at the
   *    end of the glide.
   *
   * The easing is driven here rather than by scrollBy({behavior:'smooth'}) or
   * CSS scroll-behavior. Both of those are *dropped entirely* where the engine
   * has scroll animations disabled — not downgraded to an instant jump — which
   * leaves the arrow doing nothing at all. So: animate with rAF, and arm a
   * timer for just after the animation should have finished that jumps to the
   * target if the frames never came.
   */
  const nudge = useCallback((dir: -1 | 1) => {
    const rail = railRef.current
    if (!rail) return

    cancelAnimationFrame(glideFrame.current)
    clearTimeout(glideTimer.current)

    const cards = [...rail.querySelectorAll<HTMLElement>('.ticket')]
    if (cards.length === 0) return
    const max = rail.scrollWidth - rail.clientWidth
    const railLeft = rail.getBoundingClientRect().left

    // The scrollLeft that centres each ticket. Measured through
    // getBoundingClientRect rather than offsetLeft, which is relative to
    // whatever the nearest positioned ancestor happens to be.
    const stops = cards.map((c) => {
      const r = c.getBoundingClientRect()
      const centre = (r.left - railLeft) + rail.scrollLeft + r.width / 2
      return Math.max(0, Math.min(max, centre - rail.clientWidth / 2))
    })

    const from = rail.scrollLeft
    const base = glideTarget.current ?? from

    // Nearest stop to where we are (or are heading), then walk one step that
    // way. The walk skips stops that clamp to the same place — at either end
    // several tickets share a stop, and stepping onto one of those would look
    // like a dead button.
    let idx = 0
    let best = Infinity
    stops.forEach((s, i) => { const d = Math.abs(s - base); if (d < best) { best = d; idx = i } })

    let to = base
    for (let i = idx + dir; i >= 0 && i < stops.length; i += dir) {
      if (Math.abs(stops[i] - base) > 1) { to = stops[i]; break }
    }
    if (Math.abs(to - from) <= 1) { glideTarget.current = null; return }
    glideTarget.current = to

    const DURATION = 460
    // easeOutCubic: leaves quickly, settles gently — the rail should feel
    // flicked rather than winched.
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const t0 = performance.now()
    let ran = false

    // Inline rather than a class: this has to be in effect before the first
    // frame runs, and a React state change would not land until the next paint.
    rail.style.scrollSnapType = 'none'

    const finish = () => {
      rail.style.scrollSnapType = ''
      glideTarget.current = null
      syncArrows()
    }

    const frame = (now: number) => {
      ran = true
      const t = Math.min(1, (now - t0) / DURATION)
      rail.scrollLeft = from + (to - from) * ease(t)
      if (t < 1) { glideFrame.current = requestAnimationFrame(frame); return }
      finish()
    }
    glideFrame.current = requestAnimationFrame(frame)

    glideTimer.current = setTimeout(() => {
      cancelAnimationFrame(glideFrame.current)
      // Only step in if not a single frame ran — i.e. the glide never happened
      // at all, because the engine has animation frames switched off.
      if (!ran) rail.scrollLeft = to
      finish()
    }, DURATION + 80)
  }, [syncArrows])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Mouse only. Touch and pen already pan the scroller natively, and hijacking
    // them here would fight the browser's own momentum scrolling.
    if (e.pointerType !== 'mouse') return
    const rail = railRef.current
    if (!rail) return
    isDown.current = true
    moved.current = false
    start.current = { x: e.clientX, scroll: rail.scrollLeft }
    // Keeps the drag alive when the pointer wanders outside the rail mid-swipe.
    try { rail.setPointerCapture(e.pointerId) } catch { /* capture is best-effort */ }
    setDragging(true)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDown.current) return
    const rail = railRef.current
    if (!rail) return
    const dx = e.clientX - start.current.x
    if (Math.abs(dx) > 3) moved.current = true
    rail.scrollLeft = start.current.scroll - dx
  }, [])

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDown.current) return
    isDown.current = false
    const rail = railRef.current
    if (rail?.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId)
    setDragging(false)
  }, [])

  return (
    <section id="tickets" className="tickets">
      <h2 className="tickets__title">Book Your Upcoming Workshop</h2>

      <div className="tickets__viewport">
        <button
          type="button"
          className="tickets__arrow tickets__arrow--prev"
          onClick={() => nudge(-1)}
          disabled={!canScroll.left}
          aria-label="See earlier workshops"
        >
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path d="M15 4 L7 12 L15 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          ref={railRef}
          className={`tickets__rail${dragging ? ' is-dragging' : ''}`}
          onScroll={syncArrows}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          // Focusable and labelled so the rail can be scrolled with arrow keys,
          // which is the only way through it without a mouse or trackpad.
          tabIndex={0}
          role="group"
          aria-label="Upcoming workshops — scroll sideways for more"
        >
          {SESSIONS.map((s) => (
            <Link
              key={s.id}
              href={`/book?activity=${s.activity}&date=${s.date}&location=${s.location}`}
              className="ticket"
              onClick={(e) => { if (moved.current) e.preventDefault() }}
              draggable={false}
              // Every ticket points at the same route with a different query,
              // so the default would prefetch /book once per ticket for a page
              // most visitors open at most one of.
              prefetch={false}
            >
              <span className="ticket__body">
                <span className="ticket__venue">{s.venue}</span>
                <span className="ticket__name">{s.name}</span>
                <span className="ticket__when">{s.when}</span>
                {/* Price lives here rather than on the stub: rotated 90° it was
                    both hard to read and long enough to overflow the stub on a
                    phone, where the ticket is only ~108px tall. */}
                <span className="ticket__foot">
                  <span className="ticket__price">{s.price}</span>
                  <span className="ticket__cta">reserve your spot →</span>
                </span>
              </span>
              <span className="ticket__stub">
                <Barcode seed={s.id} />
                <span className="ticket__stub-text">oddlycraft</span>
              </span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="tickets__arrow tickets__arrow--next"
          onClick={() => nudge(1)}
          disabled={!canScroll.right}
          aria-label="See more workshops"
        >
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path d="M9 4 L17 12 L9 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* For anyone whose date isn't on the rail. No query string, so /book
          opens with nothing preselected and they pick the workshop themselves. */}
      <div className="tickets__more">
        <Link href="/book" className="btn">
          I Want A Date
          <TicketIcon />
        </Link>
      </div>

      {/* Closes the section off from Build Your Bracelet below. */}
      <hr className="rule-check tickets__rule" />
    </section>
  )
}
