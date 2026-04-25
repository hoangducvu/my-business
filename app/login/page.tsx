'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') ?? '/portal'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', { email, password, redirect: false, callbackUrl })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password.')
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '2px solid var(--rose)', outline: 'none',
    fontSize: '14px', background: 'white', color: 'var(--foreground)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ marginBottom: '16px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--maroon)', textDecoration: 'none', opacity: 0.8 }}>
            &larr; Back to homepage
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>&#127912;</div>
          <h1 style={{ fontFamily: 'var(--font-baloo), sans-serif', fontSize: '28px', fontWeight: 900, color: 'var(--maroon)', margin: 0 }}>
            OddlyCraft
          </h1>
          <p style={{ color: 'var(--maroon-mid)', fontSize: '14px', marginTop: '4px', fontWeight: 600 }}>
            Sign in to your account
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>

            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--maroon)', marginBottom: '6px' }}>
                Email
              </label>
              <input
                id="email" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--maroon)'}
                onBlur={(e)  => e.target.style.borderColor = 'var(--rose)'}
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--maroon)', marginBottom: '6px' }}>
                Password
              </label>
              <input
                id="password" type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--maroon)'}
                onBlur={(e)  => e.target.style.borderColor = 'var(--rose)'}
              />
            </div>

            {error && (
              <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, color: '#991B1B' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', background: 'var(--maroon)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: '4px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
            <Link href="/forgot-password" style={{ color: 'var(--maroon-mid)', fontWeight: 600, textDecoration: 'none' }}>
              Forgot your password?
            </Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: 'var(--maroon-mid)' }}>
            {"Don't have an account? "}
            <Link href="/signup" style={{ color: 'var(--maroon)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
