import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { isAdminAuthed } from '@/lib/admin-auth'
import { getCharmCatalog } from '@/lib/sheets-inventory'

interface OrderItem { id: string; name: string; qty: number; imageUrl: string }
interface OrderFace { id: string; name: string; imageUrl: string }
type Catalog = Map<string, { name: string; imageUrl: string }>

// Turn a "id:qty,id:qty" metadata string into resolved charm items (name + image)
// so the owner can see, in pictures, exactly which charms to put on the bracelet.
function parseItems(charmQty: string, catalog: Catalog): OrderItem[] {
  if (!charmQty.trim()) return []
  return charmQty.split(',').flatMap((pair) => {
    const [id, q] = pair.split(':')
    const cid = (id ?? '').trim()
    const qty = parseInt(q ?? '0', 10)
    if (!cid || !(qty > 0)) return []
    const hit = catalog.get(cid)
    return [{ id: cid, name: hit?.name ?? cid, qty, imageUrl: hit?.imageUrl ?? '' }]
  })
}

// Turn the ordered "id|id||id" layout (one entry per link, '' = plain link) into
// the assembled bracelet the customer built, so the owner can replicate it.
function parseLayout(raw: string, catalog: Catalog): (OrderFace | null)[] {
  if (!raw.trim()) return []
  return raw.split('|').map((id) => {
    const cid = id.trim()
    if (!cid) return null
    const hit = catalog.get(cid)
    return { id: cid, name: hit?.name ?? cid, imageUrl: hit?.imageUrl ?? '' }
  })
}

function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  return google.sheets({ version: 'v4', auth })
}

// GET /api/admin/orders — recent charm-bracelet orders (newest first)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
  try {
    const sheets = getSheets()
    const res = await sheets.spreadsheets.values
      .get({ spreadsheetId, range: 'CharmOrders!A2:I' })
      .catch(() => null)

    // Build an id → { name, image } lookup so each order can show charm pictures.
    const catalog: Catalog = new Map()
    try {
      for (const c of await getCharmCatalog()) catalog.set(c.id, { name: c.name, imageUrl: c.imageUrl })
    } catch (err) {
      console.warn('[/api/admin/orders] catalog lookup failed (images unavailable):', err)
    }

    // CharmOrders: A session_id, B email, C metal, D num_links, E charms, F total_cents, G paid_at, H charm_qty, I layout
    const orders = (res?.data.values ?? []).map((r) => ({
      sessionId:  r[0] ?? '',
      email:      r[1] ?? '',
      metal:      r[2] ?? '',
      numLinks:   r[3] ?? '',
      charms:     r[4] ?? '',
      totalCents: parseInt(r[5] ?? '0', 10) || 0,
      paidAt:     r[6] ?? '',
      items:      parseItems(r[7]?.toString() ?? '', catalog),
      layout:     parseLayout(r[8]?.toString() ?? '', catalog),
    })).reverse()

    return NextResponse.json({ orders: orders.slice(0, 200) })
  } catch (err) {
    console.error('[/api/admin/orders] read error:', err)
    return NextResponse.json({ error: 'Could not read orders.' }, { status: 502 })
  }
}
