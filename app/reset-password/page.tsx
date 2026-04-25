'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message,   setMessage]   = useState('')

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <p style={{ fontSize: '36px', margin: '0 0 12px' }}>⚠️</p>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#3D0E1E', margin: '0 0 8px' }}>Invalid link</p>
        <p style={{ fontSize: '13px', color: '#7B1A38', margin: '0 0 20px' }}>This reset link is missing a token.</p>
        <Link href="/forgot-password" style={{ fontSize: '14px', fontWeight: 700, color: '#7B1A38', textDecoration: 'none' }}>
          Request a new link →
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setStatus('error')
      setMessage('Passwords do not match.')
      return
    }
    setStatus('loading')
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
        setTimeout(() => router.push('/login'), 2500)
      } else {
        setStatus('error')
        setMessage(data.message ?? 'Something went wrong.')
      }
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

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <p style={{ fontSize: '40px', margin: '0 0 12px' }}>✅</p>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#3D0E1E', margin: '0 0 8px' }}>{message}</p>
        <p style={{ fontSize: '13px', color: '#7B1A38', margin: 0 }}>Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
      <div>
        <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#7B1A38', marginBottom: '6px' }}>
          New password
        </label>
        <input
          id="password" type="password" required minLength={8} autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = '#7B1A38'}
          onBlur={(e)  => e.target.style.borderColor = '#F4BFCC'}
        />
      </div>

      <div>
        <label htmlFor="confirm" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#7B1A38', marginBottom: '6px' }}>
          Confirm password
        </label>
        <input
          id="confirm" type="password" required minLength={8} autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          placeholder="Same password again"
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
        {status === 'loading' ? 'Updating…' : 'Set new password →'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
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
            <p style={{ margin: 0, fontSize: '32px' }}>🔐</p>
            <h1 style={{ margin: '8px 0 0', color: '#fff', fontSize: '22px', fontWeight: 900 }}>Set new password</h1>
            <p style={{ margin: '6px 0 0', color: '#F4BFCC', fontSize: '13px' }}>OddlyCraft Malta</p>
          </div>
          <div style={{ padding: '28px 32px 32px' }}>
            <Suspense>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
