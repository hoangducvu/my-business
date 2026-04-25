'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) { setStatus('sent');  setMessage(data.message) }
      else        { setStatus('error'); setMessage(data.message ?? 'Something went wrong.') }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '2px solid #F4BFCC', outline: 'none',
    fontSize: '14px', background: 'white', boxSizing: 'border-box',
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FFF0F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ marginBottom: '16px' }}>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#7B1A38', textDecoration: 'none', opacity: 0.8 }}>
            ← Back to login
          </Link>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
          <div style={{ background: '#7B1A38', padding: '28px 32px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '32px' }}>🔑</p>
            <h1 style={{ margin: '8px 0 0', color: '#fff', fontSize: '22px', fontWeight: 900 }}>Forgot password?</h1>
            <p style={{ margin: '6px 0 0', color: '#F4BFCC', fontSize: '13px' }}>We'll email you a reset link</p>
          </div>

          <div style={{ padding: '28px 32px 32px' }}>
            {status === 'sent' ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📬</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#3D0E1E', margin: '0 0 8px' }}>Check your inbox!</p>
                <p style={{ fontSize: '13px', color: '#7B1A38', lineHeight: 1.6, margin: 0 }}>{message}</p>
                <Link href="/login" style={{ display: 'inline-block', marginTop: '20px', fontSize: '13px', fontWeight: 700, color: '#7B1A38', textDecoration: 'none' }}>
                  ← Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
                <p style={{ margin: 0, fontSize: '14px', color: '#7B1A38', lineHeight: 1.6 }}>
                  Enter the email address you signed up with and we'll send you a link to reset your password.
                </p>

                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#7B1A38', marginBottom: '6px' }}>
                    Email address
                  </label>
                  <input
                    id="email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#7B1A38'}
                    onBlur={(e)  => e.target.style.borderColor = '#F4BFCC'}
                  />
                </div>

                {status === 'error' && (
                  <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, color: '#991B1B' }}>
                    {message}
                  </div>
                )}

                <button
                  type="submit" disabled={status === 'loading'}
                  style={{ width: '100%', padding: '14px', background: '#7B1A38', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}
                >
                  {status === 'loading' ? 'Sending…' : 'Send reset link →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
