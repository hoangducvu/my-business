'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Signup failed.')
        return
      }
      router.push('/login?registered=1')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #F4BFCC', fontSize: 15, outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FFF0F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ marginBottom: '16px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#7B1A38', textDecoration: 'none', opacity: 0.8 }}>
            &larr; Back to homepage
          </Link>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 24px rgba(123,26,56,.10)', overflow: 'hidden' }}>

          <div style={{ background: '#7B1A38', padding: '32px 32px 24px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 32 }}>&#10024;</p>
            <h1 style={{ margin: '8px 0 0', color: '#fff', fontSize: 22, fontWeight: 900, fontFamily: 'system-ui,sans-serif' }}>
              Create your account
            </h1>
            <p style={{ margin: '8px 0 0', color: '#F4BFCC', fontSize: 14 }}>OddlyCraft Malta</p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
            {error && (
              <div style={{ background: '#FDE8EF', border: '1px solid #F4BFCC', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#7B1A38', fontSize: 14 }}>
                {error}
              </div>
            )}

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#7B1A38', marginBottom: 6 }}>Full Name *</span>
              <input
                type="text" required autoComplete="name"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle} placeholder="Your name"
              />
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#7B1A38', marginBottom: 6 }}>Email *</span>
              <input
                type="email" required autoComplete="email"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle} placeholder="you@example.com"
              />
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#7B1A38', marginBottom: 6 }}>
                Phone <span style={{ fontWeight: 400, color: '#9B3A54' }}>(optional)</span>
              </span>
              <input
                type="tel" autoComplete="tel"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={inputStyle} placeholder="+356 ..."
              />
            </label>

            <label style={{ display: 'block', marginBottom: 24 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#7B1A38', marginBottom: 6 }}>Password *</span>
              <input
                type="password" required minLength={8} autoComplete="new-password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={inputStyle} placeholder="At least 8 characters"
              />
            </label>

            <button
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', background: loading ? '#9B3A54' : '#7B1A38', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#555' }}>
              {'Already have an account? '}
              <Link href="/login" style={{ color: '#7B1A38', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
