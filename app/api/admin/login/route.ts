import { NextResponse } from 'next/server'
import {
  checkPassword,
  createSessionToken,
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Admin password is not configured on the server.' }, { status: 500 })
  }

  let body: { password?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  if (!checkPassword(body.password ?? '')) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    path:     '/',
    maxAge:   ADMIN_COOKIE_MAX_AGE,
  })
  return res
}
