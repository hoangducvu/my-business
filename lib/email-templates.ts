// ─── Shared email templates ───────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  phonecase:    'Phone Case',
  bracelet:     'Italian Charm Bracelet',
  pencilcase:   'Pencil Case',
  locket:       'Locket Heart',
  nightlamp:    'Night Lamp',
  passportcover:'Passport Cover',
  bagcharm:     'Bag Charm',
  beadbracelet: 'Bead Bracelet',
  phonechain:   'Phone Chain',
}

const LOCATION_LABELS: Record<string, string> = {
  plaza:   'The Plaza Sliema — Level 2',
  mercury: 'Mercury Tower — Level B1',
}

export function getActivityLabel(a: string) { return ACTIVITY_LABELS[a] ?? a }
export function getLocationLabel(l: string) { return LOCATION_LABELS[l] ?? l }

// ─── Customer: booking confirmation ─────────────────────────────────────────

export function bookingConfirmEmailHtml(opts: {
  name:      string
  email:     string
  date:      string
  time:      string
  activity:  string
  partySize: number
  location:  string
  paid?:     boolean   // true = paid booking, false = walk-in
}) {
  const { name, email, date, time, activity, partySize, location, paid = false } = opts
  const firstName = name.split(' ')[0] || name
  const actLabel  = getActivityLabel(activity)
  const locLabel  = getLocationLabel(location)

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF0F4;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF0F4;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

  <tr><td style="background:#7B1A38;padding:28px 32px;text-align:center;">
    <p style="margin:0;font-size:28px;">🎨</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">
      ${paid ? 'Booking Confirmed & Paid!' : 'Your spot is reserved!'}
    </h1>
    <p style="margin:6px 0 0;color:#F4BFCC;font-size:13px;">OddlyCraft Malta</p>
  </td></tr>

  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 16px;font-size:16px;color:#3D0E1E;">Hey <strong>${firstName}</strong> 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      ${paid
        ? 'Your payment went through and your spot is confirmed — we can\'t wait to craft with you!'
        : 'Your spot at <strong>OddlyCraft Malta</strong> is confirmed! Just show up at your chosen time and we\'ll have everything ready.'}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDE8EF;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr><td style="padding:6px 0 12px;">
        <span style="font-size:13px;font-weight:700;color:#9B3A54;text-transform:uppercase;letter-spacing:.05em;">Booking Details</span>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">📍 Location</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${locLabel}</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">📅 Date</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${date}</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">🕐 Time</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${time}</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">🎨 Activity</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${actLabel}</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">👥 Party Size</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${partySize} ${partySize === 1 ? 'person' : 'people'}</td>
        </tr></table>
      </td></tr>
    </table>

    <div style="background:#E8F9F2;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1.5px solid #4BAD87;">
      <p style="margin:0;font-size:14px;color:#1A5C3A;font-weight:700;">✅ You're all set!</p>
      <p style="margin:6px 0 0;font-size:13px;color:#2A7B5C;line-height:1.6;">
        Just walk in at your chosen time — your materials will be ready and waiting!
        If anything changes, reply to this email and we'll sort it out ♡
      </p>
    </div>

    <p style="margin:0;font-size:14px;color:#9B3A54;">See you soon ♡<br><strong>The OddlyCraft Team</strong></p>
  </td></tr>

  <tr><td style="background:#FDE8EF;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9B3A54;">Confirmation for: ${email}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Owner: booking notification ─────────────────────────────────────────────

export function ownerBookingNotifHtml(opts: {
  name:      string
  email:     string
  phone?:    string
  date:      string
  time:      string
  activity:  string
  partySize: number
  location:  string
  paid?:     boolean
}) {
  const { name, email, phone, date, time, activity, partySize, location, paid = false } = opts
  const actLabel = getActivityLabel(activity)
  const locLabel = getLocationLabel(location)

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">

  <tr><td style="background:${paid ? '#1A5C3A' : '#7B1A38'};padding:20px 28px;">
    <h1 style="margin:0;color:#fff;font-size:18px;font-weight:900;">
      ${paid ? '💳 New Paid Booking' : '📋 New Booking Request'}
    </h1>
    <p style="margin:4px 0 0;color:${paid ? '#A7DFC4' : '#F4BFCC'};font-size:13px;">OddlyCraft Malta — Staff Alert</p>
  </td></tr>

  <tr><td style="padding:24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
      <tr style="background:#f9f9f9;">
        <td colspan="2" style="padding:10px 16px;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.05em;">Customer</td>
      </tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;width:130px;">Name</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;font-weight:600;">${name}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Email</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;"><a href="mailto:${email}" style="color:#7B1A38;">${email}</a></td></tr>
      ${phone ? `<tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Phone</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;">${phone}</td></tr>` : ''}

      <tr style="background:#f9f9f9;">
        <td colspan="2" style="padding:10px 16px;border-top:2px solid #e5e5e5;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.05em;">Booking</td>
      </tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Location</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;font-weight:600;">${locLabel}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Date</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;font-weight:600;">${date}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Time</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;font-weight:600;">${time}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Activity</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;font-weight:600;">${actLabel}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Party Size</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;font-weight:600;">${partySize} ${partySize === 1 ? 'person' : 'people'}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Status</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;">
            <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;
              background:${paid ? '#E8F9F2' : '#FDE8EF'};color:${paid ? '#1A5C3A' : '#7B1A38'};">
              ${paid ? '✅ PAID' : '⏳ PENDING CONFIRMATION'}
            </span>
          </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Customer: charm order invoice ──────────────────────────────────────────

export function charmOrderInvoiceEmailHtml(opts: {
  email:       string
  metal:       string
  numLinks:    number
  charms:      string   // summary string e.g. "Butterfly ×2, Star"
  totalCents:  number
  paidAt:      string
}) {
  const { email, metal, numLinks, charms, totalCents, paidAt } = opts
  const total   = (totalCents / 100).toFixed(2)
  const paidDate = new Date(paidAt).toLocaleString('en-MT', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Malta',
  })
  const metalLabel: Record<string, string> = { silver: 'Silver', gold: 'Gold (+€6)', bronze: 'Bronze (+€3)' }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF0F4;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF0F4;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

  <tr><td style="background:#7B1A38;padding:28px 32px;text-align:center;">
    <p style="margin:0;font-size:28px;">🔗</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">Your Charm Bracelet Order!</h1>
    <p style="margin:6px 0 0;color:#F4BFCC;font-size:13px;">OddlyCraft Malta — Order Confirmation</p>
  </td></tr>

  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 16px;font-size:16px;color:#3D0E1E;">Hey there 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      Your Italian Charm Bracelet order is confirmed and paid! We'll have it ready for you. Here's your receipt:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDE8EF;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr><td style="padding:6px 0 12px;">
        <span style="font-size:13px;font-weight:700;color:#9B3A54;text-transform:uppercase;letter-spacing:.05em;">Order Details</span>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">✨ Metal</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${metalLabel[metal] ?? metal}</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;">🔗 Links</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${numLinks} links</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:8px 0;border-top:1px solid #F4BFCC;">
        <table width="100%"><tr>
          <td style="font-size:14px;color:#7B1A38;font-weight:700;vertical-align:top;">💎 Charms</td>
          <td style="font-size:14px;color:#3D0E1E;text-align:right;">${charms}</td>
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
          <td style="font-size:20px;color:#7B1A38;font-weight:900;text-align:right;">€${total}</td>
        </tr></table>
      </td></tr>
    </table>

    <div style="background:#E8F9F2;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1.5px solid #4BAD87;">
      <p style="margin:0;font-size:14px;color:#1A5C3A;font-weight:700;">✅ What's next?</p>
      <p style="margin:6px 0 0;font-size:13px;color:#2A7B5C;line-height:1.6;">
        We'll start crafting your bracelet! If you have any special requests or questions, just reply to this email ♡
      </p>
    </div>

    <p style="margin:0;font-size:14px;color:#9B3A54;">Thank you ♡<br><strong>The OddlyCraft Team</strong></p>
  </td></tr>

  <tr><td style="background:#FDE8EF;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9B3A54;">Receipt for: ${email}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Owner: charm order notification ────────────────────────────────────────

export function ownerCharmNotifHtml(opts: {
  email:      string
  metal:      string
  numLinks:   number
  charms:     string
  totalCents: number
  paidAt:     string
}) {
  const { email, metal, numLinks, charms, totalCents, paidAt } = opts
  const total   = (totalCents / 100).toFixed(2)
  const paidDate = new Date(paidAt).toLocaleString('en-MT', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Malta',
  })
  const metalLabel: Record<string, string> = { silver: 'Silver', gold: 'Gold (+€6)', bronze: 'Bronze (+€3)' }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">

  <tr><td style="background:#1A5C3A;padding:20px 28px;">
    <h1 style="margin:0;color:#fff;font-size:18px;font-weight:900;">💳 New Charm Bracelet Order</h1>
    <p style="margin:4px 0 0;color:#A7DFC4;font-size:13px;">OddlyCraft Malta — Staff Alert · €${total} paid</p>
  </td></tr>

  <tr><td style="padding:24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
      <tr style="background:#f9f9f9;">
        <td colspan="2" style="padding:10px 16px;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.05em;">Customer</td>
      </tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;width:130px;">Email</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;"><a href="mailto:${email}" style="color:#7B1A38;">${email}</a></td></tr>

      <tr style="background:#f9f9f9;">
        <td colspan="2" style="padding:10px 16px;border-top:2px solid #e5e5e5;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.05em;">Order</td>
      </tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Metal</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;font-weight:600;">${metalLabel[metal] ?? metal}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Links</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;font-weight:600;">${numLinks}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;vertical-align:top;">Charms</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;font-weight:600;">${charms}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Paid at</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#111;">${paidDate}</td></tr>
      <tr><td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:14px;color:#666;">Total</td>
          <td style="padding:10px 16px;border-top:1px solid #e5e5e5;font-size:16px;color:#1A5C3A;font-weight:900;">€${total}</td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
