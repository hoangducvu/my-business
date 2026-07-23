'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Charm, DEFAULT_CHARMS, CATEGORIES } from './charms'

type Metal = 'silver' | 'gold' | 'bronze'

const BASE_PRICES: Record<number, number> = { 16: 10, 17: 10.5, 18: 11, 19: 11.5, 20: 12 }
// Must match METAL_SURCHARGE in /api/charm-checkout/route.ts
const METAL_FEE: Record<Metal, number> = { silver: 0, gold: 6, bronze: 3 }

const MS: Record<Metal, { bg: string; shine: string; ib: string; lb: string; clasp: string; sb: string; btn: string; label: string; badge: string; tc: string }> = {
  silver: { bg: 'linear-gradient(145deg,#F6F6F6 0%,#E0E0E0 40%,#C8C8C8 70%,#B8B8B8 100%)', shine: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0) 55%)', ib: 'rgba(255,255,255,0.4)', lb: '#A8A8A8', clasp: 'linear-gradient(180deg,#F4F4F4 0%,#A8A8A8 100%)', sb: '#B8B8B8', btn: 'linear-gradient(135deg,#f5f5f5,#c0c0c0)', label: 'Silver', badge: 'Standard', tc: '#555' },
  gold:   { bg: 'linear-gradient(145deg,#FFF9D8 0%,#FFE566 40%,#D4A020 70%,#B8880A 100%)', shine: 'linear-gradient(180deg,rgba(255,255,220,0.6) 0%,rgba(255,255,255,0) 55%)', ib: 'rgba(255,255,180,0.5)', lb: '#C08010', clasp: 'linear-gradient(180deg,#FFFCE0 0%,#C08010 100%)', sb: '#C8900A', btn: 'linear-gradient(135deg,#fffacc,#ffd700)', label: 'Gold', badge: '+€6.00', tc: '#6B4800' },
  bronze: { bg: 'linear-gradient(145deg,#F5E0B8 0%,#D09050 40%,#9C5228 70%,#7A3A18 100%)', shine: 'linear-gradient(180deg,rgba(255,230,180,0.5) 0%,rgba(255,255,255,0) 55%)', ib: 'rgba(255,210,150,0.4)', lb: '#8B4513', clasp: 'linear-gradient(180deg,#F5DEB3 0%,#8B4513 100%)', sb: '#A0522D', btn: 'linear-gradient(135deg,#f5deb3,#cd7f32)', label: 'Bronze', badge: '+€3.00', tc: '#5A2800' },
}

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

/* --- Main Page --- */
function CharmBuilderInner() {
  const searchParams        = useSearchParams()

  const [charms, setCharms]         = useState<Charm[]>(DEFAULT_CHARMS)
  const [metal, setMetal]           = useState<Metal>('silver')
  const [numLinks, setNumLinks]     = useState(18)
  const [slots, setSlots]           = useState<(Charm | null)[]>(Array(18).fill(null))
  const [activeCategory, setActiveCategory] = useState('Nature')
  const [dragState, setDragState]   = useState<{ charm: Charm; fromSlot: number | null } | null>(null)
  const [dragOver, setDragOver]     = useState<number | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [payStatus, setPayStatus]   = useState<'success' | 'cancelled' | null>(null)
  const [isMobile, setIsMobile]     = useState(false)
  const [mobileTab, setMobileTab]   = useState<'palette' | 'builder' | 'basket'>('builder')
  const touchFromSlot = useRef<number | null>(null)
  const braceletRef = useRef<HTMLDivElement>(null)
  const slotsRef = useRef<(Charm | null)[]>([])
  const [touchGhost, setTouchGhost] = useState<{ charm: Charm; x: number; y: number } | null>(null)

  const [inventory, setInventory]       = useState<Record<string, number>>({})
  const [allCatsState, setAllCatsState] = useState<string[]>([...CATEGORIES])

  const fetchCatalog = async () => {
    try {
      const [catRes, invRes] = await Promise.all([
        fetch('/api/charm-categories'),
        fetch('/api/charm-inventory?catalog=1'),
      ])
      if (catRes.ok) {
        const catData = await catRes.json()
        if ((catData.categories as string[]).length > 0) {
          setAllCatsState(catData.categories as string[])
        }
      }
      if (invRes.ok) {
        const data = await invRes.json()
        if (data.charms?.length) {
          setCharms(data.charms)
          try { localStorage.setItem('oc-charms', JSON.stringify(data.charms)) } catch {}
        }
        if (data.inventory) setInventory(data.inventory)
      }
    } catch {}
  }

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/charm-inventory')
      if (res.ok) setInventory(await res.json())
    } catch {}
  }

  // Availability = real sheet stock minus what's currently placed on the bracelet.
  // Building never mutates the sheet; real stock is only decremented on a paid
  // order (in the Stripe webhook), so abandoned builds can't leak stock.
  const placedCount = (id: string) => slots.reduce((n, c) => n + (c?.id === id ? 1 : 0), 0)
  const available   = (id: string) => Math.max(0, (inventory[id] ?? 100) - placedCount(id))

  useEffect(() => {
    fetchCatalog()
    const interval = setInterval(fetchInventory, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { slotsRef.current = slots }, [slots])

  useEffect(() => {
    const el = braceletRef.current
    if (!el) return

    const handleStart = (e: TouchEvent) => {
      const target = (e.target as HTMLElement).closest('[data-slot]') as HTMLElement | null
      if (!target) return
      const idx = parseInt(target.dataset.slot ?? '-1')
      if (idx === -1) return
      // only drag filled slots
      const charm = slotsRef.current[idx]
      if (!charm) return
      e.preventDefault()
      touchFromSlot.current = idx
      const t = e.touches[0]
      setTouchGhost({ charm, x: t.clientX, y: t.clientY })
    }

    const handleMove = (e: TouchEvent) => {
      if (touchFromSlot.current === null) return
      e.preventDefault()
      const t = e.touches[0]
      setTouchGhost(g => g ? { ...g, x: t.clientX, y: t.clientY } : null)
    }

    const handleEnd = (e: TouchEvent) => {
      const from = touchFromSlot.current
      if (from === null) return
      touchFromSlot.current = null
      const lt = e.changedTouches[0]
      setTouchGhost(null)
      const target = document.elementFromPoint(lt.clientX, lt.clientY)
      const slotEl = (target as HTMLElement | null)?.closest('[data-slot]') as HTMLElement | null
      if (!slotEl) return
      const to = parseInt(slotEl.dataset.slot ?? '-1')
      if (to !== -1 && to !== from) {
        setSlots(prev => {
          const n = [...prev]
          ;[n[from], n[to]] = [n[to], n[from]]
          return n
        })
      }
    }

    el.addEventListener('touchstart', handleStart, { passive: false })
    el.addEventListener('touchmove', handleMove, { passive: false })
    el.addEventListener('touchend', handleEnd)
    return () => {
      el.removeEventListener('touchstart', handleStart)
      el.removeEventListener('touchmove', handleMove)
      el.removeEventListener('touchend', handleEnd)
    }
  }, [])

  // Load from localStorage as a fast initial render while API loads
  useEffect(() => {
    try { const s = localStorage.getItem('oc-charms'); if (s) setCharms(JSON.parse(s)) } catch {}
  }, [])

  useEffect(() => {
    const p = searchParams?.get('payment')
    if (p === 'success') setPayStatus('success')
    else if (p === 'cancelled') setPayStatus('cancelled')
  }, [searchParams])


  const resizeBracelet = (n: number) => {
    setNumLinks(n)
    setSlots(prev => {
      const next: (Charm | null)[] = Array(n).fill(null)
      for (let i = 0; i < Math.min(prev.length, n); i++) next[i] = prev[i]
      return next
    })
  }

  const tapToAdd = (charm: Charm) => {
    if (!isMobile) return
    if (available(charm.id) <= 0) return
    const target = slots.findIndex(s => s === null)
    if (target === -1) return
    setSlots(prev => {
      const n = [...prev]
      n[target] = charm
      return n
    })
    setMobileTab('builder')
  }

  const onDragStartPalette = (charm: Charm) => {
    if (available(charm.id) <= 0) return
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
        next[targetIdx] = charm; next[fromSlot] = prev[targetIdx]
      } else {
        next[targetIdx] = charm
      }
      return next
    })
    onDragEnd()
  }

  const removeSlot = (i: number) => {
    setSlots(p => {
      const n = [...p]
      n[i] = null
      return n
    })
  }

  const clearAll = () => {
    setSlots(Array(numLinks).fill(null))
  }

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
      const res  = await fetch('/api/charm-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metal, numLinks, charms: placed.map(c => ({ id: c.id, name: c.name, price: c.price })), layout: slots.map(c => c ? c.id : ''), totalCents: Math.round(total * 100) }) })
      const data = await res.json()
      if (data.url) window.location.href = data.url; else setError(data.message || 'Checkout failed.')
    } catch { setError('Network error.') }
    finally { setLoading(false) }
  }

  const s             = MS[metal]
  const R             = 'var(--maroon,#7B1A38)'
  const allCategories = allCatsState
  const visibleCharms = charms.filter(c => c.category === activeCategory)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background,#FFF0F4)', fontFamily: 'var(--font-nunito,sans-serif)' }}>

      <nav style={{ background: R, color: '#fff', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-baloo,sans-serif)', fontSize: 16, fontWeight: 700 }}>
          {isMobile ? '←' : '← OddlyCraft'}
        </Link>
        <span style={{ fontFamily: 'var(--font-baloo,sans-serif)', fontSize: isMobile ? 14 : 16, fontWeight: 700 }}>
          {isMobile ? 'Charm Builder' : 'Italian Charm Builder'}
        </span>
        <span style={{ width: isMobile ? 24 : 90 }} />
      </nav>

      {payStatus === 'success' && (
        <div style={{ background: '#2A7B5C', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: 14, fontWeight: 700 }}>
          Order confirmed! Ships in 3-5 days.
          <button onClick={() => setPayStatus(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14 }}>x</button>
        </div>
      )}
      {payStatus === 'cancelled' && (
        <div style={{ background: '#E07040', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: 14 }}>
          Payment cancelled - your design is saved below.
          <button onClick={() => setPayStatus(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14 }}>x</button>
        </div>
      )}

      {isMobile && (
        <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #F4D0DA', position: 'sticky', top: 52, zIndex: 100 }}>
          {([
            ['palette', '🎨', 'Charms'] as const,
            ['builder', '📿', 'Builder'] as const,
            ['basket',  '🛒', 'Basket'] as const,
          ]).map(([tab, icon, label]) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              style={{
                flex: 1, padding: '10px 4px', border: 'none', background: 'none',
                cursor: 'pointer', fontSize: 12, fontWeight: 800,
                color: mobileTab === tab ? '#7B1A38' : '#C0A0A8',
                borderBottom: mobileTab === tab ? '3px solid #7B1A38' : '3px solid transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}

      <div style={{
        maxWidth: 1360, margin: '0 auto',
        padding: isMobile ? '12px 10px 100px' : '20px 16px 60px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,260px) minmax(0,1fr) minmax(0,290px)',
        gap: 18, alignItems: 'start',
      }}>

        <div style={{
          display: isMobile && mobileTab !== 'palette' ? 'none' : undefined,
          background: '#fff', borderRadius: 18, padding: 16,
          boxShadow: '0 2px 14px rgba(123,26,56,0.08)',
          position: isMobile ? 'static' : 'sticky', top: 68,
        }}>
          <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-baloo,sans-serif)', color: R, fontSize: 14, fontWeight: 700 }}>
            Charm Palette
            {isMobile && <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginLeft: 8 }}>Tap to add</span>}
          </h2>
          <select
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #E8D0D8', fontSize: 13, background: '#FFF0F4', color: R, fontWeight: 700, outline: 'none', cursor: 'pointer', marginBottom: 12 }}
          >
            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4,1fr)' : 'repeat(3,1fr)', gap: 6, maxHeight: isMobile ? 'calc(100vh - 220px)' : 460, overflowY: 'auto', paddingRight: 2 }}>
            {visibleCharms.map(charm => {
              const qty        = available(charm.id)
              const outOfStock = qty <= 0
              return (
                <div
                  key={charm.id}
                  draggable={!outOfStock && !isMobile}
                  onDragStart={outOfStock || isMobile ? undefined : () => onDragStartPalette(charm)}
                  onDragEnd={onDragEnd}
                  onClick={!outOfStock ? () => tapToAdd(charm) : undefined}
                  title={outOfStock ? `${charm.name} - Out of stock` : charm.name}
                  style={{
                    background: charm.imageUrl ? '#F5F5F5' : charm.bg,
                    borderRadius: 8, padding: isMobile ? '6px 3px 4px' : '7px 4px 5px', textAlign: 'center',
                    cursor: outOfStock ? 'not-allowed' : isMobile ? 'pointer' : 'grab',
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
                    ? <img src={charm.imageUrl} alt={charm.name} style={{ width: '100%', height: isMobile ? 28 : 34, objectFit: 'cover', borderRadius: 4, display: 'block' }} />
                    : <div style={{ fontSize: activeCategory === 'Letters' ? (isMobile ? 13 : 16) : (isMobile ? 17 : 20), lineHeight: 1 }}>{charm.emoji}</div>
                  }
                  <div style={{ fontSize: isMobile ? 8 : 9, fontWeight: 700, color: R, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{charm.name}</div>
                  <div style={{ fontSize: isMobile ? 8 : 9, color: '#aaa', marginTop: 1 }}>{outOfStock ? 'Out of stock' : charm.price.toFixed(2)}</div>
                </div>
              )
            })}
            {visibleCharms.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#ddd', fontSize: 12, padding: '20px 0' }}>No charms here</p>}
          </div>
          {!isMobile && <p style={{ fontSize: 10, color: '#ccc', margin: '10px 0 0', textAlign: 'center', lineHeight: 1.5 }}>Drag onto bracelet</p>}
        </div>

        <div style={{ display: isMobile && mobileTab !== 'builder' ? 'none' : 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          <div style={{ background: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 2px 14px rgba(123,26,56,0.08)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 20 }}>
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

          <div style={{ background: '#fff', borderRadius: 18, padding: isMobile ? '16px 12px 20px' : '20px 18px 24px', boxShadow: '0 2px 14px rgba(123,26,56,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-baloo,sans-serif)', color: R, fontSize: 15, fontWeight: 700 }}>Your Bracelet</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#bbb' }}>{placed.length}/{numLinks} charms</span>
                <button
                  onClick={clearAll}
                  style={{ fontSize: 11, color: '#aaa', background: 'none', border: '1px solid #E8E8E8', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FDE8EF' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                >
                  Clear all
                </button>
              </div>
            </div>

            <div ref={braceletRef} style={{ overflowX: 'auto', paddingBottom: 28, paddingTop: 4 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'linear-gradient(180deg,#F6F2F4 0%,#EDE6EA 100%)',
                borderRadius: 14, overflow: 'hidden',
                padding: '14px 0',
                border: `2px solid ${s.sb}`,
                gap: 0, minWidth: 'max-content',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)',
              }}>
                {slots.map((charm, i) => (
                  <div
                    key={i}
                    draggable={!!charm && !isMobile}
                    onDragStart={charm && !isMobile ? () => onDragStartSlot(charm, i) : undefined}
                    onDragEnd={onDragEnd}
                    onDragOver={e => onDragOver(e, i)}
                    onDrop={() => onDrop(i)}
                    onDragLeave={() => setDragOver(null)}
                    data-slot={i}
                    onClick={undefined}
                    style={{
                      width: isMobile ? 44 : 52, height: isMobile ? 44 : 52,
                      flexShrink: 0,
                      position: 'relative',
                      userSelect: 'none',
                      touchAction: isMobile ? (charm ? 'none' : 'pan-x') : 'auto',
                      cursor: charm ? (isMobile ? 'pointer' : 'grab') : 'default',
                      transition: 'transform 0.1s',
                      transform: dragOver === i ? 'scale(1.08)' : 'scale(1)',
                      zIndex: dragOver === i ? 4 : 1,
                      outline: dragOver === i ? `2.5px solid ${R}` : 'none',
                      outlineOffset: '0px',
                    }}
                  >
                    <LinkImg metal={metal} />

                    {charm && (
                      <>
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                        }}>
                          <CharmFace charm={charm} size={charm.category === 'Letters' ? (isMobile ? 12 : 14) : (isMobile ? 15 : 18)} />
                        </div>
                        <button
                          onClick={() => removeSlot(i)}
                          style={{ position: 'absolute', top: isMobile ? -8 : -6, right: isMobile ? -8 : -6, width: isMobile ? 24 : 16, height: isMobile ? 24 : 16, borderRadius: '50%', background: R, color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: isMobile ? 11 : 7, fontWeight: 900, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.28)', lineHeight: 1 }}
                        >x</button>
                      </>
                    )}

                    <span style={{ position: 'absolute', bottom: -17, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#CCC', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4, fontSize: 11, color: '#AAA' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 20, height: 20, position: 'relative', flexShrink: 0, display: 'inline-block' }}>
                  <img src={`/${metal}.png`} alt="plain link" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                </span>
                Plain link
              </span>
              <span>{isMobile ? 'Tap x to remove' : 'Drag to reorder'}</span>
            </div>
          </div>
        </div>

        <div style={{
          display: isMobile && mobileTab !== 'basket' ? 'none' : undefined,
          background: '#fff', borderRadius: 18, padding: 20,
          boxShadow: '0 2px 14px rgba(123,26,56,0.08)',
          position: isMobile ? 'static' : 'sticky', top: 68,
        }}>
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
                <span style={{ fontSize: 10 }}>{isMobile ? 'Go to Charms tab to add some' : 'Drag from the palette to start'}</span>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#C0B0B8', marginBottom: 8, letterSpacing: '0.06em' }}>CHARMS ({placed.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {grouped.map(({ charm, qty }) => {
                    const lineTotal = charm.price * qty
                    return (
                      <div key={charm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          {charm.imageUrl
                            ? <img src={charm.imageUrl} alt={charm.name} style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                            : <span style={{ fontSize: 17 }}>{charm.emoji}</span>
                          }
                          <span style={{ color: '#555' }}>
                            {charm.name}
                            {qty > 1 && <span style={{ color: '#bbb', fontSize: 11 }}> x{qty}</span>}
                          </span>
                        </span>
                        <span style={{ fontWeight: 700, color: R }}>{lineTotal.toFixed(2)}</span>
                      </div>
                    )
                  })}
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
            {loading ? 'Processing...' : hasCharms ? 'Confirm & Pay' : 'Add charms to continue'}
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

      {isMobile && mobileTab === 'palette' && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 150 }}>
          <button
            onClick={() => setMobileTab('builder')}
            style={{ background: '#2A7B5C', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 24px', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 18px rgba(42,123,92,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-baloo,sans-serif)' }}
          >
            View Bracelet
          </button>
        </div>
      )}

      {isMobile && mobileTab === 'builder' && hasCharms && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 150 }}>
          <button
            onClick={() => setMobileTab('basket')}
            style={{ background: '#7B1A38', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 24px', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 18px rgba(123,26,56,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-baloo,sans-serif)' }}
          >
            View Basket - EUR {total.toFixed(2)}
          </button>
        </div>
      )}

      {touchGhost && (
        <div style={{
          position: 'fixed', left: touchGhost.x - 22, top: touchGhost.y - 22,
          width: 44, height: 44, borderRadius: 8,
          background: '#FDE8EF', border: '2px solid #7B1A38',
          zIndex: 9999, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.92, boxShadow: '0 4px 16px rgba(123,26,56,0.35)',
          transform: 'scale(1.18)',
        }}>
          <CharmFace charm={touchGhost.charm} size={touchGhost.charm.category === 'Letters' ? 12 : 15} />
        </div>
      )}
    </div>
  )
}

export default function CharmBuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--maroon,#7B1A38)' }}>Loading charm builder...</div>}>
      <CharmBuilderInner />
    </Suspense>
  )
}
