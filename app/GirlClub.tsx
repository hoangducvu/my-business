import { SOCIAL_POSTS } from './social'

/**
 * "Join Our Girl Club" — a wall of the shop's social posts sliding right to
 * left, forever.
 *
 * Laid out as a contact sheet rather than a wall: square crops with a sliver of
 * cream between them, near-square corners, and no frame or ring at rest. The
 * only chrome is a play glyph, which is what says these are videos.
 *
 * ── Why three copies ─────────────────────────────────────────────────────
 * A marquee only looks endless while there is still strip to the right of the
 * screen at the moment it wraps. The strip is COPIES copies long and travels
 * exactly one copy's width, so what is left standing at the wrap is
 * (COPIES - 1) copies — that, not one copy, is the number that has to clear the
 * viewport. Seven posts at their capped size is ~2000px a copy, so three copies
 * hold the illusion out past 4000px of screen. Change COPIES and the
 * `club-roll` keyframe in globals.css has to change with it.
 *
 * The gap between cards is a margin on the card and not flex `gap` — the
 * reason is in `.club__rail` in globals.css, and swapping it back to `gap`
 * puts a visible twitch in the loop.
 *
 * Cards are thumbnails linking back to the real post rather than embedded
 * players. Eight autoplaying videos in a moving strip would be a lot of
 * bandwidth for something nobody can watch while it slides past, and the click
 * is worth more to the shop on TikTok than it is here.
 *
 * ── On customer posts ────────────────────────────────────────────────────
 * This rail carries OddlyCraft's own posts only. Reposting a customer's photo
 * or video on a commercial site is theirs to allow, not ours to assume, so
 * nothing of anyone else's goes in until they've said yes. Once they have,
 * a customer post is just another row in app/social.ts.
 */

const COPIES = 3
const TIKTOK = 'https://www.tiktok.com/@oddlycraft.mt'

export default function GirlClub() {
  // Repeated for the seamless loop; keys have to stay unique across the copies.
  const strip = Array.from({ length: COPIES }, () => SOCIAL_POSTS).flat()

  return (
    <section id="girl-club" className="club" aria-labelledby="club-heading">
      {/* Same checked strip that closes the workshop section */}
      <hr className="rule-check" />

      <div className="club__inner">
        <p className="club__eyebrow">Join our girl club</p>
        <h2 id="club-heading" className="club__handle">
          <a href={TIKTOK} target="_blank" rel="noopener noreferrer">@oddlycraft.mt</a>
        </h2>
      </div>

      {/* Pauses on hover, otherwise a card would slide out from under the
          cursor between deciding to click it and clicking it. */}
      <div className="club__rail">
        <div className="club__strip">
          {strip.map((post, i) => (
            <a
              key={`${post.id}-${i}`}
              className="club__card"
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              // The later copies are the same content again, so they are
              // duplicate noise to a screen reader working through the list.
              aria-hidden={i >= SOCIAL_POSTS.length}
              tabIndex={i >= SOCIAL_POSTS.length ? -1 : undefined}
            >
              <img
                src={post.src}
                alt={post.caption}
                className="club__img"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              <span className="club__play" aria-hidden>
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M9 6.5 L18 12 L9 17.5 Z" fill="currentColor" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
