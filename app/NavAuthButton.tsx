'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

export default function NavAuthButton() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)

  if (status === 'loading') return null

  if (!session) {
    return (
      <Link
        href="/login"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 18px', borderRadius: '9999px',
          border: '2px solid #7B1A38', color: '#7B1A38',
          fontWeight: 900, fontSize: '13px', textDecoration: 'none',
          background: 'white', whiteSpace: 'nowrap',
          transition: 'all .15s',
        }}
      >
        🔑 Log In
      </Link>
    )
  }

  const firstName = session.user?.name?.split(' ')[0] ?? session.user?.email ?? 'Me'

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', borderRadius: '9999px',
          background: '#7B1A38', color: 'white',
          fontWeight: 900, fontSize: '13px', border: 'none',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '16px' }}>👤</span>
        {firstName}
        <span style={{ fontSize: '10px', opacity: 0.8 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'white', borderRadius: '16px', minWidth: '180px',
            boxShadow: '0 8px 32px rgba(123,26,56,.18)',
            border: '2px solid #F4BFCC', zIndex: 50, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F4BFCC' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#3D0E1E' }}>{session.user?.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9B3A54' }}>{session.user?.email}</p>
            </div>
            <Link href="/portal" onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px', textDecoration: 'none',
              fontSize: '14px', fontWeight: 700, color: '#3D0E1E',
            }}>
              🎨 My Portal
            </Link>
            <button
              type="button"
              onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#9B3A54',
                borderTop: '1px solid #F4BFCC',
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
