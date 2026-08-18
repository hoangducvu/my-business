'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

const BLUE = '#005CFF'
/** The page's own cream — the contour around the SHOP lettering. */
const CREAM = '#FFFEEE'

const SHOP_ITEMS: [string, string][] = [
  ['Workshop Ticket', '/book'],
  ['Italian Charm', '/charm-builder'],
  ['Gift Card', '/book'],
  ['FAQs', '#faqs'],
]

// Grace period before a hover-out closes the menu. Without it, the gap between
// the button and the panel counts as leaving, and the menu shuts under the
// pointer on the way down to it.
const CLOSE_DELAY = 140

export default function ShopDropdown() {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY)
  }, [cancelClose])

  useEffect(() => cancelClose, [cancelClose])

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => {
        cancelClose()
        setOpen(true)
      }}
      onMouseLeave={scheduleClose}
      // Keyboard users get the same menu by tabbing into it.
      onFocus={() => {
        cancelClose()
        setOpen(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <button
        type="button"
        // Still toggles on tap — touch devices have no hover to work with.
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'none', border: 'none', cursor: 'pointer',
          // Bubble letters, built in two passes.
          //
          // 1. WEIGHT. Baloo tops out at 800, so the extra fat comes from a
          //    text stroke in the letters' own colour. It is centred on the
          //    outline and eats into the counters as it grows: much past 1.6px
          //    and the P closes up.
          // 2. THE OUTLINE. The reference has a pale contour AROUND each blue
          //    letter, and that is drawn with text-shadow rather than a second
          //    text stroke — a stroke would be centred on the glyph edge and
          //    eat the blue away from the inside, whereas shadows paint behind
          //    the whole glyph, stroke included, so the blue stays full size
          //    and the cream sits outside it. Eight offsets rather than four:
          //    at four the diagonals of the M and the shoulder of the S come
          //    out visibly thinner than the flat sides.
          //
          // The contour also earns its keep on the homepage, where the nav is
          // transparent and this word sits over moving video.
          color: BLUE, fontWeight: 800, fontSize: 42,
          WebkitTextStroke: `1.6px ${BLUE}`,
          textShadow: [
            '3px 0', '-3px 0', '0 3px', '0 -3px',
            '2.1px 2.1px', '2.1px -2.1px', '-2.1px 2.1px', '-2.1px -2.1px',
          ].map((o) => `${o} 0 ${CREAM}`).join(', '),
          padding: '6px 4px',
          fontFamily: 'var(--font-baloo), sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 1,
        }}
      >
        Shop
        <svg
          width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={3}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: '100%', left: 0,
            // Padding, not margin — the strip between button and panel has to
            // stay inside the hover target or the pointer falls through it.
            paddingTop: 8,
            minWidth: 200, zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'white', borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,92,255,.18)',
              border: `2px solid ${BLUE}`, overflow: 'hidden',
            }}
          >
            {SHOP_ITEMS.map(([label, href]) => (
              <a
                key={label}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block', padding: '13px 20px',
                  textDecoration: 'none', color: BLUE,
                  fontFamily: 'var(--font-baloo), sans-serif',
                  fontSize: 17, fontWeight: 700,
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
