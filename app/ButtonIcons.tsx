/**
 * The little drawings that sit at the end of a call-to-action button.
 *
 * One per button, picked to match what the button actually does — a ticket on
 * the one that books you a place, a star on the one that opens the designer.
 * They replaced a single pointing hand that appeared on every button, which
 * said nothing about where any of them went.
 *
 * ── House rules for anything added here ──────────────────────────────────
 * - OUTLINE ONLY. `fill="none"`, stroke in `currentColor`, no second colour.
 *   That is what lets them sit on the button's transparent inside and then
 *   flip to cream with the label when the button fills blue on hover; a
 *   hard-coded blue would vanish into that fill, and a white fill would read
 *   as a solid blob punched out of it.
 * - ONE STROKE WIDTH for the main outline, a lighter one for interior detail
 *   only. Two competing weights on the same contour read as a mistake.
 * - SIZED IN CSS (`.btn__icon`), so they scale with the label. The width and
 *   height attributes here only fix the aspect ratio.
 *
 * The nudge on hover is CSS too: see `.btn:hover .btn__icon` in globals.css.
 */

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/**
 * An admission ticket, for "I Want A Date" — and on hover the stub tears off.
 *
 * The two notches are the whole icon. A rounded rectangle with a dashed line
 * in it is a coupon, a form, a card — it is the bite taken out of the top and
 * bottom edges at the perforation that says "ticket", and it is the first
 * thing to protect if this is ever resized.
 *
 * Those notches are concave, so they run the OPPOSITE way round to the four
 * corners. The body is traced anticlockwise and the stub clockwise, so the two
 * halves take opposite sweep flags from each other for the SAME feature — the
 * body's corners are 0 and its notch halves 1, the stub's corners are 1 and
 * its notch halves 0. Flip one and that notch bulges outward into a bump.
 *
 * ── Why it is three pieces and not one ───────────────────────────────────
 * Splitting at x=21 cuts both notches exactly in half — a notch is 4.8 wide
 * centred on the seam, and its deepest point is 1.8 in, which is where each
 * half starts and ends: (21, 3.2) and (21, 20.8).
 *
 * Both halves are OPEN paths with no edge along the seam, and the dashed line
 * between them is a third path that belongs to neither. That is what makes the
 * tear work: at rest the dashes read as the perforation and the ticket looks
 * whole, and when the stub swings away on hover its seam side is already open,
 * so it reads as a torn edge rather than as a rectangle sliding out of another
 * rectangle. Close either half and the illusion goes.
 *
 * The animation is in globals.css — see `.btn__ticket-stub`.
 */
export function TicketIcon() {
  return (
    <svg
      className="btn__icon btn__icon--ticket"
      viewBox="0 0 34 24"
      width="34"
      height="24"
      strokeWidth="1.9"
      {...STROKE}
      aria-hidden
      focusable="false"
    >
      {/* Body: seam top → anticlockwise round the left → seam bottom. */}
      <path
        d="M21 3.2 A2.5 2.5 0 0 1 18.6 1.4 H4.4
           A3 3 0 0 0 1.4 4.4 V19.6 A3 3 0 0 0 4.4 22.6
           H18.6 A2.5 2.5 0 0 1 21 20.8"
      />
      {/* The perforation. Stays with the body when the stub goes. */}
      <path d="M21 3.2 L21 20.8" strokeWidth="1.5" strokeDasharray="2 2.2" />
      {/* Stub: seam top → clockwise round the right → seam bottom. */}
      <path
        className="btn__ticket-stub"
        d="M21 3.2 A2.5 2.5 0 0 0 23.4 1.4 H29.6
           A3 3 0 0 1 32.6 4.4 V19.6 A3 3 0 0 1 29.6 22.6
           H23.4 A2.5 2.5 0 0 0 21 20.8"
      />
    </svg>
  )
}

/**
 * A hollow five-pointed star, for "Let's build" — and on hover it spins.
 *
 * Open in the middle, not a solid ★ — the button is an invitation to fill
 * something in, and an outline star says that where a filled one says done.
 *
 * Plotted rather than eyeballed: ten points alternating between an outer
 * radius of 13 and an inner radius of 5.6 about (15, 15), starting straight up
 * and stepping 36° at a time. The ratio between those two radii is the only
 * number that matters — much above 0.45 and the points go stubby, much below
 * and they thin into a starburst.
 *
 * The spin is 144°, and that number is not arbitrary: a five-pointed star maps
 * onto itself every 72°, so 144° is two whole symmetry steps and the star comes
 * to rest in exactly the orientation it started in. You see it turn, you never
 * see it land crooked. Any multiple of 72 works; anything else does not.
 * See `.btn__icon--star` in globals.css.
 */
export function StarIcon() {
  return (
    <svg
      className="btn__icon btn__icon--star"
      viewBox="0 0 30 30"
      width="30"
      height="30"
      strokeWidth="2.1"
      {...STROKE}
      aria-hidden
      focusable="false"
    >
      <polygon
        points="15,2 18.29,10.47 27.37,10.98 20.33,16.73 22.64,25.52
                15,20.6 7.36,25.52 9.67,16.73 2.63,10.98 11.71,10.47"
      />
    </svg>
  )
}
