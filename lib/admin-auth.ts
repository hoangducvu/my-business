import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

// ─── Simple password-based admin session ─────────────────────────────────────
// The admin password lives in ADMIN_PASSWORD (.env.local + Netlify). On login we
// hand out an HMAC-signed, time-limited cookie signed with NEXTAUTH_SECRET, so
// the password itself is never stored client-side.

export const ADMIN_COOKIE = 'oc_admin'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (seconds)

function signingKey(): string {
  // Derive the cookie-signing key from the admin password. Changing the password
  // therefore invalidates existing sessions, which is the behaviour we want.
  return process.env.ADMIN_PASSWORD || ''
}

function sign(value: string): string {
  return createHmac('sha256', signingKey()).update(value).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** Constant-time check of a submitted password against ADMIN_PASSWORD. */
export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || !input) return false
  return safeEqual(input, pw)
}

/** Build a signed `${expiryMs}.${hmac}` session token. */
export function createSessionToken(): string {
  const exp = String(Date.now() + ADMIN_COOKIE_MAX_AGE * 1000)
  return `${exp}.${sign(exp)}`
}

/** Verify a session token's signature and expiry. */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const exp = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!exp || !sig) return false
  if (!safeEqual(sig, sign(exp))) return false
  return Number(exp) > Date.now()
}

/** Read the admin cookie from the incoming request and validate it. */
export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value)
}
