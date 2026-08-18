'use client'
import { useEffect, useRef } from 'react'

/**
 * Full-bleed video hero: one clip filling the screen, with a tagline blob in
 * the lower corner.
 *
 * The clip is decorative, not content — muted, no controls, and carrying
 * nothing that isn't also in the heading, so it's hidden from assistive tech
 * rather than described.
 *
 * The clip is OddlyCraft's own shop footage, pulled from the shop's TikTok.
 * Stock was tried and abandoned: free libraries have no Italian charm bracelet
 * footage at all — searches return beaded and string bracelets, which are a
 * different product — and on a shop site the wrong product is worse than a soft
 * picture. Any replacement must be OddlyCraft's own or comparably licensed;
 * this is a commercial storefront, so a clip taken from the open web is not an
 * option.
 *
 * It is phone footage (576x1024), and it is cropped to fill rather than shown
 * whole: on a landscape screen that means a wide crop out of the middle of the
 * frame and a ~3x upscale, so keep the subject centred when reshooting. A
 * landscape export of the same clip would remove the upscale entirely.
 */
const CLIP = '/hero-shop.mp4'

export default function HeroVideo() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // A clip looping forever is exactly the motion this setting asks us to
    // stop, so anyone who has set it gets a held frame instead.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    rootRef.current?.querySelectorAll('video').forEach((v) => v.pause())
  }, [])

  return (
    <section className="hero-video" ref={rootRef}>
      {/* The heading still has to exist for search engines and screen readers
          even though the hero is now purely visual. */}
      <h1 className="sr-only">OddlyCraft Malta — customise your own charms, cases and more</h1>

      <video
        className="hero-video__feature"
        autoPlay muted loop playsInline preload="auto" aria-hidden tabIndex={-1}
      >
        <source src={CLIP} type="video/mp4" />
      </video>

      <p className="hero-video__tagline">
        Souvenir shopping,<br />but make it niche.
      </p>
    </section>
  )
}
