import Link from 'next/link'
import { StarIcon } from './ButtonIcons'

/**
 * Homepage promo for /charm-builder — the online bracelet designer.
 *
 * Wordless on purpose: an empty bracelet running the full width of the screen,
 * and one button. The heading, the standfirst and the three facts have all
 * been taken out, so the bracelet is doing the explaining and the button is
 * the only thing to read. Anything added back here competes with the strand.
 */

// Enough links to run past the right-hand edge of a very wide monitor at the
// largest link size (46 x 56px ≈ 2576px); the strip clips whatever spills.
const LINK_COUNT = 46

export default function BuildYourBracelet() {
  return (
    <section id="build" className="build" aria-label="Build your bracelet">
      {/* An empty bracelet running the width of the screen — the same square
          silver links the charm builder starts you with, before anything is on
          it. Deliberately bare: the section is an invitation to fill it.

          Decorative, so it is hidden from assistive tech entirely. */}
      <div className="build__strand" aria-hidden>
        <div className="build__tray">
          {Array.from({ length: LINK_COUNT }, (_, i) => (
            <span key={i} className="build__link" />
          ))}
        </div>
      </div>

      <Link href="/charm-builder" className="btn">
        Let&apos;s build
        <StarIcon />
      </Link>
    </section>
  )
}
