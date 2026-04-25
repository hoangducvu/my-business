import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { findUserByResetToken, resetUserPassword } from '@/lib/sheets-users'

const SALT_ROUNDS = 12

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 }) }

  const token    = body.token?.toString().trim()    ?? ''
  const password = body.password?.toString()        ?? ''

  if (!token)               return NextResponse.json({ message: 'Reset token is missing.'                  }, { status: 400 })
  if (password.length < 8)  return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 })

  // Find user by token
  const found = await findUserByResetToken(token).catch(() => null)
  if (!found) {
    return NextResponse.json({ message: 'This reset link is invalid or has already been used.' }, { status: 400 })
  }

  const { user, rowNum } = found

  // Check expiry
  const expires = new Date(user.reset_token_expires)
  if (isNaN(expires.getTime()) || expires < new Date()) {
    return NextResponse.json({ message: 'This reset link has expired. Please request a new one.' }, { status: 400 })
  }

  // Hash new password and update sheet
  const newPasswordHash = await bcrypt.hash(password, SALT_ROUNDS)
  await resetUserPassword(rowNum, newPasswordHash)

  return NextResponse.json({ success: true, message: 'Password updated! You can now sign in.' })
}
