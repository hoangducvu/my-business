'use client'
import { useState } from 'react'

const BLUE = '#005CFF'

const SHOP_ITEMS: [string, string][] = [
  ['Workshop Ticket', '#book'],
  ['Italian Charm', '/charm-builder'],
  ['Gift Card', '#book'],
  ['FAQs', '#faqs'],
]

export default function ShopDropdown() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer',
          color: BLUE, fontWeight: 500, fontSize: 16,
          padding: '6px 4px', fontFamily: 'inherit',
        }}
      >
        Shop
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2.5}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0,
              background: 'white', borderRadius: 16, minWidth: 200,
              boxShadow: '0 8px 32px rgba(0,92,255,.18)',
              border: `2px solid ${BLUE}`, zIndex: 50, overflow: 'hidden',
            }}
          >
            {SHOP_ITEMS.map(([label, href]) => (
              <a
                key={label}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block', padding: '12px 18px',
                  textDecoration: 'none', color: BLUE,
                  fontSize: 15, fontWeight: 500,
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
