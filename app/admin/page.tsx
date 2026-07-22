'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Brand palette (matches the rest of the site) ────────────────────────────
const MAROON = '#7B1A38'
const BG     = '#FFF0F4'
const CARD   = '#ffffff'
const SOFT   = '#FDE8EF'
const ACCENT = '#9B3A54'
const BORDER = '#F0D8E0'
const INK    = '#3D0E1E'

interface Charm {
  id: string
  name: string
  category: string
  price: number
  imageUrl: string
  quantity: number
}
interface Order {
  sessionId: string; email: string; metal: string; numLinks: string
  charms: string; totalCents: number; paidAt: string
}

type Tab = 'inventory' | 'categories' | 'orders'

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 32) || 'charm'

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null) // null = checking
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<Tab>('inventory')

  const [charms, setCharms] = useState<Charm[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [msg, setMsg] = useState('')

  // ─── Data loaders ──────────────────────────────────────────────────────────
  const loadInventory = useCallback(async () => {
    const res = await fetch('/api/admin/inventory')
    if (res.status === 401) { setAuthed(false); return false }
    const data = await res.json()
    setCharms((data.charms ?? []).map((c: Charm) => ({ ...c, price: Number(c.price) || 0, quantity: Number(c.quantity) || 0 })))
    setAuthed(true)
    return true
  }, [])

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/admin/categories')
    if (res.ok) setCategories((await res.json()).categories ?? [])
  }, [])

  const loadOrders = useCallback(async () => {
    const res = await fetch('/api/admin/orders')
    if (res.ok) setOrders((await res.json()).orders ?? [])
  }, [])

  useEffect(() => { loadInventory() }, [loadInventory])
  useEffect(() => {
    if (authed) { loadCategories(); loadOrders() }
  }, [authed, loadCategories, loadOrders])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  // ─── Auth ────────────────────────────────────────────────────────────────
  async function login(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setLoginErr('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) { setPassword(''); await loadInventory() }
      else setLoginErr((await res.json().catch(() => ({}))).error ?? 'Login failed.')
    } finally { setBusy(false) }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
  }

  // ─── Inventory actions ─────────────────────────────────────────────────────
  async function saveCharm(c: Charm) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      })
      if (res.ok) { flash(`Saved ${c.name}`); await loadInventory() }
      else flash((await res.json().catch(() => ({}))).error ?? 'Save failed')
    } finally { setBusy(false) }
  }

  async function deleteCharm(id: string, name: string) {
    if (!confirm(`Delete charm "${name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/inventory?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) { flash(`Deleted ${name}`); await loadInventory() }
    } finally { setBusy(false) }
  }

  async function addCategory(name: string) {
    if (!name.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (res.ok) { flash(`Added "${name}"`); await loadCategories() }
    } finally { setBusy(false) }
  }

  async function deleteCategory(name: string) {
    if (!confirm(`Delete category "${name}"?`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/categories?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
      if (res.ok) { flash(`Deleted "${name}"`); await loadCategories() }
    } finally { setBusy(false) }
  }

  // ─── Render: loading ───────────────────────────────────────────────────────
  if (authed === null) {
    return <Centered><p style={{ color: ACCENT }}>Loading…</p></Centered>
  }

  // ─── Render: login ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <Centered>
        <form onSubmit={login} style={{ width: '100%', maxWidth: 380, background: CARD, borderRadius: 20, boxShadow: '0 2px 24px rgba(123,26,56,.12)', overflow: 'hidden' }}>
          <div style={{ background: MAROON, padding: '28px 32px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 34 }}>🔐</p>
            <h1 style={{ margin: '6px 0 0', color: '#fff', fontSize: 22, fontWeight: 900 }}>OddlyCraft Admin</h1>
          </div>
          <div style={{ padding: '28px 32px 32px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Password</label>
            <input
              type="password" value={password} autoFocus
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${BORDER}`, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
            {loginErr && <p style={{ margin: '10px 0 0', color: '#C0392B', fontSize: 13 }}>{loginErr}</p>}
            <button type="submit" disabled={busy || !password}
              style={{ width: '100%', marginTop: 18, padding: '12px', background: busy || !password ? '#E0D0D4' : MAROON, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: busy || !password ? 'not-allowed' : 'pointer' }}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
          </div>
        </form>
      </Centered>
    )
  }

  // ─── Render: dashboard ─────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: BG, padding: '0 0 60px' }}>
      {/* Header */}
      <header style={{ background: MAROON, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 900 }}>🎨 OddlyCraft Admin</h1>
        <button onClick={logout} style={{ padding: '8px 16px', background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Sign out</button>
      </header>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: 4, padding: '16px 24px 0', maxWidth: 1100, margin: '0 auto', flexWrap: 'wrap' }}>
        {(['inventory', 'categories', 'orders'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 18px', background: tab === t ? CARD : 'transparent', color: tab === t ? MAROON : ACCENT, border: 'none', borderRadius: '12px 12px 0 0', fontSize: 14, fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {msg && <div style={{ background: '#DFF5E1', color: '#1E6B2E', padding: '10px 16px', borderRadius: 10, margin: '12px 0', fontSize: 14, fontWeight: 600 }}>{msg}</div>}

        <div style={{ background: CARD, borderRadius: '0 14px 14px 14px', padding: 20, boxShadow: '0 2px 20px rgba(123,26,56,.07)' }}>
          {tab === 'inventory'  && <InventoryTab charms={charms} categories={categories} onSave={saveCharm} onDelete={deleteCharm} busy={busy} />}
          {tab === 'categories' && <CategoriesTab categories={categories} onAdd={addCategory} onDelete={deleteCategory} busy={busy} />}
          {tab === 'orders'     && <OrdersTab orders={orders} onRefresh={loadOrders} />}
        </div>
      </div>
    </main>
  )
}

// ─── Inventory tab ─────────────────────────────────────────────────────────
function InventoryTab({ charms, categories, onSave, onDelete, busy }: {
  charms: Charm[]; categories: string[]; onSave: (c: Charm) => void; onDelete: (id: string, name: string) => void; busy: boolean
}) {
  const [draft, setDraft] = useState<Record<string, Charm>>({})
  const [nw, setNw] = useState({ name: '', category: '', price: '3.50', quantity: '100', imageUrl: '' })

  const edit = (c: Charm, patch: Partial<Charm>) =>
    setDraft((d) => ({ ...d, [c.id]: { ...c, ...d[c.id], ...patch } }))
  const val = (c: Charm): Charm => draft[c.id] ?? c
  const cats = categories.length ? categories : ['Custom']

  return (
    <div>
      <h2 style={{ margin: '0 0 4px', color: INK, fontSize: 18 }}>Charm inventory <span style={{ color: ACCENT, fontWeight: 600, fontSize: 14 }}>({charms.length})</span></h2>
      <p style={{ margin: '0 0 16px', color: ACCENT, fontSize: 13 }}>Edit any field then hit Save on that row.</p>

      {/* Add new */}
      <div style={{ background: SOFT, borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <p style={{ margin: '0 0 10px', fontWeight: 800, color: MAROON, fontSize: 14 }}>➕ Add a charm</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Name" value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} style={inp(150)} />
          <select value={nw.category || cats[0]} onChange={(e) => setNw({ ...nw, category: e.target.value })} style={inp(120)}>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" step="0.50" min="0" placeholder="Price" value={nw.price} onChange={(e) => setNw({ ...nw, price: e.target.value })} style={inp(80)} />
          <input type="number" step="1" min="0" placeholder="Qty" value={nw.quantity} onChange={(e) => setNw({ ...nw, quantity: e.target.value })} style={inp(70)} />
          <input placeholder="Image URL (optional)" value={nw.imageUrl} onChange={(e) => setNw({ ...nw, imageUrl: e.target.value })} style={inp(180)} />
          <button disabled={busy || !nw.name.trim()}
            onClick={() => { onSave({ id: `${slug(nw.name)}${Math.random().toString(36).slice(2, 5)}`, name: nw.name.trim(), category: nw.category || cats[0], price: Number(nw.price) || 0, quantity: parseInt(nw.quantity) || 0, imageUrl: nw.imageUrl.trim() }); setNw({ name: '', category: '', price: '3.50', quantity: '100', imageUrl: '' }) }}
            style={btn(!busy && !!nw.name.trim())}>Add</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: ACCENT }}>
              <Th>Image</Th><Th>Name</Th><Th>Category</Th><Th>Price €</Th><Th>Stock</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {charms.map((c) => {
              const v = val(c)
              return (
                <tr key={c.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#F5EEF1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {v.imageUrl
                          ? <img src={v.imageUrl} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 16, color: '#C9AEB8' }}>🔗</span>}
                      </div>
                      <label style={{ ...btn(!busy), padding: '6px 8px', fontSize: 11, display: 'inline-block', cursor: busy ? 'not-allowed' : 'pointer' }}>
                        {v.imageUrl ? 'Change' : 'Upload'}
                        <input type="file" accept="image/*" disabled={busy} style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (!file) return
                            try { edit(c, { imageUrl: await fileToResizedDataUrl(file) }) }
                            catch { alert('Could not read that image.') }
                          }} />
                      </label>
                      {v.imageUrl && (
                        <button disabled={busy} onClick={() => edit(c, { imageUrl: '' })} title="Remove image"
                          style={{ background: '#fff', color: '#C0392B', border: '1px solid #E8B4B4', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', fontWeight: 800, lineHeight: 1, flexShrink: 0 }}>×</button>
                      )}
                    </div>
                  </td>
                  <td style={td}><input value={v.name} onChange={(e) => edit(c, { name: e.target.value })} style={inp(140)} /></td>
                  <td style={td}>
                    <select value={v.category} onChange={(e) => edit(c, { category: e.target.value })} style={inp(120)}>
                      {[...new Set([v.category, ...cats])].map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </td>
                  <td style={td}><input type="number" step="0.50" min="0" value={v.price} onChange={(e) => edit(c, { price: Number(e.target.value) })} style={inp(75)} /></td>
                  <td style={td}><input type="number" step="1" min="0" value={v.quantity} onChange={(e) => edit(c, { quantity: parseInt(e.target.value) || 0 })} style={inp(65)} /></td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button disabled={busy} onClick={() => onSave(v)} style={btn(!busy, true)}>Save</button>
                    <button disabled={busy} onClick={() => onDelete(c.id, c.name)} style={{ ...btn(!busy), background: '#fff', color: '#C0392B', border: '1px solid #E8B4B4', marginLeft: 6 }}>Del</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Categories tab ────────────────────────────────────────────────────────
function CategoriesTab({ categories, onAdd, onDelete, busy }: {
  categories: string[]; onAdd: (n: string) => void; onDelete: (n: string) => void; busy: boolean
}) {
  const [name, setName] = useState('')
  return (
    <div>
      <h2 style={{ margin: '0 0 16px', color: INK, fontSize: 18 }}>Categories <span style={{ color: ACCENT, fontWeight: 600, fontSize: 14 }}>({categories.length})</span></h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(name); setName('') } }} style={inp(220)} />
        <button disabled={busy || !name.trim()} onClick={() => { onAdd(name); setName('') }} style={btn(!busy && !!name.trim())}>Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {categories.map((c) => (
          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: SOFT, borderRadius: 20, padding: '6px 8px 6px 14px', fontSize: 13, fontWeight: 600, color: INK }}>
            {c}
            <button disabled={busy} onClick={() => onDelete(c)} title="Delete" style={{ background: '#fff', color: '#C0392B', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontWeight: 800, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Orders tab ────────────────────────────────────────────────────────────
function OrdersTab({ orders, onRefresh }: { orders: Order[]; onRefresh: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: INK, fontSize: 18 }}>Charm orders <span style={{ color: ACCENT, fontWeight: 600, fontSize: 14 }}>({orders.length})</span></h2>
        <button onClick={onRefresh} style={{ padding: '6px 14px', background: SOFT, color: MAROON, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 720 }}>
          <thead><tr style={{ textAlign: 'left', color: ACCENT }}><Th>Paid</Th><Th>Email</Th><Th>Metal</Th><Th>Links</Th><Th>Charms</Th><Th>Total</Th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.sessionId} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={td}>{fmt(o.paidAt)}</td>
                <td style={td}>{o.email}</td>
                <td style={td}>{o.metal}</td>
                <td style={td}>{o.numLinks}</td>
                <td style={{ ...td, maxWidth: 280 }}>{o.charms}</td>
                <td style={td}>€{(o.totalCents / 100).toFixed(2)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td style={{ ...td, color: ACCENT }} colSpan={6}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Small helpers ─────────────────────────────────────────────────────────
// Downscale + compress an uploaded image to a small JPEG data URL so it fits in a
// Google Sheets cell (~50k char limit) and loads fast on the storefront.
function fileToResizedDataUrl(file: File, max = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no canvas context'))
        ctx.fillStyle = '#ffffff'          // flatten any transparency to white
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>{children}</main>
}
function Th({ children }: { children?: React.ReactNode }) {
  return <th style={{ padding: '6px 8px', fontWeight: 700, fontSize: 12 }}>{children}</th>
}
const td: React.CSSProperties = { padding: '6px 8px', color: INK, verticalAlign: 'middle' }
const inp = (w: number): React.CSSProperties => ({ width: w, maxWidth: '100%', padding: '8px 10px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' })
const btn = (on: boolean, primary = false): React.CSSProperties => ({ padding: '8px 14px', background: on ? (primary ? MAROON : '#7B1A38') : '#E0D0D4', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: on ? 'pointer' : 'not-allowed' })
function fmt(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
