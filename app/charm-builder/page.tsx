'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Charm, DEFAULT_CHARMS, CATEGORIES } from './charms'

type Metal = 'silver' | 'gold' | 'bronze'

const BASE_PRICES: Record<number, number> = { 16: 10, 17: 10.5, 18: 11, 19: 11.5, 20: 12 }
// All metals same price — just a finish choice
const METAL_FEE: Record<Metal, number> = { silver: 0, gold: 0, bronze: 0 }

const MS: Record<Metal, { bg: string; shine: string; ib: string; lb: string; clasp: string; sb: string; btn: string; label: string; badge: string; tc: string }> = {
  silver: { bg: 'linear-gradient(145deg,#F6F6F6 0%,#E0E0E0 40%,#C8C8C8 70%,#B8B8B8 100%)', shine: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0) 55%)', ib: 'rgba(255,255,255,0.4)', lb: '#A8A8A8', clasp: 'linear-gradient(180deg,#F4F4F4 0%,#A8A8A8 100%)', sb: '#B8B8B8', btn: 'linear-gradient(135deg,#f5f5f5,#c0c0c0)', label: 'Silver', badge: 'Standard', tc: '#555' },
  gold:   { bg: 'linear-gradient(145deg,#FFF9D8 0%,#FFE566 40%,#D4A020 70%,#B8880A 100%)', shine: 'linear-gradient(180deg,rgba(255,255,220,0.6) 0%,rgba(255,255,255,0) 55%)', ib: 'rgba(255,255,180,0.5)', lb: '#C08010', clasp: 'linear-gradient(180deg,#FFFCE0 0%,#C08010 100%)', sb: '#C8900A', btn: 'linear-gradient(135deg,#fffacc,#ffd700)', label: 'Gold', badge: 'Standard', tc: '#6B4800' },
  bronze: { bg: 'linear-gradient(145deg,#F5E0B8 0%,#D09050 40%,#9C5228 70%,#7A3A18 100%)', shine: 'linear-gradient(180deg,rgba(255,230,180,0.5) 0%,rgba(255,255,255,0) 55%)', ib: 'rgba(255,210,150,0.4)', lb: '#8B4513', clasp: 'linear-gradient(180deg,#F5DEB3 0%,#8B4513 100%)', sb: '#A0522D', btn: 'linear-gradient(135deg,#f5deb3,#cd7f32)', label: 'Bronze', badge: 'Standard', tc: '#5A2800' },
}

/* Metal link image fills slot edge-to-edge */
function LinkImg({ metal }: { metal: Metal }) {
  return (
    <img
      src={`/${metal}.png`}
      alt={`${metal} link`}
      draggable={false}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'fill',
        display: 'block',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  )
}

/* Charm display — image if available, else emoji on coloured bg */
function CharmFace({ charm, size = 18 }: { charm: Charm; size?: number }) {
  if (charm.imageUrl) {
    return (
      <img
        src={charm.imageUrl}
        alt={charm.name}
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2, pointerEvents: 'none' }}
      />
    )
  }
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: charm.bg, borderRadius: 2 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg,rgba(255,255,255,0.35) 0%,transparent 55%)', pointerEvents: 'none' }} />
      <span style={{ fontSize: size, lineHeight: 1, pointerEvents: 'none', zIndex: 1, position: 'relative' }}>
        {charm.emoji}
      </span>
    </>
  )
}

/* ─── Admin Charm Editor ─────────────────────────────────────────────── */
function CharmEditor({ charms, onUpdate, onClose }: { charms: Charm[]; onUpdate: (c: Charm[]) => void; onClose: () => void }) {
  const [tab, setTab]   = useState<'browse' | 'add'>('browse')
  const [q, setQ]       = useState('')
  const [form, setForm] = useState({ name: '', category: 'Nature', price: '3.50', imageUrl: '' })
  const fileRef         = useRef<HTMLInputElement>(null)

  const shown = q
    ? charms.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.category.toLowerCase().includes(q.toLowerCase()))
    : charms

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, imageUrl: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const addCharm = () => {
    if (!form.name.trim() || !form.imageUrl) return
    onUpdate([...charms, {
      id: `custom-${Date.now()}`,
      name: form.name.trim(),
      emoji: '★',
      category: form.category,
      price: Math.max(0.5, parseFloat(form.price) || 3.5),
      bg: '#F5E8FF',
      imageUrl: form.imageUrl,
    }])
    setForm(f => ({ ...f, name: '', imageUrl: '' }))
    if (fileRef.current) fileRef.current.value = ''
    setTab('browse')
  }

  const R = 'var(--maroon,#7B1A38)'
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(61,14,30,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-baloo,sans-serif)', color: R, fontSize: 18 }}>Charm Catalog Editor</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#bbb' }}>{charms.length} charms</span>
            <button onClick={() => onUpdate(DEFAULT_CHARMS)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer', fontSize: 11, color: '#666' }}>Reset</button>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: R, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '10px 22px 0', borderBottom: '1px solid #F0E0E8', flexShrink: 0 }}>
          {(['browse', 'add'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: tab === t ? R : '#BBB', borderBottom: tab === t ? `2px solid ${R}` : '2px solid transparent', marginBottom: -1, transition: 'color 0.12s' }}>
              {t === 'browse' ? `Browse (${charms.length})` : 'Add New'}
            </button>
          ))}
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 20px' }}>
          {tab === 'browse' && (
            <>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or category…" style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(138px,1fr))', gap: 7 }}>
                {shown.map(charm => (
                  <div key={charm.id} style={{ background: charm.imageUrl ? '#F5F5F5' : charm.bg, borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {charm.imageUrl
                        ? <img src={charm.imageUrl} alt={charm.name} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                        : <span style={{ fontSize: 18, flexShrink: 0 }}>{charm.emoji}</span>
                      }
                      <span style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: R, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{charm.name}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>{charm.price.toFixed(2)}</div>
                      </span>
                    </span>
                    <button onClick={() => onUpdate(charms.filter(c => c.id !== charm.id))} style={{ background: 'rgba(123,26,56,0.14)', color: R, border: 'none', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>×</button>
                  </div>
                ))}
                {shown.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#ccc', padding: '20px 0', fontSize: 13 }}>No charms match</p>}
              </div>
            </>
          )}

          {tab === 'add' && (
            <div style={{ maxWidth: 400, margin: '0 auto' }}>
              {/* Preview */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 80, height: 80, borderRadius: 14, background: '#F5F5F5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, boxShadow: '0 4px 18px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                  {form.imageUrl
                    ? <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#ccc', fontSize: 14 }}>No image</span>
                  }
                </div>
                <div style={{ marginTop: 8, fontWeight: 700, color: R, fontSize: 14 }}>{form.name || 'Charm name'}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{(parseFloat(form.price) || 0).toFixed(2)}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Image upload */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>CHARM IMAGE</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                  />
                  {form.imageUrl && (
                    <button onClick={() => { setForm(f => ({ ...f, imageUrl: '' })); if (fileRef.current) fileRef.current.value = '' }} style={{ alignSelf: 'flex-start', fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove image</button>
                  )}
                </label>

                {/* Charm name */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>CHARM NAME</span>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Lucky Horseshoe" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 14, outline: 'none' }} />
                </label>

                {/* Category + Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>CATEGORY</span>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 13, background: '#fff', outline: 'none' }}>
                      {[...CATEGORIES, 'Custom'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>PRICE</span>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} min="0.50" step="0.50" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 14, outline: 'none' }} />
                  </label>
                </div>
              </div>

              <button
                onClick={addCharm}
                disabled={!form.name.trim() || !form.imageUrl}
                style={{ marginTop: 20, width: '100%', padding: '13px', background: (form.name.trim() && form.imageUrl) ? R : '#E0D0D4', color: (form.name.trim() && form.imageUrl) ? '#fff' : '#B0A0A4', border: 'none', borderRadius: 12, cursor: (form.name.trim() && form.imageUrl) ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-baloo,sans-serif)' }}
              >
                Add to Catalog
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 8 }}>Both a name and image are required</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
function CharmBuilderInner() {
  const searchParams          = useSearchParams()
  const { data: session }     = useSession()
  const isAdmin               = session?.user?.role === 'admin'

  const [charms, setCharms]   = useState<Charm[]>(DEFAULT_CHARMS)
  const [metal, setMetal]     = useState<Metal>('silver')
  const [numLinks, setNumLinks] = useState(18)
  const [slots, setSlots]     = useState<(Charm | null)[]>(Array(18).fill(null))
  const [activeCategory, setActiveCategory] = useState('Nature')
  const [dragState, setDragState] = useState<{ charm: Charm; fromSlot: number | null } | null>(null)
  const [dragOver, setDragOver]   = useState<number | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [payStatus, setPayStatus]   = useState<'success' | 'cancelled' | null>(null)

  // ── Inventory ──────────────────────────────────────────────────────
  const [inventory, setInventory] = useState<Record<string, number>>({})

  const fetchInventory = async () => {
    try {
      const res  = await fetch('/api/charm-inventory')
      if (res.ok) setInventory(await res.json())
    } catch {}
  }

  const adjustInventory = async (id: string, delta: number) => {
    // Optimistic local update
    setInventory(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 100) + delta) }))
    try {
      await fetch('/api/charm-inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delta }),
      })
    } catch {}
  }

  useEffect(() => {
    fetchInventory()
    const interval = setInterval(fetchInventory, 30_000)
    return () => clearInterval(interval)
  }, [])

  // ── Charm catalog ──────────────────────────────────────────────────
  useEffect(() => {
    try { const s = localStorage.getItem('oc-charms'); if (s) setCharms(JSON.parse(s)) } catch {}
  }, [])
  useEffect(() => {
    const p = searchParams?.get('payment')
    if (p === 'success') setPayStatus('success')
    else if (p === 'cancelled') setPayStatus('cancelled')
  }, [searchParams])

  const saveCharms = (c: Charm[]) => { setCharms(c); try { localStorage.setItem('oc-charms', JSON.stringify(c)) } catch {} }

  const resizeBracelet = (n: number) => {
    setNumLinks(n)
    setSlots(prev => { const next: (Charm | null)[] = Array(n).fill(null); for (let i = 0; i < Math.min(prev.length, n); i++) next[i] = prev[i]; return next })
  }

  // ── Drag + Drop ────────────────────────────────────────────────────
  const onDragStartPalette = (charm: Charm) => {
    const qty = inventory[charm.id] ?? 100
    if (qty <= 0) return   // out of stock — block drag
    setDragState({ charm, fromSlot: null })
  }
  const onDragStartSlot = (charm: Charm, i: number) => setDragState({ charm, fromSlot: i })
  const onDragOver      = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i) }
  const onDragEnd       = () => { setDragState(null); setDragOver(null) }

  const onDrop = (targetIdx: number) => {
    if (!dragState) return
    const { charm, fromSlot } = dragState
    setSlots(prev => {
      const next = [...prev]
      if (fromSlot !== null) {
        // Moving within bracelet — no inventory change
        next[targetIdx] = charm; next[fromSlot] = prev[targetIdx]
      } else {
        // New charm from palette
        const displaced = prev[targetIdx]
        next[targetIdx] = charm
        // Decrement placed charm; restore displaced charm if any
        adjustInventory(charm.id, -1)
        if (displaced) adjustInventory(displaced.id, +1)
      }
      return next
    })
    onDragEnd()
  }

  const removeSlot = (i: number) => {
    setSlots(p => {
      const n = [...p]
      const removed = n[i]
      n[i] = null
      if (removed) adjustInventory(removed.id, +1)
      return n
    })
  }

  const clearAll = () => {
    setSlots(prev => {
      prev.forEach(c => { if (c) adjustInventory(c.id, +1) })
      return Array(numLinks).fill(null)
    })
  }

  // ── Pricing ────────────────────────────────────────────────────────
  const placed     = slots.filter(Boolean) as Charm[]
  const charmTotal = placed.reduce((s, c) => s + c.price, 0)
  const basePrice  = BASE_PRICES[numLinks]
  const metalFee   = METAL_FEE[metal]
  const total      = basePrice + charmTotal + metalFee
  const hasCharms  = placed.length > 0
  const grouped    = Object.values(placed.reduce<Record<string, { charm: Charm; qty: number }>>((acc, c) => {
    acc[c.id] = acc[c.id] ? { ...acc[c.id], qty: acc[c.id].qty + 1 } : { charm: c, qty: 1 }
    return acc
  }, {}))

  const checkout = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/charm-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metal, numLinks, charms: placed.map(c => ({ id: c.id, name: c.name, price: c.price })), totalCents: Math.round(total * 100) }) })
      const data = await res.json()
      if (data.url) window.location.href = data.url; else setError(data.message || 'Checkout failed.')
    } catch { setError('Network error.') }
    finally { setLoading(false) }
  }

  const s             = MS[metal]
  const R             = 'var(--maroon,#7B1A38)'
  const visibleCharms = charms.filter(c => c.category === activeCategory)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background,#FFF0F4)', fontFamily: 'var(--font-nunito,sans-serif)' }}>

      {/* Nav */}
      <nav style={{ background: R, color: '#fff', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-baloo,sans-serif)', fontSize: 16, fontWeight: 700 }}>← OddlyCraft</Link>
        <span style={{ fontFamily: 'var(--font-baloo,sans-serif)', fontSize: 16, fontWeight: 700 }}>Italian Charm Builder</span>
        {/* Edit Charms — admin only */}
        {isAdmin && (
          <button onClick={() => setShowEditor(true)} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Edit Charms</button>
        )}
        {!isAdmin && <span style={{ width: 90 }} />}
      </nav>

      {/* Payment banners */}
      {payStatus === 'success' && (
        <div style={{ background: '#2A7B5C', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: 14, fontWeight: 700 }}>
          Order confirmed! Ships in 3-5 days.
          <button onClick={() => setPayStatus(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14 }}>×</button>
        </div>
      )}
      {payStatus === 'cancelled' && (
        <div style={{ background: '#E07040', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: 14 }}>
          Payment cancelled — your design is saved below.
          <button onClick={() => setPayStatus(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14 }}>×</button>
        </div>
      )}

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 16px 60px', display: 'grid', gridTemplateColumns: 'minmax(0,260px) minmax(0,1fr) minmax(0,290px)', gap: 18, alignItems: 'start' }}>

        {/* ── LEFT: Palette ─────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 18, padding: 16, boxShadow: '0 2px 14px rgba(123,26,56,0.08)', position: 'sticky', top: 68 }}>
          <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-baloo,sans-serif)', color: R, fontSize: 14, fontWeight: 700 }}>Charm Palette</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: activeCategory === cat ? R : '#FDE8EF', color: activeCategory === cat ? '#fff' : R, transition: 'background 0.15s' }}>{cat}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, maxHeight: 460, overflowY: 'auto', paddingRight: 2 }}>
            {visibleCharms.map(charm => {
              const qty       = inventory[charm.id] ?? 100
              const outOfStock = qty <= 0
              return (
                <div
                  key={charm.id}
                  draggable={!outOfStock}
                  onDragStart={outOfStock ? undefined : () => onDragStartPalette(charm)}
                  onDragEnd={onDragEnd}
                  title={outOfStock ? `${charm.name} — Out of stock` : charm.name}
                  style={{
                    background: charm.imageUrl ? '#F5F5F5' : charm.bg,
                    borderRadius: 8, padding: '7px 4px 5px', textAlign: 'center',
                    cursor: outOfStock ? 'not-allowed' : 'grab',
                    userSelect: 'none',
                    border: '2px solid transparent',
                    transition: 'transform 0.12s, box-shadow 0.12s, border-color 0.12s',
                    opacity: outOfStock ? 0.35 : 1,
                    filter: outOfStock ? 'grayscale(1)' : 'none',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (outOfStock) return
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = 'scale(1.05)'
                    el.style.boxShadow = '0 3px 10px rgba(123,26,56,0.16)'
                    el.style.borderColor = R
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = 'scale(1)'
                    el.style.boxShadow = 'none'
                    el.style.borderColor = 'transparent'
                  }}
                >
                  {charm.imageUrl
                    ? <img src={charm.imageUrl} alt={charm.name} style={{ width: '100%', height: 34, objectFit: 'cover', borderRadius: 4, display: 'block' }} />
                    : <div style={{ fontSize: activeCategory === 'Letters' ? 16 : 20, lineHeight: 1 }}>{charm.emoji}</div>
                  }
                  <div style={{ fontSize: 9, fontWeight: 700, color: R, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{charm.name}</div>
                  <div style={{ fontSize: 9, color: '#aaa', marginTop: 1 }}>{outOfStock ? 'Out of stock' : charm.price.toFixed(2)}</div>
                </div>
              )
            })}
            {visibleCharms.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#ddd', fontSize: 12, padding: '20px 0' }}>No charms here</p>}
          </div>
          <p style={{ fontSize: 10, color: '#ccc', margin: '10px 0 0', textAlign: 'center', lineHeight: 1.5 }}>Drag onto bracelet</p>
        </div>

        {/* ── CENTRE: Builder ───────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          {/* Metal + Size */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 2px 14px rgba(123,26,56,0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-baloo,sans-serif)', color: R, fontSize: 13, fontWeight: 700 }}>Metal Finish</h3>
              <div style={{ display: 'flex', gap: 7 }}>
                {(['silver', 'gold', 'bronze'] as Metal[]).map(m => (
                  <button key={m} onClick={() => setMetal(m)} style={{ flex: 1, padding: '9px 4px', borderRadius: 12, border: metal === m ? `3px solid ${R}` : '2px solid #E8E8E8', cursor: 'pointer', background: MS[m].btn, fontWeight: 800, fontSize: 12, color: MS[m].tc, transition: 'border-color 0.15s', transform: metal === m ? 'scale(1.04)' : 'scale(1)' }}>
                    <div>{MS[m].label}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2, opacity: 0.75 }}>{MS[m].badge}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-baloo,sans-serif)', color: R, fontSize: 13, fontWeight: 700 }}>Bracelet Size</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5 }}>
                {[16, 17, 18, 19, 20].map(n => (
                  <button key={n} onClick={() => resizeBracelet(n)} style={{ padding: '7px 2px', borderRadius: 10, border: numLinks === n ? `3px solid ${R}` : '2px solid #E8E8E8', cursor: 'pointer', background: numLinks === n ? '#FDE8EF' : '#fff', fontWeight: 800, fontSize: 13, color: R, transition: 'all 0.12s', transform: numLinks === n ? 'scale(1.05)' : 'scale(1)' }}>
                    <div>{n}</div>
                    <div style={{ fontSize: 8, fontWeight: 500, color: '#AAA' }}>{n <= 17 ? 'Sm' : n === 18 ? 'Med' : 'Lg'}</div>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 10, color: '#ccc', margin: '5px 0 0' }}>S: 16-17 links / M: 18 / L: 19-20</p>
            </div>
          </div>

          {/* Bracelet Visualiser */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '20px 18px 24px', boxShadow: '0 2px 14px rgba(123,26,56,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-baloo,sans-serif)', color: R, fontSize: 15, fontWeight: 700 }}>Your Bracelet</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#bbb' }}>{placed.length}/{numLinks} charms</span>
                <button
                  onClick={clearAll}
                  style={{ fontSize: 11, color: '#aaa', background: 'none', border: '1px solid #E8E8E8', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FDE8EF' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
                  Clear all
                </button>
              </div>
            </div>

            {/* Scroll container — no outer horizontal padding so the bracelet starts/ends flush */}
            <div style={{ overflowX: 'auto', paddingBottom: 28, paddingTop: 4 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'linear-gradient(180deg,#F6F2F4 0%,#EDE6EA 100%)',
                borderRadius: 14, overflow: 'hidden',
                padding: '14px 0',          // horizontal padding removed — links start at edge
                border: `2px solid ${s.sb}`,
                gap: 0, minWidth: 'max-content',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)',
              }}>

                {slots.map((charm, i) => (
                  <div
                    key={i}
                    draggable={!!charm}
                    onDragStart={charm ? () => onDragStartSlot(charm, i) : undefined}
                    onDragEnd={onDragEnd}
                    onDragOver={e => onDragOver(e, i)}
                    onDrop={() => onDrop(i)}
                    onDragLeave={() => setDragOver(null)}
                    style={{
                      width: 52, height: 52,
                      flexShrink: 0,
                      position: 'relative',
                      userSelect: 'none',
                      cursor: charm ? 'grab' : 'default',
                      transition: 'transform 0.1s',
                      transform: dragOver === i ? 'scale(1.08)' : 'scale(1)',
                      zIndex: dragOver === i ? 4 : 1,
                      outline: dragOver === i ? `2.5px solid ${R}` : 'none',
                      outlineOffset: '0px',
                    }}
                  >
                    {/* Metal link — always base layer */}
                    <LinkImg metal={metal} />

                    {charm && (
                      <>
                        {/* Charm covers the full link */}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}>
                          <CharmFace charm={charm} size={charm.category === 'Letters' ? 14 : 18} />
                        </div>
                        <button
                          onClick={() => removeSlot(i)}
                          style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: R, color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 7, fontWeight: 900, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.28)', lineHeight: 1 }}
                        >×</button>
                      </>
                    )}

                    <span style={{ position: 'absolute', bottom: -17, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#CCC', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                      {i + 1}
                    </span>
                  </div>
                ))}

              </div>
            </div>

            {/* Legend — removed "Charm inlaid" indicator */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4, fontSize: 11, color: '#AAA' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 20, height: 20, position: 'relative', flexShrink: 0, display: 'inline-block' }}>
                  <img src={`/${metal}.png`} alt="plain link" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                </span>
                Plain link
              </span>
              <span>Drag to reorder</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Basket ─────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 2px 14px rgba(123,26,56,0.08)', position: 'sticky', top: 68 }}>
          <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--font-baloo,sans-serif)', color: R, fontSize: 16, fontWeight: 700 }}>Your Basket</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555' }}>
              <span>Bracelet frame ({numLinks} links)</span>
              <span style={{ fontWeight: 700 }}>{basePrice.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #F4EAF0', marginTop: 12, paddingTop: 12 }}>
            {grouped.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '18px 0', color: '#DDD', fontSize: 12, lineHeight: 2 }}>
                <div style={{ fontSize: 28 }}>--</div>
                No charms added yet<br />
                <span style={{ fontSize: 10 }}>Drag from the palette to start</span>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#C0B0B8', marginBottom: 8, letterSpacing: '0.06em' }}>CHARMS ({placed.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {grouped.map(({ charm, qty }) => (
                    <div key={charm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {charm.imageUrl
                          ? <img src={charm.imageUrl} alt={charm.name} style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                          : <span style={{ fontSize: 17 }}>{charm.emoji}</span>
                        }
                        <span style={{ color: '#555' }}>{charm.name}{qty > 1 && <span style={{ color: '#bbb', fontSize: 11 }}> ×{qty}</span>}</span>
                      </span>
                      <span style={{ fontWeight: 700, color: R }}>{(charm.price * qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{ borderTop: '2px solid #FDE8EF', marginTop: 14, paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-baloo,sans-serif)', fontSize: 17, fontWeight: 800, color: R }}>Total</span>
              <span style={{ fontFamily: 'var(--font-baloo,sans-serif)', fontSize: 22, fontWeight: 800, color: R }}>{total.toFixed(2)}</span>
            </div>
            <p style={{ fontSize: 10, color: '#ccc', margin: '3px 0 0' }}>Incl. VAT, excl. shipping</p>
          </div>
          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFBBBB', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#CC0000', marginTop: 12 }}>
              {error}
            </div>
          )}
          <button
            onClick={checkout}
            disabled={loading || !hasCharms}
            style={{ width: '100%', marginTop: 14, padding: '14px', background: hasCharms ? R : '#E0D0D4', color: hasCharms ? '#fff' : '#B0A0A4', border: 'none', borderRadius: 14, cursor: hasCharms ? 'pointer' : 'not-allowed', fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-baloo,sans-serif)', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (hasCharms) { (e.currentTarget as HTMLElement).style.background = '#5C1129' } }}
            onMouseLeave={e => { if (hasCharms) { (e.currentTarget as HTMLElement).style.background = R } }}
          >
            {loading ? 'Processing…' : hasCharms ? 'Confirm & Pay' : 'Add charms to continue'}
          </button>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {['Secure checkout via Stripe', 'Handmade in Malta', 'Ships in 3-5 business days', '14-day returns'].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#BBB' }}>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showEditor && <CharmEditor charms={charms} onUpdate={saveCharms} onClose={() => setShowEditor(false)} />}
    </div>
  )
}

export default function CharmBuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--maroon,#7B1A38)' }}>Loading charm builder…</div>}>
      <CharmBuilderInner />
    </Suspense>
  )
}
