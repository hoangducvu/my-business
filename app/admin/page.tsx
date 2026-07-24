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
interface Deduction {
  time: string; brand: string; model: string; location: string
  qty: number; source: string; note: string
}

type Tab = 'inventory' | 'categories' | 'orders' | 'bookings' | 'phonecases' | 'history'

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 32) || 'charm'

// ─── Fuzzy phone-model matcher for the "sell by name" deduct box ─────────────
// Turns loose owner input ("17", "17pm", "17 pro max", "a23", "note 13 pro")
// into the exact seeded model. Validated against all 103 real model names.
const PC_SUFFIX = ['promax', 'plus', 'ultra', 'power', 'mini', 'air', 'pro', 'max', 'fe', '5g', '4g']
const PC_PEEL = [...PC_SUFFIX].sort((a, b) => b.length - a.length) // longest-first end-peel

function pcBrandHint(s: string): string | null {
  s = s.toLowerCase()
  if (/iphone|\bip\b|ipone/.test(s)) return 'iPhone'
  if (/samsung|galaxy/.test(s)) return 'Samsung'
  if (/redmi|xiaomi|\bnote\b/.test(s)) return 'Redmi'
  return null
}

// Canonicalise suffix synonyms while keeping glued-ness (no forced spaces).
function pcNorm(s: string): string {
  s = s.toLowerCase()
  s = s.replace(/iphone|ipone/g, ' ').replace(/samsung|galaxy|redmi|xiaomi/g, ' ')
  s = s.replace(/\bip\b/g, ' ')
  s = s.replace(/(\d)\s*\+/g, '$1plus').replace(/\+/g, ' plus ')
  s = s.replace(/pro\s*max/g, 'promax')
  s = s.replace(/(^|[^a-z])(promax|prmx|prm|pmax|pm)(?=$|[^a-z])/g, '$1promax')
  s = s.replace(/(\d)\s*g(?![a-z])/g, '$1g') // keep 5g/4g glued to the digit
  return s.replace(/[^a-z0-9/ ]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Peel known suffixes off the end of a token → { core, sufs }.
function pcPeel(tok: string): { core: string; sufs: string[] } {
  const sufs: string[] = []
  let t = tok, changed = true
  while (changed) {
    changed = false
    for (const s of PC_PEEL) {
      if (t.length > s.length && t.endsWith(s)) { t = t.slice(0, -s.length); sufs.push(s); changed = true; break }
    }
  }
  return { core: t, sufs }
}

const pcIsSuffix = (t: string) => PC_SUFFIX.includes(t)
const pcHasDigit = (t: string) => /\d/.test(t)

// Canonical key for a single typed query.
function pcCanonical(q: string): string {
  const s = pcNorm(q)
  if (!s) return ''
  const sufs = new Set<string>(); const cores: string[] = []; let note = false
  for (const t of s.split(' ')) {
    if (t === 'note') { note = true; continue }
    if (pcIsSuffix(t)) { sufs.add(t); continue }
    const p = pcPeel(t)
    if (p.core) { cores.push(p.core) }
    p.sufs.forEach((x) => sufs.add(x))
  }
  const core = cores.join('')
  if (!core) return ''
  return (note ? 'note' : '') + core + [...sufs].sort().join('')
}

// Expand a sheet model name (may hold slash-separated variants) → canonical keys.
function pcExpand(model: string): string[] {
  const s = pcNorm(model)
  if (!s) return []
  const parts = s.split('/').map((p) => p.trim()).filter(Boolean)
  let note = false, prefixLetter = ''
  outer: for (const part of parts) {
    for (const t of part.split(' ')) {
      if (t === 'note') { note = true; continue }
      const m = t.match(/^([a-z]+)(\d.*)$/)
      if (m) { prefixLetter = m[1]; break outer }
      if (pcHasDigit(t)) break outer
    }
  }
  if (parts.some((p) => p.split(' ').includes('note'))) note = true

  const lastToks = parts[parts.length - 1].split(' ')
  const lastTrailing: string[] = []
  for (let i = lastToks.length - 1; i >= 0; i--) {
    if (pcIsSuffix(lastToks[i])) lastTrailing.unshift(lastToks[i]); else break
  }

  const keys = new Set<string>()
  for (const part of parts) {
    const toks = part.split(' ').filter((t) => t !== 'note')
    const localStandalone = toks.filter(pcIsSuffix)
    for (const ct of toks.filter((t) => !pcIsSuffix(t))) {
      const p = pcPeel(ct)
      if (!p.core) continue
      let base = p.core
      if (prefixLetter && /^\d/.test(base)) base = prefixLetter + base
      const sufs = new Set<string>([...p.sufs, ...localStandalone])
      if (sufs.size === 0 && lastTrailing.length) lastTrailing.forEach((x) => sufs.add(x))
      keys.add((note ? 'note' : '') + base + [...sufs].sort().join(''))
    }
  }
  return [...keys]
}

// Models whose variant-set matches the query, brand-filtered when the query
// names a brand. Empty = no match; length > 1 = ambiguous (let the owner pick).
function pcMatch(query: string, list: Phonecase[]): Phonecase[] {
  const k = pcCanonical(query)
  if (!k) return []
  const brand = pcBrandHint(query)
  let ms = list.filter((p) => pcExpand(p.model).includes(k))
  if (brand && ms.some((p) => p.brand === brand)) ms = ms.filter((p) => p.brand === brand)
  return ms
}

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
  const [deductions, setDeductions] = useState<Deduction[]>([])
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

  const loadDeductions = useCallback(async () => {
    const res = await fetch('/api/admin/phonecase-deduct')
    if (res.ok) setDeductions((await res.json()).deductions ?? [])
  }, [])

  useEffect(() => { loadInventory() }, [loadInventory])
  useEffect(() => {
    if (authed) { loadCategories(); loadOrders(); loadBookings(); loadPhonecases(); loadDeductions() }
  }, [authed, loadCategories, loadOrders, loadBookings, loadPhonecases, loadDeductions])

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

  // Deduct one unit of a model from a shop (Plaza/Mercury) and log it to history.
  // Returns true on success so callers can react (e.g. clear the search box).
  async function deductModel(brand: string, model: string, location: 'plaza' | 'mercury', qty = 1) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/phonecase-deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, model, location, qty }),
      })
      if (res.ok) {
        const { phonecase } = await res.json()
        flash(`−${qty} ${model} · ${location} → ${phonecase?.total ?? '?'} left`)
        await Promise.all([loadPhonecases(), loadDeductions()])
        return true
      }
      flash((await res.json().catch(() => ({}))).error ?? 'Deduct failed')
      return false
    } finally { setBusy(false) }
  }

  async function markBookingDone(id: string, name: string) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'done' }),
      })
      if (res.ok) { flash(`Marked done${name ? ` — ${name}` : ''}`); await loadBookings() }
      else flash((await res.json().catch(() => ({}))).error ?? 'Update failed')
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
    bookings={bookings} loadBookings={loadBookings} markBookingDone={markBookingDone}
    phonecases={phonecases} savePhonecase={savePhonecase} loadPhonecases={loadPhonecases}
    deductions={deductions} deductModel={deductModel} loadDeductions={loadDeductions}
    charms={charms} categories={categories} saveCharm={saveCharm} deleteCharm={deleteCharm}
    addCategory={addCategory} deleteCategory={deleteCategory}
    orders={orders} loadOrders={loadOrders} busy={busy}
  />
}

// Dashboard is split out so it can use the useIsMobile hook (hooks can't run
// after the early auth `return`s in AdminPage).
function Dashboard({
  tab, setTab, logout, msg,
  bookings, loadBookings, markBookingDone,
  phonecases, savePhonecase, loadPhonecases,
  deductions, deductModel, loadDeductions,
  charms, categories, saveCharm, deleteCharm,
  addCategory, deleteCategory,
  orders, loadOrders, busy,
}: {
  tab: Tab; setTab: (t: Tab) => void; logout: () => void; msg: string
  bookings: Booking[]; loadBookings: () => void; markBookingDone: (id: string, name: string) => void
  phonecases: Phonecase[]; savePhonecase: (p: Phonecase) => Promise<void> | void; loadPhonecases: () => void
  deductions: Deduction[]; deductModel: (brand: string, model: string, location: 'plaza' | 'mercury', qty?: number) => Promise<boolean>; loadDeductions: () => void
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
        {(['bookings', 'phonecases', 'history', 'inventory', 'categories', 'orders'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ whiteSpace: 'nowrap', padding: isMobile ? '9px 14px' : '10px 18px', background: tab === t ? CARD : 'transparent', color: tab === t ? MAROON : ACCENT, border: isMobile && tab !== t ? `1px solid ${BORDER}` : 'none', borderRadius: isMobile ? 10 : '12px 12px 0 0', fontSize: 14, fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize' }}>
            {t === 'phonecases' ? 'Phone Cases' : t === 'history' ? 'History' : t}
          </button>
        ))}
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px' }}>
        {msg && <div style={{ background: '#DFF5E1', color: '#1E6B2E', padding: '10px 16px', borderRadius: 10, margin: '12px 0', fontSize: 14, fontWeight: 600 }}>{msg}</div>}

        <div style={{ background: CARD, borderRadius: isMobile ? 14 : '0 14px 14px 14px', marginTop: isMobile ? 10 : 0, padding: isMobile ? 14 : 20, boxShadow: '0 2px 20px rgba(123,26,56,.07)' }}>
          {tab === 'bookings'   && <BookingsTab bookings={bookings} onRefresh={loadBookings} onMarkDone={markBookingDone} busy={busy} isMobile={isMobile} />}
          {tab === 'phonecases' && <PhonecasesTab phonecases={phonecases} onSave={savePhonecase} onDeduct={deductModel} onRefresh={loadPhonecases} busy={busy} isMobile={isMobile} />}
          {tab === 'history'    && <HistoryTab deductions={deductions} onRefresh={loadDeductions} isMobile={isMobile} />}
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
function BookingsTab({ bookings, onRefresh, onMarkDone, busy, isMobile }: {
  bookings: Booking[]; onRefresh: () => void; onMarkDone: (id: string, name: string) => void; busy: boolean; isMobile: boolean
}) {
  const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
    done:      { bg: '#EDE7F6', fg: '#4A2C82', label: '🎉 Done' },
    paid:      { bg: '#E8F9F2', fg: '#1A5C3A', label: '✅ Paid' },
    confirmed: { bg: '#E8F0FF', fg: '#1A3A7B', label: '✔ Confirmed' },
    pending:   { bg: '#FFF6E5', fg: '#7B5E00', label: '⏳ Pending' },
  }
  const badge = (s: string) => STATUS[s.toLowerCase()] ?? { bg: SOFT, fg: ACCENT, label: s || '—' }
  const isDone = (b: Booking) => b.status.toLowerCase() === 'done'

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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', fontSize: 13, marginBottom: 10 }}>
                  <a href={`mailto:${b.email}`} style={{ color: MAROON, wordBreak: 'break-all' }}>{b.email}</a>
                  {b.phone && <a href={`tel:${b.phone}`} style={{ color: ACCENT }}>{b.phone}</a>}
                </div>
                {isDone(b)
                  ? <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#4A2C82', background: '#EDE7F6', borderRadius: 9, padding: '9px' }}>🎉 Customer came</div>
                  : <button disabled={busy} onClick={() => onMarkDone(b.id, b.name)} style={{ ...btn(!busy, true), width: '100%', padding: '11px' }}>✓ Mark customer came</button>}
              </div>
            )
          })}
          {bookings.length === 0 && <p style={{ color: ACCENT, fontSize: 13 }}>No bookings yet.</p>}
        </div>
      ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 820 }}>
          <thead><tr style={{ textAlign: 'left', color: ACCENT }}>
            <Th>When</Th><Th>Activity</Th><Th>Name</Th><Th>Contact</Th><Th>Party</Th><Th>Location</Th><Th>Status</Th><Th>Action</Th>
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
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  {isDone(b)
                    ? <span style={{ color: '#4A2C82', fontWeight: 700 }}>🎉 Came</span>
                    : <button disabled={busy} onClick={() => onMarkDone(b.id, b.name)} style={btn(!busy, true)}>✓ Came</button>}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td style={{ ...td, color: ACCENT }} colSpan={8}>No bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

// ─── Phone cases tab ───────────────────────────────────────────────────────
function PhonecasesTab({ phonecases, onSave, onDeduct, onRefresh, busy, isMobile }: {
  phonecases: Phonecase[]; onSave: (p: Phonecase) => Promise<void> | void
  onDeduct: (brand: string, model: string, location: 'plaza' | 'mercury', qty?: number) => Promise<boolean>
  onRefresh: () => void; busy: boolean; isMobile: boolean
}) {
  const [draft, setDraft] = useState<Record<string, Phonecase>>({})
  const [q, setQ] = useState('')
  const [sellQ, setSellQ] = useState('')
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

  // Quick "sold one" — deduct 1 from a shop via the server (logs to history too).
  // Clears any pending draft first so the reloaded row replaces the edited values.
  const deductOne = (p: Phonecase, loc: 'plaza' | 'mercury') => {
    if (busy || (Number(p[loc]) || 0) <= 0) return
    setDraft((d) => { const n = { ...d }; delete n[keyOf(p)]; return n })
    onDeduct(p.brand, p.model, loc, 1)
  }

  // ── Sell by name: fuzzy-match loose owner input to a model, then deduct 1 ──
  const sellFrom = (p: Phonecase): 'plaza' | 'mercury' | null =>
    (Number(p.plaza) || 0) > 0 ? 'plaza' : (Number(p.mercury) || 0) > 0 ? 'mercury' : null
  const sell = (p: Phonecase, loc: 'plaza' | 'mercury') => {
    if (busy || (Number(p[loc]) || 0) <= 0) return
    onDeduct(p.brand, p.model, loc, 1)
  }
  const matches = sellQ.trim() ? pcMatch(sellQ, phonecases) : []

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
      <p style={{ margin: '0 0 16px', color: ACCENT, fontSize: 13 }}>Edit stock per source — changes <strong>save automatically</strong> when you leave a field. Total is calculated automatically. Plaza/Mercury auto-decrease when a phone case is booked & paid, or when you sell one below. Stock entered under <strong>Alibaba</strong> is moved into <strong>Plaza</strong> (Alibaba resets to 0), so it&apos;s only counted once.</p>

      {/* Sell by name — type a model, deduct 1 */}
      <div style={{ background: '#FBEEF3', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 800, color: MAROON, fontSize: 14 }}>🔻 Sold a case? Type the model to deduct 1</p>
        <p style={{ margin: '0 0 10px', color: ACCENT, fontSize: 12 }}>Flexible: <em>17</em>, <em>17pro</em>, <em>17 pro max</em>, <em>17pm</em>, <em>16 plus</em>, <em>a23</em>, <em>note 13 pro</em>. Press Enter to sell the single match (Plaza first).</p>
        <input
          value={sellQ} placeholder="e.g. 17 pro max"
          onChange={(e) => setSellQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && matches.length === 1) { const loc = sellFrom(matches[0]); if (loc) sell(matches[0], loc) } }}
          style={{ ...inpFull, fontSize: 16 }} />
        {sellQ.trim() && (
          <div style={{ marginTop: 10 }}>
            {matches.length === 0 && <p style={{ margin: 0, color: '#C0392B', fontSize: 13 }}>No model matches “{sellQ.trim()}”.</p>}
            {matches.length > 1 && <p style={{ margin: '0 0 6px', color: ACCENT, fontSize: 12 }}>{matches.length} matches — pick one:</p>}
            {matches.map((p) => {
              const plaza = Number(p.plaza) || 0, mercury = Number(p.mercury) || 0
              return (
                <div key={keyOf(p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 10px', marginBottom: 6 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>{p.brand}</span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>{p.model} <span style={{ color: ACCENT, fontWeight: 600, fontSize: 12 }}>· {sum(p)} in stock</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button disabled={busy || plaza <= 0} onClick={() => sell(p, 'plaza')} style={sellBtn(!busy && plaza > 0)}>Plaza −1 <b>({plaza})</b></button>
                    <button disabled={busy || mercury <= 0} onClick={() => sell(p, 'mercury')} style={sellBtn(!busy && mercury > 0)}>Mercury −1 <b>({mercury})</b></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
                <div style={{ display: 'flex', gap: 8 }}>
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
              <Th>Brand</Th><Th>Model</Th><Th>Plaza</Th><Th>Mercury</Th><Th>Alibaba</Th><Th>Total</Th><Th>Sell</Th>
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
                    <button disabled={busy || (Number(p.plaza) || 0) <= 0} onClick={() => deductOne(p, 'plaza')} style={sellBtn(!busy && (Number(p.plaza) || 0) > 0)}>Plaza −1</button>
                    <button disabled={busy || (Number(p.mercury) || 0) <= 0} onClick={() => deductOne(p, 'mercury')} style={{ ...sellBtn(!busy && (Number(p.mercury) || 0) > 0), marginLeft: 6 }}>Merc −1</button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td style={{ ...td, color: ACCENT }} colSpan={7}>No models match.</td></tr>}
          </tbody>
        </table>
      </div>
      )}

      {/* Add a model — at the bottom, below all models */}
      <div style={{ background: SOFT, borderRadius: 12, padding: 14, marginTop: 20 }}>
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
    </div>
  )
}

// ─── History tab: log of every phone-case deduction (manual + paid bookings) ─
function HistoryTab({ deductions, onRefresh, isMobile }: {
  deductions: Deduction[]; onRefresh: () => void; isMobile: boolean
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: INK, fontSize: 18 }}>Deduction history <span style={{ color: ACCENT, fontWeight: 600, fontSize: 14 }}>({deductions.length})</span></h2>
        <button onClick={onRefresh} style={{ padding: '6px 14px', background: SOFT, color: MAROON, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </div>
      <p style={{ margin: '0 0 16px', color: ACCENT, fontSize: 13 }}>Every phone-case stock deduction, newest first — whether you sold one from the Phone Cases tab (✋ manual) or a customer paid for a case booking (📅 booking).</p>

      {deductions.length === 0 ? (
        <p style={{ color: ACCENT, fontSize: 13 }}>No deductions logged yet. Selling a case or a paid phone-case booking will show up here.</p>
      ) : isMobile ? (
        <div>
          {deductions.map((d, i) => (
            <div key={i} style={mcard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>{d.brand} {d.model}</div>
                  <div style={{ fontSize: 12, color: ACCENT, marginTop: 2 }}>{d.source === 'booking' ? '📅 booking' : '✋ manual'} · {d.location}{d.note ? ` · ${d.note}` : ''}</div>
                  <div style={{ fontSize: 12, color: ACCENT, marginTop: 2 }}>🕒 {fmtFull(d.time)}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: MAROON, flexShrink: 0 }}>−{d.qty}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
            <thead><tr style={{ textAlign: 'left', color: ACCENT }}>
              <Th>Time</Th><Th>Brand</Th><Th>Model</Th><Th>Shop</Th><Th>Source</Th><Th>Note</Th><Th>Qty</Th>
            </tr></thead>
            <tbody>
              {deductions.map((d, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmtFull(d.time)}</td>
                  <td style={td}>{d.brand}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{d.model}</td>
                  <td style={{ ...td, textTransform: 'capitalize' }}>{d.location}</td>
                  <td style={td}>{d.source === 'booking' ? '📅 booking' : '✋ manual'}</td>
                  <td style={{ ...td, color: ACCENT }}>{d.note || '—'}</td>
                  <td style={{ ...td, fontWeight: 800, color: MAROON }}>−{d.qty}</td>
                </tr>
              ))}
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
// Solid "sell −1" button used in the sell-by-name matches and desktop table.
const sellBtn = (on: boolean): React.CSSProperties => ({ padding: '7px 10px', background: on ? MAROON : '#E7D3DA', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: on ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' })
function fmt(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
// Full date + time for the deduction history (e.g. "24 Jul 2026, 14:30").
function fmtFull(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
