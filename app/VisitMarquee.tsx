/**
 * The pink ticker that runs above the two shops — "Visit Us In Real Life",
 * over and over, with a heart between each pass.
 *
 * Set in the same typewriter face as the shop headings directly below it, so
 * the band and the two boards under it read as one fitting: a strip of ticker
 * tape over a pair of shop signs. It is the only pink on the page, which is
 * what earns it the attention — a rule above the maps rather than another
 * heading competing with them.
 *
 * ── The loop ─────────────────────────────────────────────────────────────
 * Same discipline as every other marquee here: the list is laid down COPIES
 * times, the strip travels exactly one copy's width, and the wrap therefore
 * lands on an identical frame. Two things keep that exact and both are easy to
 * break:
 *
 * 1. NO FLEX `gap`. Twelve items have eleven gaps, so a gapped strip is one gap
 *    narrower than two whole copies and -50% lands short — a visible twitch,
 *    once per lap. The space after each phrase is padding INSIDE the item, so
 *    every item is the same width and half the strip is exactly one copy.
 * 2. ONE COPY MUST CLEAR THE SCREEN. What is still standing at the wrap is
 *    (COPIES - 1) copies, so with two copies that is a single copy — REPEATS is
 *    high enough that one copy runs past a very wide monitor. Lower it and the
 *    tail of the band walks into view on a big screen.
 */

const COPIES = 2
const REPEATS = 10

/**
 * Hollow heart — an outline with the band's pink showing through, not a solid.
 *
 * `fill="none"` rather than a pink fill: the heart has to sit on the ticker's
 * pink here, and a hard-coded fill would carry that pink with it the moment
 * this is reused anywhere else. Left open, whatever is behind shows through.
 *
 * The stroke is on the heavy side for its size on purpose — at ticker scale a
 * hairline outline greys out next to 700-weight mono and stops reading as part
 * of the same stamp.
 */
function Heart() {
  return (
    <svg
      className="visit__heart"
      viewBox="0 0 24 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <path
        d="M12 20.2 C-1.4 11.6 1.5 2 7.4 2 C10 2 11.4 3.8 12 5.1
           C12.6 3.8 14 2 16.6 2 C22.5 2 25.4 11.6 12 20.2 Z"
      />
    </svg>
  )
}

export default function VisitMarquee() {
  const items = Array.from({ length: COPIES * REPEATS })

  return (
    <div className="visit">
      {/* The strip says the same six words twenty times, which is a ticker to
          look at and an ordeal to listen to — so the band is hidden from
          assistive tech and this carries the message once instead. */}
      <p className="sr-only">Visit us in real life.</p>

      <div className="visit__strip" aria-hidden>
        {items.map((_, i) => (
          <span key={i} className="visit__item">
            Visit Us In Real Life
            <Heart />
          </span>
        ))}
      </div>
    </div>
  )
}
