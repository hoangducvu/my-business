import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { findUserByEmail, createUser } from '@/lib/sheets-users'

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SALT_ROUNDS = 12

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 }) }

  const email    = body.email?.toString().trim()    ?? ''
  const password = body.password?.toString()        ?? ''
  const name     = body.name?.toString().trim()     ?? ''
  const phone    = body.phone?.toString().trim()    ?? ''

  if (!name)                   return NextResponse.json({ message: 'Name is required.'                        }, { status: 400 })
  if (!email)                  return NextResponse.json({ message: 'Email is required.'                       }, { status: 400 })
  if (!EMAIL_RE.test(email))   return NextResponse.json({ message: 'Please enter a valid email address.'      }, { status: 400 })
  if (password.length < 8)     return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 })

  const existing = await findUserByEmail(email)
  if (existing) return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 })

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
  await createUser({ id: crypto.randomUUID(), email, password_hash, name, phone, role: 'client', created_at: new Date().toISOString() })

  return NextResponse.json({ success: true, message: 'Account created! You can now log in.' })
}
