'use client'

import { useEffect, useState, useCallback } from 'react'
import { getActivityLabel, getLocationLabel } from '@/lib/labels'
import { DEFAULT_CHARMS } from '@/app/charm-builder/charms'

// Switches table layouts to stacked cards on phones so nothing needs sideways scrolling.
function useIsMobile(bp = 768) {
  const [m, setM] = useState(false)
  useEffect(() => {
    const check = () => setM(window.innerWidth < bp)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [bp])
  return m
}

// emoji/bg fallback for charms with no uploaded image (built-in charms only)
const CHARM_FACE = Object.fromEntries(DEFAULT_CHARMS.map((c) => [c.id, { emoji: c.emoji, bg: c.bg }]))

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
interface OrderItem { id: string; name: string; qty: number; imageUrl: string }
interface OrderFace { id: string; name: string; imageUrl: string }
interface Order {
  sessionId: string; email: string; metal: string; numLinks: string
  charms: string; totalCents: number; paidAt: string
  items?: OrderItem[]; layout?: (OrderFace | null)[]
}
interface Booking {
  id: string; name: string; email: string; phone: string; activity: string
  submittedAt: string; date: string; time: string; partySize: number
  location: string; status: string; details: string
}
interface Phonecase {
  brand: string; model: string; plaza: number; mercury: number
  alibaba: number; total: number
}

type Tab = 'inventory' | 'categories' | 'orders' | 'bookings' | 'phonecases'

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 32) || 'charm'

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null) // null = checking
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<Tab>('bookings')

  const [charms, setCharms] = useState<Charm[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [phonecases, setPhonecases] = useState<Phonecase[]>([])
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

  const loadBookings = useCallback(async () => {
    const res = await fetch('/api/admin/bookings')
    if (res.ok) setBookings((await res.json()).bookings ?? [])
  }, [])

  const loadPhonecases = useCallback(async () => {
    const res = await fetch('/api/admin/phonecases')
    if (res.ok) setPhonecases((await res.json()).phonecases ?? [])
  }, [])

  useEffect(() => { loadInventory() }, [loadInventory])
  useEffect(() => {
    if (authed) { loadCategories(); loadOrders(); loadBookings(); loadPhonecases() }
  }, [authed, loadCategories, loadOrders, loadBookings, loadPhonecases])

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

  // ─── Phone case actions ────────────────────────────────────────────────────
  async function savePhonecase(p: Phonecase) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/phonecases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
      if (res.ok) { flash(`Saved ${p.model}`); await loadPhonecases() }
      else flash((await res.json().catch(() => ({}))).error ?? 'Save failed')
    } finally { setBusy(false) }
  }

  async function deletePhonecaseItem(brand: string, model: string) {
    if (!confirm(`Delete "${brand} ${model}"?`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/phonecases?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`, { method: 'DELETE' })
      if (res.ok) { flash(`Deleted ${model}`); await loadPhonecases() }
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password} autoFocus
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 12, border: `1px solid ${BORDER}`, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="button" onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                title={showPw ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: ACCENT, padding: 0 }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
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
  return <Dashboard
    tab={tab} setTab={setTab} logout={logout} msg={msg}
    bookings={bookings} loadBookings={loadBookings}
    phonecases={phonecases} savePhonecase={savePhonecase} deletePhonecaseItem={deletePhonecaseItem} loadPhonecases={loadPhonecases}
    charms={charms} categories={categories} saveCharm={saveCharm} deleteCharm={deleteCharm}
    addCategory={addCategory} deleteCategory={deleteCategory}
    orders={orders} loadOrders={loadOrders} busy={busy}
  />
}

// Dashboard is split out so it can use the useIsMobile hook (hooks can't run
// after the early auth `return`s in AdminPage).
function Dashboard({
  tab, setTab, logout, msg,
  bookings, loadBookings,
  phonecases, savePhonecase, deletePhonecaseItem, loadPhonecases,
  charms, categories, saveCharm, deleteCharm,
  addCategory, deleteCategory,
  orders, loadOrders, busy,
}: {
  tab: Tab; setTab: (t: Tab) => void; logout: () => void; msg: string
  bookings: Booking[]; loadBookings: () => void
  phonecases: Phonecase[]; savePhonecase: (p: Phonecase) => Promise<void> | void; deletePhonecaseItem: (brand: string, model: string) => void; loadPhonecases: () => void
  charms: Charm[]; categories: string[]; saveCharm: (c: Charm) => void; deleteCharm: (id: string, name: string) => void
  addCategory: (n: string) => void; deleteCategory: (n: string) => void
  orders: Order[]; loadOrders: () => void; busy: boolean
}) {
  const isMobile = useIsMobile()
  return (
    <main style={{ minHeight: '100vh', background: BG, padding: '0 0 60px' }}>
      {/* Header */}
      <header style={{ background: MAROON, padding: isMobile ? '16px 14px' : '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 17 : 20, fontWeight: 900 }}>🎨 OddlyCraft Admin</h1>
        <button onClick={logout} style={{ padding: '8px 16px', background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Sign out</button>
      </header>

      {/* Tabs — wrap onto multiple rows on mobile so nothing scrolls sideways */}
      <nav style={{ display: 'flex', gap: isMobile ? 6 : 4, padding: isMobile ? '12px 12px 0' : '16px 24px 0', maxWidth: 1100, margin: '0 auto', flexWrap: 'wrap' }}>
        {(['bookings', 'phonecases', 'inventory', 'categories', 'orders'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ whiteSpace: 'nowrap', padding: isMobile ? '9px 14px' : '10px 18px', background: tab === t ? CARD : 'transparent', color: tab === t ? MAROON : ACCENT, border: isMobile && tab !== t ? `1px solid ${BORDER}` : 'none', borderRadius: isMobile ? 10 : '12px 12px 0 0', fontSize: 14, fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize' }}>
            {t === 'phonecases' ? 'Phone Cases' : t}
          </button>
        ))}
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px' }}>
        {msg && <div style={{ background: '#DFF5E1', color: '#1E6B2E', padding: '10px 16px', borderRadius: 10, margin: '12px 0', fontSize: 14, fontWeight: 600 }}>{msg}</div>}

        <div style={{ background: CARD, borderRadius: isMobile ? 14 : '0 14px 14px 14px', marginTop: isMobile ? 10 : 0, padding: isMobile ? 14 : 20, boxShadow: '0 2px 20px rgba(123,26,56,.07)' }}>
          {tab === 'bookings'   && <BookingsTab bookings={bookings} onRefresh={loadBookings} isMobile={isMobile} />}
          {tab === 'phonecases' && <PhonecasesTab phonecases={phonecases} onSave={savePhonecase} onDelete={deletePhonecaseItem} onRefresh={loadPhonecases} busy={busy} isMobile={isMobile} />}
          {tab === 'inventory'  && <InventoryTab charms={charms} categories={categories} onSave={saveCharm} onDelete={deleteCharm} busy={busy} isMobile={isMobile} />}
          {tab === 'categories' && <CategoriesTab categories={categories} onAdd={addCategory} onDelete={deleteCategory} busy={busy} />}
          {tab === 'orders'     && <OrdersTab orders={orders} onRefresh={loadOrders} isMobile={isMobile} />}
        </div>
      </div>
    </main>
  )
}

// ─── Inventory tab ─────────────────────────────────────────────────────────
function InventoryTab({ charms, categories, onSave, onDelete, busy, isMobile }: {
  charms: Charm[]; categories: string[]; onSave: (c: Charm) => void; onDelete: (id: string, name: string) => void; busy: boolean; isMobile: boolean
}) {
  const [draft, setDraft] = useState<Record<string, Charm>>({})
  const [nw, setNw] = useState({ name: '', category: '', price: '3.50', quantity: '100', imageUrl: '' })

  const edit = (c: Charm, patch: Partial<Charm>) =>
    setDraft((d) => ({ ...d, [c.id]: { ...c, ...d[c.id], ...patch } }))
  const val = (c: Charm): Charm => draft[c.id] ?? c
  const cats = categories.length ? categories : ['Custom']
  const fieldW = (w: number) => (isMobile ? inpFull : inp(w))

  return (
    <div>
      <h2 style={{ margin: '0 0 4px', color: INK, fontSize: 18 }}>Charm inventory <span style={{ color: ACCENT, fontWeight: 600, fontSize: 14 }}>({charms.length})</span></h2>
      <p style={{ margin: '0 0 16px', color: ACCENT, fontSize: 13 }}>Edit any field then hit Save.</p>

      {/* Add new */}
      <div style={{ background: SOFT, borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <p style={{ margin: '0 0 10px', fontWeight: 800, color: MAROON, fontSize: 14 }}>➕ Add a charm</p>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'center' }}>
          <input placeholder="Name" value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} style={fieldW(150)} />
          <select value={nw.category || cats[0]} onChange={(e) => setNw({ ...nw, category: e.target.value })} style={fieldW(120)}>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {isMobile ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" step="0.50" min="0" placeholder="Price €" value={nw.price} onChange={(e) => setNw({ ...nw, price: e.target.value })} style={{ ...inpFull, flex: 1 }} />
              <input type="number" step="1" min="0" placeholder="Qty" value={nw.quantity} onChange={(e) => setNw({ ...nw, quantity: e.target.value })} style={{ ...inpFull, flex: 1 }} />
            </div>
          ) : (
            <>
              <input type="number" step="0.50" min="0" placeholder="Price" value={nw.price} onChange={(e) => setNw({ ...nw, price: e.target.value })} style={inp(80)} />
              <input type="number" step="1" min="0" placeholder="Qty" value={nw.quantity} onChange={(e) => setNw({ ...nw, quantity: e.target.value })} style={inp(70)} />
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#fff', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {nw.imageUrl
                ? <img src={nw.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 16, color: '#C9AEB8' }}>🖼️</span>}
            </div>
            <label style={{ ...btn(!busy), padding: '8px 12px', display: 'inline-block', cursor: busy ? 'not-allowed' : 'pointer' }}>
              {nw.imageUrl ? 'Change image' : 'Choose image'}
              <input type="file" accept="image/*" disabled={busy} style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  try { setNw((s) => ({ ...s, imageUrl: '' })); const url = await fileToResizedDataUrl(file); setNw((s) => ({ ...s, imageUrl: url })) }
                  catch { alert('Could not read that image.') }
                }} />
            </label>
            {nw.imageUrl && (
              <button type="button" disabled={busy} onClick={() => setNw({ ...nw, imageUrl: '' })} title="Remove image"
                style={{ background: '#fff', color: '#C0392B', border: '1px solid #E8B4B4', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontWeight: 800, lineHeight: 1, flexShrink: 0 }}>×</button>
            )}
          </div>
          <button disabled={busy || !nw.name.trim()}
            onClick={() => { onSave({ id: `${slug(nw.name)}${Math.random().toString(36).slice(2, 5)}`, name: nw.name.trim(), category: nw.category || cats[0], price: Number(nw.price) || 0, quantity: parseInt(nw.quantity) || 0, imageUrl: nw.imageUrl.trim() }); setNw({ name: '', category: '', price: '3.50', quantity: '100', imageUrl: '' }) }}
            style={{ ...btn(!busy && !!nw.name.trim()), ...(isMobile ? { width: '100%', padding: '12px' } : {}) }}>Add</button>
        </div>
      </div>

      {/* Mobile: stacked cards so every field is reachable without sideways scrolling */}
      {isMobile ? (
        <div>
          {charms.map((c) => {
            const v = val(c)
            return (
              <div key={c.id} style={mcard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: '#F5EEF1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {v.imageUrl
                      ? <img src={v.imageUrl} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 20, color: '#C9AEB8' }}>🔗</span>}
                  </div>
                  <label style={{ ...btn(!busy), display: 'inline-block', cursor: busy ? 'not-allowed' : 'pointer' }}>
                    {v.imageUrl ? 'Change image' : 'Upload image'}
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
                      style={{ background: '#fff', color: '#C0392B', border: '1px solid #E8B4B4', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontWeight: 800, lineHeight: 1, flexShrink: 0 }}>×</button>
                  )}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={mlabel}>Name</label>
                  <input value={v.name} onChange={(e) => edit(c, { name: e.target.value })} style={inpFull} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={mlabel}>Category</label>
                  <select value={v.category} onChange={(e) => edit(c, { category: e.target.value })} style={inpFull}>
                    {[...new Set([v.category, ...cats])].map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label style={mlabel}>Price €</label>
                    <input type="number" step="0.50" min="0" value={v.price} onChange={(e) => edit(c, { price: Number(e.target.value) })} style={inpFull} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={mlabel}>Stock</label>
                    <input type="number" step="1" min="0" value={v.quantity} onChange={(e) => edit(c, { quantity: parseInt(e.target.value) || 0 })} style={inpFull} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button disabled={busy} onClick={() => onSave(v)} style={{ ...btn(!busy, true), flex: 1, padding: '12px' }}>Save</button>
                  <button disabled={busy} onClick={() => onDelete(c.id, c.name)} style={{ ...btn(!busy), background: '#fff', color: '#C0392B', border: '1px solid #E8B4B4', padding: '12px 18px' }}>Del</button>
                </div>
              </div>
            )
          })}
          {charms.length === 0 && <p style={{ color: ACCENT, fontSize: 13 }}>No charms yet.</p>}
        </div>
      ) : (
      /* Desktop table */
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
      )}
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
function OrdersTab({ orders, onRefresh, isMobile }: { orders: Order[]; onRefresh: () => void; isMobile: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: INK, fontSize: 18 }}>Charm orders <span style={{ color: ACCENT, fontWeight: 600, fontSize: 14 }}>({orders.length})</span></h2>
        <button onClick={onRefresh} style={{ padding: '6px 14px', background: SOFT, color: MAROON, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      <p style={{ margin: '0 0 12px', color: ACCENT, fontSize: 13 }}>Each order shows the assembled bracelet — exactly as the customer built it — plus a charm pick-list, so it&apos;s easy to fulfil.</p>

      {isMobile ? (
        <div>
          {orders.map((o) => (
            <div key={o.sessionId} style={mcard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{fmt(o.paidAt)}</span>
                <span style={{ fontSize: 17, fontWeight: 900, color: MAROON }}>€{(o.totalCents / 100).toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 13, color: INK, marginBottom: 2, wordBreak: 'break-all' }}>{o.email}</div>
              <div style={{ fontSize: 12, color: ACCENT, marginBottom: 10, textTransform: 'capitalize' }}>{o.metal} · {o.numLinks} links</div>
              {o.layout && o.layout.length > 0 && <BraceletStrip metal={o.metal} layout={o.layout} />}
              <CharmItems items={o.items} fallback={o.charms} />
            </div>
          ))}
          {orders.length === 0 && <p style={{ color: ACCENT, fontSize: 13 }}>No orders yet.</p>}
        </div>
      ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 720 }}>
          <thead><tr style={{ textAlign: 'left', color: ACCENT }}><Th>Paid</Th><Th>Email</Th><Th>Metal</Th><Th>Links</Th><Th>Charms to fit</Th><Th>Total</Th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.sessionId} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ ...td, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{fmt(o.paidAt)}</td>
                <td style={{ ...td, verticalAlign: 'top' }}>{o.email}</td>
                <td style={{ ...td, verticalAlign: 'top', textTransform: 'capitalize' }}>{o.metal}</td>
                <td style={{ ...td, verticalAlign: 'top' }}>{o.numLinks}</td>
                <td style={{ ...td, verticalAlign: 'top', minWidth: 260 }}>
                  {o.layout && o.layout.length > 0 && <BraceletStrip metal={o.metal} layout={o.layout} />}
                  <CharmItems items={o.items} fallback={o.charms} />
                </td>
                <td style={{ ...td, verticalAlign: 'top', whiteSpace: 'nowrap' }}>€{(o.totalCents / 100).toFixed(2)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td style={{ ...td, color: ACCENT }} colSpan={6}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

// ─── Bookings tab ──────────────────────────────────────────────────────────
function BookingsTab({ bookings, onRefresh, isMobile }: { bookings: Booking[]; onRefresh: () => void; isMobile: boolean }) {
  const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
    paid:      { bg: '#E8F9F2', fg: '#1A5C3A', label: '✅ Paid' },
    confirmed: { bg: '#E8F0FF', fg: '#1A3A7B', label: '✔ Confirmed' },
    pending:   { bg: '#FFF6E5', fg: '#7B5E00', label: '⏳ Pending' },
  }
  const badge = (s: string) => STATUS[s.toLowerCase()] ?? { bg: SOFT, fg: ACCENT, label: s || '—' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: INK, fontSize: 18 }}>Bookings <span style={{ color: ACCENT, fontWeight: 600, fontSize: 14 }}>({bookings.length})</span></h2>
        <button onClick={onRefresh} style={{ padding: '6px 14px', background: SOFT, color: MAROON, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      {isMobile ? (
        <div>
          {bookings.map((b) => {
            const m = badge(b.status)
            return (
              <div key={b.id} style={mcard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: INK }}>{b.date} <span style={{ color: ACCENT, fontWeight: 600 }}>{b.time}</span></span>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: m.bg, color: m.fg, flexShrink: 0 }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: MAROON, marginBottom: 2 }}>
                  {getActivityLabel(b.activity)}
                  {b.details && <span style={{ color: ACCENT, fontSize: 12, fontWeight: 600 }}> · 📱 {b.details}</span>}
                </div>
                <div style={{ fontSize: 13, color: INK, marginBottom: 8 }}>{b.name || '—'} · {b.partySize} {b.partySize === 1 ? 'person' : 'people'} · {getLocationLabel(b.location)}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', fontSize: 13 }}>
                  <a href={`mailto:${b.email}`} style={{ color: MAROON, wordBreak: 'break-all' }}>{b.email}</a>
                  {b.phone && <a href={`tel:${b.phone}`} style={{ color: ACCENT }}>{b.phone}</a>}
                </div>
              </div>
            )
          })}
          {bookings.length === 0 && <p style={{ color: ACCENT, fontSize: 13 }}>No bookings yet.</p>}
        </div>
      ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 820 }}>
          <thead><tr style={{ textAlign: 'left', color: ACCENT }}>
            <Th>When</Th><Th>Activity</Th><Th>Name</Th><Th>Contact</Th><Th>Party</Th><Th>Location</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={td}>{b.date} <span style={{ color: ACCENT }}>{b.time}</span></td>
                <td style={td}>
                  {getActivityLabel(b.activity)}
                  {b.details && <div style={{ color: ACCENT, fontSize: 12 }}>📱 {b.details}</div>}
                </td>
                <td style={td}>{b.name || '—'}</td>
                <td style={{ ...td, maxWidth: 220 }}>
                  <div>{b.email}</div>
                  {b.phone && <div style={{ color: ACCENT }}>{b.phone}</div>}
                </td>
                <td style={td}>{b.partySize}</td>
                <td style={td}>{getLocationLabel(b.location)}</td>
                <td style={td}>
                  {(() => { const m = badge(b.status); return (
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: m.bg, color: m.fg }}>{m.label}</span>
                  ) })()}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td style={{ ...td, color: ACCENT }} colSpan={7}>No bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

// ─── Phone cases tab ───────────────────────────────────────────────────────
function PhonecasesTab({ phonecases, onSave, onDelete, onRefresh, busy, isMobile }: {
  phonecases: Phonecase[]; onSave: (p: Phonecase) => Promise<void> | void; onDelete: (brand: string, model: string) => void; onRefresh: () => void; busy: boolean; isMobile: boolean
}) {
  const [draft, setDraft] = useState<Record<string, Phonecase>>({})
  const [q, setQ] = useState('')
  const [brandFilter, setBrandFilter] = useState('All')
  const [nw, setNw] = useState({ brand: 'iPhone', model: '', plaza: '0', mercury: '0', alibaba: '0' })

  const keyOf = (p: { brand: string; model: string }) => `${p.brand}||${p.model}`
  const edit = (p: Phonecase, patch: Partial<Phonecase>) =>
    setDraft((d) => ({ ...d, [keyOf(p)]: { ...p, ...d[keyOf(p)], ...patch } }))
  const val = (p: Phonecase): Phonecase => draft[keyOf(p)] ?? p

  // Auto-save a row when the owner leaves a field — no Save button needed. Only
  // writes when something actually changed, then clears the draft so the freshly
  // reloaded values (incl. the Alibaba→Plaza move) replace the edited ones.
  const commit = async (p: Phonecase) => {
    const k = keyOf(p)
    const v = draft[k]
    if (!v) return
    const changed = v.plaza !== p.plaza || v.mercury !== p.mercury || v.alibaba !== p.alibaba
    if (changed) await onSave(v)
    setDraft((d) => { const n = { ...d }; delete n[k]; return n })
  }
  const sum = (p: { plaza: number; mercury: number; alibaba: number }) =>
    (Number(p.plaza) || 0) + (Number(p.mercury) || 0) + (Number(p.alibaba) || 0)

  // Quick "sold one" — drop a shop's stock by 1 (floored at 0) and save right away.
  // Clears any pending draft first so the reloaded row replaces the edited values.
  const deductOne = (p: Phonecase, loc: 'plaza' | 'mercury') => {
    const v = val(p)
    const current = Number(v[loc]) || 0
    if (busy || current <= 0) return
    const next = { ...v, [loc]: current - 1 }
    setDraft((d) => { const n = { ...d }; delete n[keyOf(p)]; return n })
    onSave(next)
  }

  const brands = ['All', ...Array.from(new Set(phonecases.map((p) => p.brand)))]
  const knownBrands = Array.from(new Set(phonecases.map((p) => p.brand)))
  const brandOpts = knownBrands.length ? knownBrands : ['iPhone', 'Samsung', 'Redmi']
  const filtered = phonecases.filter((p) =>
    (brandFilter === 'All' || p.brand === brandFilter) &&
    (!q || p.model.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, color: INK, fontSize: 18 }}>Phone case stock <span style={{ color: ACCENT, fontWeight: 600, fontSize: 14 }}>({phonecases.length} models)</span></h2>
        <button onClick={onRefresh} style={{ padding: '6px 14px', background: SOFT, color: MAROON, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </div>
      <p style={{ margin: '0 0 16px', color: ACCENT, fontSize: 13 }}>Edit stock per source — changes <strong>save automatically</strong> when you leave a field. Total is calculated automatically. Plaza/Mercury auto-decrease when a phone case is booked & paid. Stock entered under <strong>Alibaba</strong> is moved into <strong>Plaza</strong> (Alibaba resets to 0), so it&apos;s only counted once.</p>

      {/* Add new */}
      <div style={{ background: SOFT, borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <p style={{ margin: '0 0 10px', fontWeight: 800, color: MAROON, fontSize: 14 }}>➕ Add a model</p>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'center' }}>
          <select value={nw.brand} onChange={(e) => setNw({ ...nw, brand: e.target.value })} style={isMobile ? inpFull : inp(110)}>
            {brandOpts.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <input placeholder="Model" value={nw.model} onChange={(e) => setNw({ ...nw, model: e.target.value })} style={isMobile ? inpFull : inp(150)} />
          {isMobile ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min="0" placeholder="Plaza" value={nw.plaza} onChange={(e) => setNw({ ...nw, plaza: e.target.value })} style={{ ...inpFull, flex: 1 }} />
              <input type="number" min="0" placeholder="Mercury" value={nw.mercury} onChange={(e) => setNw({ ...nw, mercury: e.target.value })} style={{ ...inpFull, flex: 1 }} />
              <input type="number" min="0" placeholder="Alibaba" value={nw.alibaba} onChange={(e) => setNw({ ...nw, alibaba: e.target.value })} style={{ ...inpFull, flex: 1 }} />
            </div>
          ) : (
            <>
              <input type="number" min="0" placeholder="Plaza" value={nw.plaza} onChange={(e) => setNw({ ...nw, plaza: e.target.value })} style={inp(75)} />
              <input type="number" min="0" placeholder="Mercury" value={nw.mercury} onChange={(e) => setNw({ ...nw, mercury: e.target.value })} style={inp(80)} />
              <input type="number" min="0" placeholder="Alibaba" value={nw.alibaba} onChange={(e) => setNw({ ...nw, alibaba: e.target.value })} style={inp(80)} />
            </>
          )}
          <button disabled={busy || !nw.model.trim()}
            onClick={() => { onSave({ brand: nw.brand, model: nw.model.trim(), plaza: +nw.plaza || 0, mercury: +nw.mercury || 0, alibaba: +nw.alibaba || 0, total: 0 }); setNw({ brand: nw.brand, model: '', plaza: '0', mercury: '0', alibaba: '0' }) }}
            style={{ ...btn(!busy && !!nw.model.trim()), ...(isMobile ? { width: '100%', padding: '12px' } : {}) }}>Add</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} style={isMobile ? { ...inpFull, flex: 1, width: 'auto' } : inp(130)}>
          {brands.map((b) => <option key={b} value={b}>{b === 'All' ? 'All brands' : b}</option>)}
        </select>
        <input placeholder="Search model…" value={q} onChange={(e) => setQ(e.target.value)} style={isMobile ? { ...inpFull, flex: 2, width: 'auto' } : inp(180)} />
        {!isMobile && <span style={{ alignSelf: 'center', color: ACCENT, fontSize: 13 }}>{filtered.length} shown</span>}
      </div>

      {/* Mobile: stacked cards — Plaza/Mercury/Alibaba editable inline, auto-saved on blur */}
      {isMobile ? (
        <div>
          {filtered.map((p) => {
            const v = val(p)
            return (
              <div key={keyOf(p)} style={mcard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>{p.brand}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: INK }}>{p.model}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>Total</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: MAROON }}>{sum(v)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={mlabel}>Plaza</label>
                    <input type="number" min="0" value={v.plaza} onChange={(e) => edit(p, { plaza: parseInt(e.target.value) || 0 })} onBlur={() => commit(p)} style={inpFull} />
                    <button disabled={busy || (Number(v.plaza) || 0) <= 0} onClick={() => deductOne(p, 'plaza')} style={deductBtn(!busy && (Number(v.plaza) || 0) > 0)}>−1 sold</button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={mlabel}>Mercury</label>
                    <input type="number" min="0" value={v.mercury} onChange={(e) => edit(p, { mercury: parseInt(e.target.value) || 0 })} onBlur={() => commit(p)} style={inpFull} />
                    <button disabled={busy || (Number(v.mercury) || 0) <= 0} onClick={() => deductOne(p, 'mercury')} style={deductBtn(!busy && (Number(v.mercury) || 0) > 0)}>−1 sold</button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={mlabel}>Alibaba</label>
                    <input type="number" min="0" value={v.alibaba} onChange={(e) => edit(p, { alibaba: parseInt(e.target.value) || 0 })} onBlur={() => commit(p)} style={inpFull} />
                  </div>
                </div>
                <button disabled={busy} onClick={() => onDelete(p.brand, p.model)} style={{ ...btn(!busy), background: '#fff', color: '#C0392B', border: '1px solid #E8B4B4', width: '100%', padding: '11px' }}>Delete</button>
              </div>
            )
          })}
          {filtered.length === 0 && <p style={{ color: ACCENT, fontSize: 13 }}>No models match.</p>}
        </div>
      ) : (
      /* Desktop table */
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: ACCENT }}>
              <Th>Brand</Th><Th>Model</Th><Th>Plaza</Th><Th>Mercury</Th><Th>Alibaba</Th><Th>Total</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const v = val(p)
              return (
                <tr key={keyOf(p)} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={td}>{p.brand}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{p.model}</td>
                  <td style={td}><input type="number" min="0" value={v.plaza} onChange={(e) => edit(p, { plaza: parseInt(e.target.value) || 0 })} onBlur={() => commit(p)} style={inp(65)} /></td>
                  <td style={td}><input type="number" min="0" value={v.mercury} onChange={(e) => edit(p, { mercury: parseInt(e.target.value) || 0 })} onBlur={() => commit(p)} style={inp(65)} /></td>
                  <td style={td}><input type="number" min="0" value={v.alibaba} onChange={(e) => edit(p, { alibaba: parseInt(e.target.value) || 0 })} onBlur={() => commit(p)} style={inp(65)} /></td>
                  <td style={{ ...td, fontWeight: 800 }}>{sum(v)}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button disabled={busy} onClick={() => onDelete(p.brand, p.model)} style={{ ...btn(!busy), background: '#fff', color: '#C0392B', border: '1px solid #E8B4B4' }}>Del</button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td style={{ ...td, color: ACCENT }} colSpan={7}>No models match.</td></tr>}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

// ─── Assembled bracelet: the exact layout the customer built ─────────────────
function BraceletStrip({ metal, layout }: { metal: string; layout: (OrderFace | null)[] }) {
  const m = (metal || 'silver').toLowerCase()
  const link = `/${['silver', 'gold', 'bronze'].includes(m) ? m : 'silver'}.png`
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(180deg,#F6F2F4 0%,#EDE6EA 100%)', borderRadius: 10, padding: '7px 0', border: `2px solid ${BORDER}`, minWidth: 'max-content', boxShadow: 'inset 0 1px 4px rgba(0,0,0,.06)' }}>
        {layout.map((f, i) => {
          const face = f && CHARM_FACE[f.id]
          return (
            <div key={i} title={f?.name} style={{ width: 34, height: 34, position: 'relative', flexShrink: 0 }}>
              <img src={link} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
              {f && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {f.imageUrl
                    ? <img src={f.imageUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }} />
                    : face
                      ? <><span style={{ position: 'absolute', inset: 4, background: face.bg, borderRadius: 2 }} /><span style={{ position: 'relative', fontSize: 15, lineHeight: 1 }}>{face.emoji}</span></>
                      : <span style={{ fontSize: 8, color: INK, textAlign: 'center', lineHeight: 1, padding: 1 }}>{f.name.slice(0, 4)}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Charm order line: pictures of every charm to fit on the bracelet ────────
function CharmItems({ items, fallback }: { items?: OrderItem[]; fallback: string }) {
  if (!items || items.length === 0) {
    // Older orders recorded before charm images — show the text summary.
    return <span>{fallback || '—'}</span>
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map((it) => (
        <div key={it.id} title={`${it.name}${it.qty > 1 ? ` ×${it.qty}` : ''}`}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 64 }}>
          <div style={{ position: 'relative', width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: '#F5EEF1', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {it.imageUrl
              ? <img src={it.imageUrl} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 11, color: ACCENT, textAlign: 'center', padding: 2, lineHeight: 1.1 }}>{it.name}</span>}
            {it.qty > 1 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: MAROON, color: '#fff', borderRadius: 20, minWidth: 18, height: 18, padding: '0 5px', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }}>×{it.qty}</span>
            )}
          </div>
          <span style={{ marginTop: 3, fontSize: 10.5, color: INK, textAlign: 'center', lineHeight: 1.15, maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
        </div>
      ))}
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
// Full-width input for mobile cards. 16px font stops iOS from auto-zooming on focus.
const inpFull: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 16, outline: 'none', boxSizing: 'border-box' }
// Stacked card that replaces a table row on mobile.
const mcard: React.CSSProperties = { border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 12, background: '#fff' }
const mlabel: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }
const btn = (on: boolean, primary = false): React.CSSProperties => ({ padding: '8px 14px', background: on ? (primary ? MAROON : '#7B1A38') : '#E0D0D4', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: on ? 'pointer' : 'not-allowed' })
// Compact "sold one" button under a shop's stock input on mobile cards.
const deductBtn = (on: boolean): React.CSSProperties => ({ width: '100%', marginTop: 6, padding: '8px', background: on ? '#fff' : '#F5EEF1', color: on ? '#C0392B' : '#C9AEB8', border: `1px solid ${on ? '#E8B4B4' : BORDER}`, borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: on ? 'pointer' : 'not-allowed' })
function fmt(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
