export function invoiceEmailHtml(opts: {
  name:        string
  email:       string
  invoiceId:   string
  description: string
  amountCents: number
  currency:    string
  paidAt:      string
}) {
  const { name, email, invoiceId, description, amountCents, currency, paidAt } = opts
  const firstName  = name.split(' ')[0] || name
  const amount     = (amountCents / 100).toFixed(2)
  const symbol     = currency.toUpperCase() === 'EUR' ? '€' : currency.toUpperCase()
  const paidDate   = new Date(paidAt).toLocaleString('en-MT', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Malta',
  })
  const invoiceRef = `INV-${invoiceId.slice(0, 8).toUpperCase()}`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF0F4;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF0F4;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

  <!-- Header -->
  <tr><td style="background:#7B1A38;padding:28px 32px;text-align:center;">
    <p style="margin:0;font-size:28px;">🎉</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">Payment Confirmed!</h1>
    <p style="margin:6px 0 0;color:#F4BFCC;font-size:13px;">${invoiceRef}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 16px;font-size:16px;color:#3D0E1E;">Hey <strong>${firstName}</strong> 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      Your payment to <strong>OddlyCraft Malta</strong> was successful. Your spot is locked in — we can't wait to see you! Here's your receipt:
    </p>

    <!-- Invoice box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDE8EF;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr><td style="padding:6px 0 12px;">
        <span style="font-size:13px;font-weight:700;color:#9B3A54;text-transform:uppercase;letter-spacing:.05em;">Invoice Details</span>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">📋 Reference</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;font-family:monospace;">${invoiceRef}</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">🎨 Session</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${description}</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">🕐 Paid at</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${paidDate}</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:16px;color:#7B1A38;font-weight:900;">💳 Total Paid</td>
          <td style="font-size:20px;color:#7B1A38;font-weight:900;text-align:right;">${symbol}${amount}</td>
        </tr></table>
      </td></tr>
    </table>

    <div style="background:#E8F9F2;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1.5px solid #4BAD87;">
      <p style="margin:0;font-size:14px;color:#1A5C3A;font-weight:700;">✅ What happens next?</p>
      <p style="margin:6px 0 0;font-size:13px;color:#2A7B5C;line-height:1.6;">
        Just walk in at your chosen time — your materials will be ready! If anything changes, reply to this email and we'll sort it out ♡
      </p>
    </div>

    <p style="margin:0;font-size:14px;color:#9B3A54;">See you soon ♡<br><strong>The OddlyCraft Team</strong></p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#FDE8EF;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9B3A54;">Receipt for: ${email}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
