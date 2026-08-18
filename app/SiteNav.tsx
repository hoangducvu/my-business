import Link from 'next/link'
import MobileNav from './MobileNav'
import ShopDropdown from './ShopDropdown'

/**
 * The storefront awning nav — striped canopy, scalloped edge, and a controls
 * row carrying Shop, the centred badge, and the account/basket icons.
 *
 * Shared by every customer-facing page so the shopfront reads the same
 * wherever you land. Its total height lives in globals.css as --nav-h; anything
 * that has to sit clear of the nav (the hero, sticky sub-bars) reads that
 * variable rather than hard-coding a number.
 */
export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-50">
      {/* Thin striped awning with scalloped bottom edge */}
      <div
        className="relative h-5"
        style={{ background: 'repeating-linear-gradient(90deg, #feffd7 0 56px, #FFEA6D 56px 112px)' }}
      >
        <div
          aria-hidden
          className="absolute left-0 right-0 top-full h-7 pointer-events-none"
          style={{
            backgroundImage: 'url(/scallops.svg)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: '112px 28px',
            backgroundPosition: 'left top',
          }}
        />
      </div>

      {/* Controls row (below the canopy) + centred badge hanging outside it.
          Deliberately has no background of its own: the logo and the three
          icons float over whatever is behind them, so once the nav sticks,
          the section scrolling underneath shows straight through.

          The top padding is what drops the row's contents clear of the
          scallops — with items-center it shifts everything down by half the
          padding, and the extra row height keeps the gap below them unchanged. */}
      <div className="relative w-full px-4 sm:px-8 h-24 sm:h-28 pt-4 sm:pt-5 flex items-center justify-between gap-2 sm:gap-4">

        {/* Left: Shop dropdown (desktop) + hamburger (mobile) — flush to the true left edge */}
        <div className="flex-1 flex items-center justify-start">
          <div className="hidden md:block">
            <ShopDropdown />
          </div>
          <MobileNav />
        </div>

        {/* Right: customer account + shopping basket — flush to the true right edge */}
        <div className="flex-1 flex items-center justify-end gap-6 sm:gap-7">
          {/* Customer account */}
          <a
            href="#account"
            aria-label="Account"
            className="inline-flex items-center"
            style={{ color: '#005CFF', textDecoration: 'none' }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z" />
            </svg>
          </a>
          {/* Shopping basket */}
          <a
            href="/book"
            aria-label="Shopping basket"
            className="inline-flex items-center"
            style={{ color: '#005CFF', textDecoration: 'none' }}
          >
            {/* A SOLID basket with the weave slots cut out of it, not an
                outlined one. At this size an outline basket is five hairlines
                inside a sixth and reads as a scribble; filled, the silhouette
                does the work and the slots are the only detail.

                The slots are knocked THROUGH the body with `evenodd` rather
                than painted in the background colour — the nav is transparent,
                so a painted-in slot would be a cream smear over whatever is
                scrolling underneath. */}
            <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor">
              {/* Handle. The one stroked part: it is a line in the reference
                  too, with the basket's own rim closing it off below. */}
              <path
                d="M7.3 8.4 C7.3 4.5 9.4 2.6 12 2.6 C14.6 2.6 16.7 4.5 16.7 8.4"
                fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"
              />
              {/* Rim */}
              <rect x="2.3" y="8.2" width="19.4" height="3.3" rx="1.65" />
              {/* Body, tapering to a narrower base, with five slots punched
                  through it. The slots sit inside the taper at their widest
                  point — push them further apart and the outer two break the
                  side wall. */}
              <path
                fillRule="evenodd"
                d="M4.2 12.2 L5.8 20.4 C5.95 21.1 6.55 21.6 7.3 21.6 L16.7 21.6
                   C17.45 21.6 18.05 21.1 18.2 20.4 L19.8 12.2 Z
                   M7.4 13.4 A0.95 2.2 0 1 0 7.4 17.8 A0.95 2.2 0 1 0 7.4 13.4 Z
                   M9.7 13.4 A0.95 2.2 0 1 0 9.7 17.8 A0.95 2.2 0 1 0 9.7 13.4 Z
                   M12 13.4  A0.95 2.2 0 1 0 12 17.8  A0.95 2.2 0 1 0 12 13.4 Z
                   M14.3 13.4 A0.95 2.2 0 1 0 14.3 17.8 A0.95 2.2 0 1 0 14.3 13.4 Z
                   M16.6 13.4 A0.95 2.2 0 1 0 16.6 17.8 A0.95 2.2 0 1 0 16.6 13.4 Z"
              />
            </svg>
          </a>
        </div>

        {/* Centred brand badge — blue, sitting fully below the awning */}
        <Link
          href="/"
          aria-label="OddlyCraft home"
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: '48px' }}
        >
          <span
            className="relative inline-flex items-center justify-center h-16 sm:h-[4.5rem]"
            style={{
              aspectRatio: '1.58 / 1',
              background: '#005CFF',
              borderRadius: '50%',
              boxShadow: '0 8px 20px rgba(0,92,255,0.28)',
            }}
          >
            {/* cream ring */}
            <span
              aria-hidden
              className="absolute rounded-[50%]"
              style={{ inset: '7%', border: '2px solid #FEFFD7' }}
            />
            {/* stacked wordmark, recoloured cream */}
            <span
              role="img"
              aria-label="OddlyCraft"
              className="relative block h-[52%]"
              style={{
                width: 'auto', aspectRatio: '527 / 333',
                backgroundColor: '#FEFFD7',
                WebkitMaskImage: 'url(/logo-stacked.png)',
                maskImage: 'url(/logo-stacked.png)',
                WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center', maskPosition: 'center',
                WebkitMaskSize: 'contain', maskSize: 'contain',
              }}
            />
          </span>
        </Link>
      </div>
    </nav>
  )
}
