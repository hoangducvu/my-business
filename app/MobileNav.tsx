'use client'
import { useState } from 'react'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        className="md:hidden flex items-center justify-center"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#7B1A38', padding: 6, borderRadius: 8,
        }}
      >
        {open ? (
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 md:hidden"
          style={{ zIndex: 40, background: 'rgba(61,14,30,0.25)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      {open && (
        <div
          className="fixed left-0 right-0 md:hidden"
          style={{
            top: 56, zIndex: 50,
            background: '#F9C5D0',
            borderBottom: '2px solid #E8829A',
            boxShadow: '0 8px 24px rgba(123,26,56,0.15)',
            padding: '10px 16px 16px',
          }}
        >
          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['#workshops', '🎨 What We Make'],
              ['#faqs', '❓ FAQs'],
              ['/charm-builder', '🔗 Charm Builder'],
              ['#locations', '📍 Find Us'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '11px 16px',
                  borderRadius: 12,
                  color: '#7B1A38',
                  fontWeight: 900,
                  fontSize: 15,
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.55)',
                }}
              >
                {label}
              </a>
            ))}
            <a
              href="#book"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '13px 16px',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 900,
                fontSize: 15,
                textDecoration: 'none',
                background: '#7B1A38',
                textAlign: 'center',
                marginTop: 4,
                boxShadow: '0 2px 8px rgba(123,26,56,0.3)',
              }}
            >
              📅 Book a Session
            </a>
          </div>

          {/* Social icons */}
          <div style={{ display: 'flex', gap: 12, padding: '12px 16px 0' }}>
            <a
              href="https://instagram.com/oddlycraft"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#7B1A38', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @oddlycraft
            </a>
            <a
              href="https://www.tiktok.com/@oddlycraft.mt"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#7B1A38', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
              </svg>
              TikTok
            </a>
          </div>
        </div>
      )}
    </>
  )
}
