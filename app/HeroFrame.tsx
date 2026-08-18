// A loose frame of charms around the WELCOME TO CUSTOM CLUB lettering.
//
// Everything sits in the outer margins of the hero on purpose. The lettering
// block is max-w-3xl and centred, so on a desktop viewport it occupies roughly
// x 20–80% and y 31–69%; nothing here is placed inside that, and most of it is
// well outside. Absolutely positioned, so it never affects the hero's height.

type FrameCharm = {
  src: string
  x: number      // % across the hero
  y: number      // % down the hero
  size: number   // px, longest edge
  rot: number
  anim: 'float' | 'float-r' | 'float-slow' | 'swing' | 'swing-slow'
  delay: number
  /** Kept on narrow screens. The side charms are dropped there — the lettering
   *  scales to the viewport width and would end up sitting right beside them. */
  onMobile: boolean
}

// Italian charm links only — the flat rectangular ones from Gold Charm, to
// match the WELCOME TO CUSTOM CLUB lettering, which is made of the same links.
// (The dangles are saved for the shower.)
//
// Space around the lettering is not symmetrical: on a 1280x720 screen there is
// only ~139px of room above it, but ~235px below and ~248px either side. So
// nothing sits directly over the top of the phrase — the top of the frame is
// carried by corner clusters instead, far enough out diagonally to breathe.
const FRAME: FrameCharm[] = [
  // ── top corners ──
  { src: 'sparkle-heart',       x: 5,  y: 15, size: 64, rot: -12, anim: 'float',      delay: 0.0, onMobile: true },
  { src: 'pink-star-bubble',    x: 14, y: 5,  size: 54, rot: 9,   anim: 'float-r',    delay: 0.9, onMobile: false },
  { src: 'lucky-3-leaf-clover', x: 86, y: 5,  size: 56, rot: 14,  anim: 'float-slow', delay: 0.4, onMobile: false },
  { src: 'rainbow-heart',       x: 95, y: 15, size: 62, rot: 11,  anim: 'float-r',    delay: 1.2, onMobile: true },

  // ── down the sides, well clear of the text block. Anything in the top band
  //    has to stay outside the phrase's width too, or its only clearance is
  //    the ~139px of vertical room up there, which isn't enough. ──
  { src: 'red-star',            x: 10, y: 26, size: 48, rot: -7,  anim: 'float-slow', delay: 1.7, onMobile: false },
  { src: 'good-luck',           x: 90, y: 26, size: 50, rot: 6,   anim: 'swing-slow', delay: 2.2, onMobile: false },
  { src: 'cotton-candy',        x: 3,  y: 33, size: 56, rot: 16,  anim: 'float-slow', delay: 0.6, onMobile: false },
  { src: 'girl-power-heart',    x: 7,  y: 50, size: 50, rot: -5,  anim: 'swing',      delay: 1.9, onMobile: false },
  { src: 'earth-heart',         x: 4,  y: 68, size: 54, rot: -9,  anim: 'float-r',    delay: 1.1, onMobile: false },
  { src: 'smiley-face',         x: 97, y: 31, size: 52, rot: -14, anim: 'swing',      delay: 1.4, onMobile: false },
  { src: 'paper-crane',         x: 93, y: 49, size: 48, rot: 8,   anim: 'float',      delay: 0.8, onMobile: false },
  { src: 'pink-ribbon',         x: 96, y: 67, size: 56, rot: 7,   anim: 'float-slow', delay: 0.3, onMobile: false },

  // ── across the bottom, where there is the most room ──
  { src: 'sunset',              x: 9,  y: 87, size: 54, rot: 13,  anim: 'float',      delay: 1.5, onMobile: true },
  { src: 'beach-island',        x: 23, y: 94, size: 50, rot: -8,  anim: 'float-slow', delay: 0.2, onMobile: false },
  { src: 'unicorn-whale',       x: 37, y: 90, size: 52, rot: 5,   anim: 'swing-slow', delay: 2.4, onMobile: false },
  { src: 'cappucino',           x: 51, y: 95, size: 48, rot: -6,  anim: 'float-r',    delay: 1.0, onMobile: true },
  { src: 'game-controller',     x: 65, y: 90, size: 52, rot: 9,   anim: 'float',      delay: 0.5, onMobile: false },
  { src: 'fries',               x: 78, y: 94, size: 50, rot: -11, anim: 'float-r',    delay: 0.7, onMobile: false },
  { src: 'black-star',          x: 91, y: 87, size: 54, rot: 10,  anim: 'swing',      delay: 2.0, onMobile: true },
]

export default function HeroFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {FRAME.map((c) => (
        <div
          key={c.src}
          className={`absolute ${c.onMobile ? '' : 'hidden md:block'}`}
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            // Base tilt lives on the wrapper so the float/swing keyframes below
            // don't overwrite it.
            transform: `translate(-50%, -50%) rotate(${c.rot}deg)`,
          }}
        >
          <img
            src={`/charms/pour/${c.src}.webp`}
            alt=""
            loading="lazy"
            decoding="async"
            className={`animate-${c.anim} block`}
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: `clamp(${Math.round(c.size * 0.55)}px, ${(c.size / 14).toFixed(1)}vw, ${c.size}px)`,
              maxHeight: `clamp(${Math.round(c.size * 0.55)}px, ${(c.size / 14).toFixed(1)}vw, ${c.size}px)`,
              animationDelay: `${c.delay}s`,
              filter: 'drop-shadow(0 5px 10px rgba(0, 46, 120, 0.18))',
              opacity: 0.92,
            }}
          />
        </div>
      ))}
    </div>
  )
}
