import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { findUserByEmail, setUserResetToken } from '@/lib/sheets-users'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Missing RESEND_API_KEY env var')
  return new Resend(key)
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 }) }

  const email = body.email?.toString().trim() ?? ''
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 })
  }

  // Always return success — don't reveal if the email exists
  const user = await findUserByEmail(email).catch(() => null)

  if (user) {
    const token     = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    await setUserResetToken(email, token, expiresAt).catch((err) => {
      console.error('[forgot-password] setUserResetToken failed:', err)
    })

    const origin   = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const resetUrl = `${origin}/reset-password?token=${token}`
    const firstName = user.name.split(' ')[0] || user.name

    await getResend().emails.send({
      from:    process.env.RESEND_FROM!,
      to:      email,
      subject: '🔑 Reset your OddlyCraft password',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF0F4;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF0F4;padding:32px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
  <tr><td style="background:#7B1A38;padding:28px 32px;text-align:center;">
    <p style="margin:0;font-size:28px;">🔑</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">Reset your password</h1>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 16px;font-size:16px;color:#3D0E1E;">Hey <strong>${firstName}</strong> 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      We received a request to reset your OddlyCraft password. Click the button below — this link expires in <strong>1 hour</strong>.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${resetUrl}"
        style="display:inline-block;padding:14px 32px;background:#7B1A38;color:#fff;font-size:16px;font-weight:900;border-radius:14px;text-decoration:none;">
        Reset Password →
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#9B3A54;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    <p style="margin:0;font-size:13px;color:#9B3A54;">♡ The OddlyCraft Team</p>
  </td></tr>
  <tr><td style="background:#FDE8EF;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9B3A54;">Request for: ${email}</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
    }).catch((err) => console.error('[forgot-password] Email send failed:', err))
  }

  return NextResponse.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' })
}
