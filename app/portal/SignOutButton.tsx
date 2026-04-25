'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      style={{ width: '100%', padding: '12px', background: 'transparent', color: '#7B1A38', border: '2px solid #7B1A38', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
    >
      Sign out
    </button>
  )
}
