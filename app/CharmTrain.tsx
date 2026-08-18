/**
 * A red rally car towing a line of charm boxes across the bottom of the hero,
 * left to right.
 *
 * (The file is still called CharmTrain because the class names, the page import
 * and the "train" in every conversation about it are — it stopped being a train
 * and became a car, but it does the same job in the same slot.)
 *
 * The car is drawn from the reference photo: long low bonnet, cockpit set back,
 * short tail, rally roundel and GB plate on the flank, big wheels with pale
 * hubs. It is MIRRORED from the reference, which faces left — this one has to
 * face the way it travels.
 *
 * Built as a marquee: the convoy is rendered twice and the strip slides exactly
 * one copy's width, so the wrap lands on an identical frame and never shows.
 *
 * Three things about the layout are deliberate and easy to break:
 *
 * 1. DIRECTION. The strip animates -50% → 0, i.e. rightwards. With the car last
 *    in the convoy and the boxes before it, the car leads and the load trails
 *    behind. Reverse the animation and the car pushes its load instead.
 * 2. FIRST FRAME. At -50% the first copy's car ends exactly at x=0, so on load
 *    the car's nose is at the left edge of the screen and it drives in.
 * 3. THE GAP. padding-left on the convoy is empty road between one load's last
 *    box and the next car — without it the car reappears welded to the box in
 *    front.
 *
 * Both SVGs share the same viewBox *height* (86) and are sized in proportion to
 * their viewBox widths, so car and boxes render at exactly the same scale and
 * their wheels sit on the same ground line (y=83). Change one viewBox without
 * the other and the car floats or sinks.
 */

// One charm per box. Italian charms only — the flat rectangular links from the
// Gold Charm range, no dangles. build-charms.mjs is the list to check against:
// anything under its `['Dangles', …]` heading does not belong here.
const CARGO = [
  'rainbow-heart', 'sparkle-heart', 'good-luck', 'smiley-face',
  'girl-power-heart', 'cotton-candy', 'pink-star-bubble', 'earth-heart',
  'paper-crane', 'sunset', 'unicorn-whale', 'fries',
  'beach-island', 'elephant', 'game-controller', 'lipstick',
] as const

// Red, the same red as the checked rules further down the page — so the one
// thing moving across the hero is also the one thing on the page that isn't
// blue.
//
// ONE red for every painted surface, car and boxes alike. The boxes used to be
// a pale pink so the car would read as the thing in front, but at the size the
// parade actually runs the pink just looked like the red had faded, and the
// convoy came apart into two different things. Depth is carried by the deep red
// (wheels, edges, markings) and the cream (glass, hubs) instead — those two do
// the separating, and the paint stays one colour.
const CAR = '#E12B39'
const CAR_DARK = '#8E1622'
const CREAM = '#FFF3E2'
const BOX = CAR
const BOX_EDGE = '#C81E2B'

/**
 * One towed box, with a charm sitting down in it.
 *
 * The charm is painted *before* the box, so the box front hides its lower half
 * while the top stays clearly in view — it should read as cargo riding in the
 * box, not as a lid. Bottom-anchoring the image (xMidYMax) keeps that buried
 * depth consistent for tall and squat charms alike, which the charm art is not
 * consistent about.
 *
 * The numbers: the image box is 62x38 ending at y=58, and the box front starts
 * at y=42, so roughly 55% of the charm stands proud of the rim. Shrink the
 * image box or push its y down to bury more of it.
 *
 * The coupling line runs through the middle of the box (y=57, the box body's
 * own centre) and spans the full viewBox width. It is painted *before* the box
 * front, so it only shows in the 8-unit margin either side of the body — which
 * is exactly the stretch between one box and the next, and reads as a line
 * threading them together.
 */
function CharmBox({ charm }: { charm: string }) {
  return (
    <div className="charm-train__box">
      <svg viewBox="0 0 90 86" className="charm-train__boxsvg" aria-hidden focusable="false">
        <rect x="0" y="54" width="90" height="6" fill={BOX_EDGE} />
        <image
          href={`/charms/pour/${charm}.webp`}
          x="14" y="20" width="62" height="38"
          preserveAspectRatio="xMidYMax meet"
        />
        <rect x="8" y="42" width="74" height="30" rx="4" fill={BOX} />
        <rect x="8" y="42" width="74" height="5" rx="2.5" fill={BOX_EDGE} />
        <circle cx="26" cy="77" r="6" fill={CAR_DARK} />
        <circle cx="64" cy="77" r="6" fill={CAR_DARK} />
        <circle cx="26" cy="77" r="2.2" fill={CREAM} />
        <circle cx="64" cy="77" r="2.2" fill={CREAM} />
      </svg>
    </div>
  )
}

/** The rally car, nose to the right — the direction of travel. */
function RallyCar() {
  return (
    <div className="charm-train__car">
      <svg viewBox="0 0 260 86" className="charm-train__carsvg" aria-hidden focusable="false">
        {/* Speed sparkles overhead, as in the reference */}
        <g className="charm-train__puff">
          <circle cx="150" cy="10" r="2.2" fill={CAR_DARK} opacity="0.4" />
          <circle cx="170" cy="5" r="1.6" fill={CAR_DARK} opacity="0.3" />
          <circle cx="198" cy="12" r="2.4" fill={CAR_DARK} opacity="0.35" />
        </g>

        {/* Tow line, leaving the tail at the same height as the boxes' own
            coupling line (y=57) so the whole convoy is strung on one rule */}
        <rect x="0" y="54" width="24" height="6" fill={BOX_EDGE} />

        {/* Body: short tail left, cockpit set back, long bonnet to the nose */}
        <path
          d="M12 60 C12 51 15 47 23 45 L58 42 C62 33 70 23 84 20 L122 19
             C134 20 142 26 149 34 L214 36 C236 37 252 43 252 53
             L252 62 C252 66 248 68 244 68 L20 68 C14 68 12 65 12 60 Z"
          fill={CAR}
        />
        {/* Wraparound glass */}
        <path d="M76 34 C80 27 87 23 96 22 L120 22 C130 23 138 27 144 34 Z" fill={CREAM} />
        {/* Driver, cap and all */}
        <circle cx="103" cy="29" r="6" fill={CREAM} />
        <path d="M96 27 Q103 20 110 27 Z" fill={CAR_DARK} />
        {/* Blank plate on the door and a blank roundel on the bonnet flank —
            both deliberately unlettered. The rally car they came from carried
            "GB" and "1961"; at this size the type was a smudge, and the two
            shapes read as markings on their own. */}
        <rect x="126" y="44" width="22" height="16" rx="2" fill={CAR_DARK} />
        <circle cx="181" cy="50" r="11" fill={CAR_DARK} />
        <circle cx="181" cy="50" r="5" fill={CREAM} />
        {/* Headlight up on the nose, and the tail light at the other end */}
        <circle cx="237" cy="47" r="6.5" fill={CREAM} />
        <circle cx="237" cy="47" r="6.5" fill="none" stroke={CAR_DARK} strokeWidth="1.6" />
        <rect x="12" y="50" width="5" height="7" rx="2" fill={CAR_DARK} />
        {/* Wheels, sitting on the ground line at y=83 */}
        <circle cx="70" cy="69" r="14" fill={CAR_DARK} />
        <circle cx="216" cy="69" r="14" fill={CAR_DARK} />
        <circle cx="70" cy="69" r="6" fill={CREAM} />
        <circle cx="216" cy="69" r="6" fill={CREAM} />
      </svg>
    </div>
  )
}

function Convoy() {
  return (
    <div className="charm-train__convoy">
      {/* Boxes first, car last: the convoy travels rightwards, so the car has
          to be at the right-hand end doing the towing. */}
      {CARGO.map((charm) => (
        <CharmBox key={charm} charm={charm} />
      ))}
      <RallyCar />
    </div>
  )
}

export default function CharmTrain() {
  return (
    <div className="charm-train" aria-hidden>
      <div className="charm-train__strip">
        <Convoy />
        {/* Second copy is what makes the loop seamless — never remove it. */}
        <Convoy />
      </div>
    </div>
  )
}
