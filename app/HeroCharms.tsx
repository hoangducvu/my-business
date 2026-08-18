import CharmPour from './CharmPour'
import HeroFrame from './HeroFrame'

const WORDS = {
  welcome: 7,
  to: 2,
  custom: 6,
  club: 4,
} as const

// Three distinct animation "personalities" a letter can have — a bob, a
// wiggle, and a pop — so neighbouring letters never move the same way.
const STYLES = ['letter-bob', 'letter-wiggle', 'letter-pop'] as const

type Letter = { file: string; anim: (typeof STYLES)[number]; dur: number; delay: number }

// Deterministic (no Math.random — keeps server/client render identical)
// per-letter variety: every letter gets its own animation type, speed and
// phase offset, derived from its position in the overall sequence.
function buildWord(word: keyof typeof WORDS, count: number, offset: number): Letter[] {
  return Array.from({ length: count }, (_, i) => {
    const n = offset + i
    return {
      file: `/hero-text/letters/${word}-${i}.png`,
      anim: STYLES[(n * 5) % STYLES.length],
      dur: 2.4 + ((n * 7) % 11) / 5,
      delay: ((n * 13) % 21) / 10,
    }
  })
}

let cursor = 0
const LETTERS = Object.fromEntries(
  (Object.keys(WORDS) as (keyof typeof WORDS)[]).map((word) => {
    const letters = buildWord(word, WORDS[word], cursor)
    cursor += WORDS[word]
    return [word, letters]
  })
) as Record<keyof typeof WORDS, Letter[]>

function Word({ letters, height }: { letters: Letter[]; height: string }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: 'clamp(2px, 0.6vw, 5px)' }}>
      {letters.map((l, i) => (
        <img
          key={i}
          src={l.file}
          alt=""
          className={`animate-${l.anim}`}
          style={{
            height,
            width: 'auto',
            animationDuration: `${l.dur}s`,
            animationDelay: `${l.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function HeroCharms() {
  // Sized so the widest line — CUSTOM + CLUB, 10 letters plus the word gap —
  // is what the vw term is tuned against, so nothing overflows on narrow
  // screens. The low px floor lets it shrink freely instead of clamping up.
  const letterSize = 'clamp(24px, 7.6vw, 66px)'

  return (
    <>
      {/* Sibling of the section, not a child — the section clips its overflow,
          and a fixed overlay has no business being inside that. The lettering
          below is simply always there; the shower falls in front of it like a
          curtain rather than cueing it in. */}
      <CharmPour />
      {/* Uneven padding on purpose: with items-center, the heavier bottom
          padding lifts the lettering off the vertical centre of the section so
          it sits higher on screen, clear of the scalloped awning above it and
          of the bottom row of frame charms. */}
      <section
        className="hero-fill relative w-full overflow-hidden flex items-center justify-center pt-10 pb-28 sm:pt-16 sm:pb-40"
        style={{ background: '#FFFFFF' }}
      >
        <HeroFrame />
        <div
          role="img"
          aria-label="Welcome to Custom Club"
          className="relative z-10 mx-auto max-w-3xl px-6 flex flex-col items-center justify-center gap-2 sm:gap-4"
        >
          <Word letters={LETTERS.welcome} height={letterSize} />
          <Word letters={LETTERS.to} height={letterSize} />
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <Word letters={LETTERS.custom} height={letterSize} />
            <Word letters={LETTERS.club} height={letterSize} />
          </div>
        </div>
      </section>
    </>
  )
}
