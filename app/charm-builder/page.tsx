'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
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

/* --- Admin Charm Editor --- */
function CharmEditor({
  charms,
  inventory,
  allCategories,
  onUpdate,
  onInventoryUpdate,
  onCategoriesUpdate,
  onClose,
}: {
  charms: Charm[]
  inventory: Record<string, number>
  allCategories: string[]
  onUpdate: (c: Charm[]) => void
  onInventoryUpdate: (inv: Record<string, number>) => void
  onCategoriesUpdate: (cats: string[]) => void
  onClose: () => void
}) {
  const [tab, setTab]           = useState<'browse' | 'add' | 'categories'>('browse')
  const [q, setQ]               = useState('')
  const [editingCharm, setEditingCharm] = useState<Charm | null>(null)
  const [editForm, setEditForm] = useState({ name: '', category: 'Nature', price: '3.50', imageUrl: '', quantity: '100' })
  const [addForm, setAddForm]   = useState({ name: '', category: 'Nature', price: '3.50', imageUrl: '' })
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [catSaving, setCatSaving] = useState(false)
  const [catMsg, setCatMsg]       = useState('')
  const [bulkMode, setBulkMode]   = useState(false)
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkCategory, setBulkCategory] = useState('')
  const editFileRef               = useRef<HTMLInputElement>(null)
  const addFileRef                = useRef<HTMLInputElement>(null)
  const defaultCats               = [...CATEGORIES] as string[]

  const shown = q
    ? charms.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.category.toLowerCase().includes(q.toLowerCase()))
    : charms

  const openEdit = (charm: Charm) => {
    setEditingCharm(charm)
    setEditForm({
      name:     charm.name,
      category: charm.category,
      price:    charm.price.toFixed(2),
      imageUrl: charm.imageUrl ?? '',
      quantity: String(inventory[charm.id] ?? 100),
    })
    setSaveMsg('')
  }

  const closeEdit = () => { setEditingCharm(null); setSaveMsg('') }

  const toggleBulk = () => { setBulkMode(b => { setBulkSelected(new Set()); setBulkCategory(''); return !b }) }

  const bulkApply = async () => {
    if (!bulkCategory || bulkSelected.size === 0) return
    setSaving(true); setSaveMsg('')
    const ids = [...bulkSelected]
    try {
      await Promise.all(ids.map(id => {
        const charm = charms.find(c => c.id === id)
        if (!charm) return Promise.resolve()
        return fetch('/api/charm-inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name: charm.name, category: bulkCategory, price: charm.price, imageUrl: charm.imageUrl ?? '', quantity: inventory[id] ?? 100 }),
        })
      }))
      onUpdate(charms.map(c => bulkSelected.has(c.id) ? { ...c, category: bulkCategory } : c))
      setBulkSelected(new Set()); setBulkMode(false)
      setSaveMsg(`${ids.length} charm${ids.length > 1 ? 's' : ''} moved to "${bulkCategory}" ✓`)
      setTimeout(() => setSaveMsg(''), 2500)
    } catch { setSaveMsg('Bulk update failed') }
    finally { setSaving(false) }
  }

  const handleEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setEditForm(f => ({ ...f, imageUrl: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAddForm(f => ({ ...f, imageUrl: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const saveEdit = async () => {
    if (!editingCharm || !editForm.name.trim()) return
    setSaving(true); setSaveMsg('')
    const qty   = Math.max(0, parseInt(editForm.quantity) || 0)
    const price = Math.max(0.5, parseFloat(editForm.price) || 3.5)
    try {
      const res = await fetch('/api/charm-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:       editingCharm.id,
          name:     editForm.name.trim(),
          category: editForm.category,
          price,
          imageUrl: editForm.imageUrl,
          quantity: qty,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      // Update local state
      onUpdate(charms.map(c => c.id === editingCharm.id
        ? { ...c, name: editForm.name.trim(), category: editForm.category, price, imageUrl: editForm.imageUrl || undefined }
        : c
      ))
      onInventoryUpdate({ ...inventory, [editingCharm.id]: qty })
      setSaveMsg('Saved ✓')
      setTimeout(closeEdit, 800)
    } catch {
      setSaveMsg('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteCharm = async () => {
    if (!editingCharm) return
    if (!confirm(`Delete "${editingCharm.name}"? This cannot be undone.`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/charm-inventory?id=${encodeURIComponent(editingCharm.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onUpdate(charms.filter(c => c.id !== editingCharm.id))
      const newInv = { ...inventory }; delete newInv[editingCharm.id]
      onInventoryUpdate(newInv)
      closeEdit()
    } catch {
      setSaveMsg('Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const addCharm = async () => {
    if (!addForm.name.trim() || !addForm.imageUrl) return
    setSaving(true); setSaveMsg('')
    const id    = `custom-${Date.now()}`
    const price = Math.max(0.5, parseFloat(addForm.price) || 3.5)
    try {
      const res = await fetch('/api/charm-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: addForm.name.trim(), category: addForm.category, price, imageUrl: addForm.imageUrl, quantity: 100 }),
      })
      if (!res.ok) throw new Error()
      onUpdate([...charms, { id, name: addForm.name.trim(), emoji: '★', category: addForm.category, price, bg: '#F5E8FF', imageUrl: addForm.imageUrl }])
      onInventoryUpdate({ ...inventory, [id]: 100 })
      setAddForm(f => ({ ...f, name: '', imageUrl: '' }))
      if (addFileRef.current) addFileRef.current.value = ''
      setTab('browse')
    } catch {
      setSaveMsg('Add failed')
    } finally {
      setSaving(false)
    }
  }

  const R = 'var(--maroon,#7B1A38)'

  /* ── Inline edit panel ── */
  const EditPanel = () => (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <button onClick={closeEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 13, marginBottom: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
        ← Back to browse
      </button>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 14, background: '#F5F5F5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, boxShadow: '0 4px 18px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          {editForm.imageUrl
            ? <img src={editForm.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 28 }}>{editingCharm?.emoji ?? '★'}</span>
          }
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: '#bbb' }}>ID: {editingCharm?.id}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>CHARM IMAGE</span>
          <input ref={editFileRef} type="file" accept="image/*" onChange={handleEditImage} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 13, outline: 'none', cursor: 'pointer' }} />
          {editForm.imageUrl && (
            <button onClick={() => { setEditForm(f => ({ ...f, imageUrl: '' })); if (editFileRef.current) editFileRef.current.value = '' }} style={{ alignSelf: 'flex-start', fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove image</button>
          )}
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>CHARM NAME</span>
          <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 14, outline: 'none' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>CATEGORY</span>
            <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ padding: '10px 6px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 12, background: '#fff', outline: 'none' }}>
              {allCategories.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>PRICE (€)</span>
            <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} min="0.50" step="0.50" style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 14, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>STOCK QTY</span>
            <input type="number" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))} min="0" step="1" style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 14, outline: 'none' }} />
          </label>
        </div>
      </div>
      {saveMsg && <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: saveMsg.includes('✓') ? '#2A7B5C' : '#CC0000' }}>{saveMsg}</div>}
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button
          onClick={deleteCharm}
          disabled={saving}
          style={{ flex: 1, padding: '11px', background: '#FFF0F0', color: '#CC2222', border: '1px solid #FFBBBB', borderRadius: 12, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800 }}
        >
          Delete
        </button>
        <button
          onClick={saveEdit}
          disabled={saving || !editForm.name.trim()}
          style={{ flex: 2, padding: '11px', background: (!saving && editForm.name.trim()) ? R : '#E0D0D4', color: (!saving && editForm.name.trim()) ? '#fff' : '#B0A0A4', border: 'none', borderRadius: 12, cursor: (!saving && editForm.name.trim()) ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-baloo,sans-serif)' }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(61,14,30,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-baloo,sans-serif)', color: R, fontSize: 18 }}>
            {editingCharm ? `Editing: ${editingCharm.name}` : 'Charm Catalog Editor'}
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#bbb' }}>{charms.length} charms</span>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: R, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>
        {!editingCharm && (
          <div style={{ display: 'flex', padding: '10px 22px 0', borderBottom: '1px solid #F0E0E8', flexShrink: 0 }}>
            {([
              ['browse', `Browse (${charms.length})`],
              ['add', 'Add New'],
              ['categories', 'Categories'],
            ] as [typeof tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: tab === t ? R : '#BBB', borderBottom: tab === t ? `2px solid ${R}` : '2px solid transparent', marginBottom: -1, transition: 'color 0.12s' }}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 20px' }}>
          {editingCharm ? <EditPanel /> : (
            <>
              {tab === 'browse' && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or category..." style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    <button onClick={toggleBulk} style={{ padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${bulkMode ? R : '#E8D0D8'}`, background: bulkMode ? '#FDE8EF' : '#fff', color: bulkMode ? R : '#AAA', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {bulkMode ? `✓ ${bulkSelected.size} sel.` : 'Bulk Select'}
                    </button>
                  </div>
                  {bulkMode && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', background: '#FFF0F4', borderRadius: 10, padding: '8px 12px', flexWrap: 'wrap' }}>
                      <button onClick={() => setBulkSelected(bulkSelected.size === shown.length && shown.length > 0 ? new Set() : new Set(shown.map(c => c.id)))} style={{ fontSize: 11, fontWeight: 800, color: R, background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}>
                        {bulkSelected.size === shown.length && shown.length > 0 ? 'Deselect All' : 'Select All'}
                      </button>
                      <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} style={{ flex: 1, minWidth: 110, padding: '6px 8px', borderRadius: 8, border: '1px solid #E8D0D8', fontSize: 12, outline: 'none', background: '#fff' }}>
                        <option value="">Move to category…</option>
                        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button onClick={bulkApply} disabled={saving || !bulkCategory || bulkSelected.size === 0} style={{ padding: '6px 14px', borderRadius: 8, background: (!saving && bulkCategory && bulkSelected.size > 0) ? R : '#E0D0D4', color: (!saving && bulkCategory && bulkSelected.size > 0) ? '#fff' : '#B0A0A4', border: 'none', cursor: (!saving && bulkCategory && bulkSelected.size > 0) ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {saving ? '…' : 'Apply'}
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 7 }}>
                    {shown.map(charm => (
                      <div
                        key={charm.id}
                        onClick={bulkMode ? () => setBulkSelected(prev => { const n = new Set(prev); n.has(charm.id) ? n.delete(charm.id) : n.add(charm.id); return n }) : undefined}
                        style={{ background: bulkSelected.has(charm.id) ? '#FDE8EF' : charm.imageUrl ? '#F5F5F5' : charm.bg, borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between', cursor: bulkMode ? 'pointer' : undefined, border: `2px solid ${bulkSelected.has(charm.id) ? R : 'transparent'}`, transition: 'border-color 0.1s' }}
                      >
                        {bulkMode && (
                          <input type="checkbox" readOnly checked={bulkSelected.has(charm.id)} style={{ flexShrink: 0, width: 14, height: 14, accentColor: R, cursor: 'pointer', pointerEvents: 'none' }} />
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                          {charm.imageUrl
                            ? <img src={charm.imageUrl} alt={charm.name} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                            : <span style={{ fontSize: 18, flexShrink: 0 }}>{charm.emoji}</span>
                          }
                          <span style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: R, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{charm.name}</div>
                            <div style={{ fontSize: 10, color: '#888' }}>€{charm.price.toFixed(2)} · qty {inventory[charm.id] ?? '—'}</div>
                          </span>
                        </span>
                        {!bulkMode && (
                          <button
                            onClick={() => openEdit(charm)}
                            style={{ background: 'rgba(123,26,56,0.10)', color: R, border: 'none', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 800, flexShrink: 0 }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    ))}
                    {shown.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#ccc', padding: '20px 0', fontSize: 13 }}>No charms match</p>}
                  </div>
                  {saveMsg && !editingCharm && <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: saveMsg.includes('✓') ? '#2A7B5C' : '#CC0000' }}>{saveMsg}</div>}
                </>
              )}
              {tab === 'categories' && (
                <div style={{ maxWidth: 400, margin: '0 auto' }}>
                  <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 16px' }}>
                    Add or remove any category. Built-in ones are labelled — you can still delete them.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                    {allCategories.map(cat => {
                      const isDefault = defaultCats.includes(cat)
                      return (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: isDefault ? '#F5F0FF' : '#FFF0F4', border: `1px solid ${isDefault ? '#DDD0F8' : '#F4D0DA'}` }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: R }}>{cat}</span>
                            {isDefault && <span style={{ fontSize: 9, color: '#AAA', fontWeight: 700, background: '#EEE8FF', borderRadius: 4, padding: '1px 6px', letterSpacing: '.04em' }}>BUILT-IN</span>}
                          </span>
                          <button
                            onClick={async () => {
                              if (isDefault && !confirm(`Delete built-in category "${cat}"?\n\nCharms in this category won't be removed but will need reassigning.`)) return
                              setCatSaving(true); setCatMsg('')
                              try {
                                const res = await fetch(`/api/charm-categories?name=${encodeURIComponent(cat)}`, { method: 'DELETE' })
                                if (!res.ok) throw new Error()
                                onCategoriesUpdate(allCategories.filter(c => c !== cat))
                              } catch { setCatMsg('Delete failed') }
                              finally { setCatSaving(false) }
                            }}
                            disabled={catSaving}
                            style={{ background: 'rgba(123,26,56,0.10)', color: R, border: 'none', borderRadius: 6, padding: '3px 9px', cursor: catSaving ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 800 }}
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      placeholder="New category name…"
                      style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 13, outline: 'none' }}
                    />
                    <button
                      disabled={catSaving || !newCatName.trim()}
                      onClick={async () => {
                        const name = newCatName.trim()
                        if (!name) return
                        if (allCategories.includes(name)) { setCatMsg('Already exists'); return }
                        setCatSaving(true); setCatMsg('')
                        try {
                          const res = await fetch('/api/charm-categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name }),
                          })
                          if (!res.ok) throw new Error()
                          onCategoriesUpdate([...allCategories, name])
                          setNewCatName('')
                          setCatMsg(`"${name}" added ✓`)
                          setTimeout(() => setCatMsg(''), 2000)
                        } catch { setCatMsg('Failed to add') }
                        finally { setCatSaving(false) }
                      }}
                      style={{ padding: '10px 16px', background: (newCatName.trim() && !catSaving) ? R : '#E0D0D4', color: (newCatName.trim() && !catSaving) ? '#fff' : '#B0A0A4', border: 'none', borderRadius: 10, cursor: (newCatName.trim() && !catSaving) ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}
                    >
                      {catSaving ? '…' : 'Add'}
                    </button>
                  </div>
                  {catMsg && <div style={{ marginTop: 8, fontSize: 12, color: catMsg.includes('✓') ? '#2A7B5C' : '#CC0000' }}>{catMsg}</div>}
                </div>
              )}
              {tab === 'add' && (
                <div style={{ maxWidth: 400, margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 14, background: '#F5F5F5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, boxShadow: '0 4px 18px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                      {addForm.imageUrl
                        ? <img src={addForm.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: '#ccc', fontSize: 14 }}>No image</span>
                      }
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 700, color: R, fontSize: 14 }}>{addForm.name || 'Charm name'}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{(parseFloat(addForm.price) || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>CHARM IMAGE</span>
                      <input ref={addFileRef} type="file" accept="image/*" onChange={handleAddImage} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 13, outline: 'none', cursor: 'pointer' }} />
                      {addForm.imageUrl && (
                        <button onClick={() => { setAddForm(f => ({ ...f, imageUrl: '' })); if (addFileRef.current) addFileRef.current.value = '' }} style={{ alignSelf: 'flex-start', fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove image</button>
                      )}
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>CHARM NAME</span>
                      <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Lucky Horseshoe" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 14, outline: 'none' }} />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>CATEGORY</span>
                        <select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 13, background: '#fff', outline: 'none' }}>
                          {allCategories.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.06em' }}>PRICE (€)</span>
                        <input type="number" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} min="0.50" step="0.50" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E8E0E8', fontSize: 14, outline: 'none' }} />
                      </label>
                    </div>
                  </div>
                  {saveMsg && <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#CC0000' }}>{saveMsg}</div>}
                  <button
                    onClick={addCharm}
                    disabled={saving || !addForm.name.trim() || !addForm.imageUrl}
                    style={{ marginTop: 20, width: '100%', padding: '13px', background: (!saving && addForm.name.trim() && addForm.imageUrl) ? R : '#E0D0D4', color: (!saving && addForm.name.trim() && addForm.imageUrl) ? '#fff' : '#B0A0A4', border: 'none', borderRadius: 12, cursor: (!saving && addForm.name.trim() && addForm.imageUrl) ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-baloo,sans-serif)' }}
                  >
                    {saving ? 'Saving…' : 'Add to Catalog'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 8 }}>Both a name and image are required</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* --- Main Page --- */
function CharmBuilderInner() {
  const searchParams        = useSearchParams()
  const { data: session }   = useSession()
  const isAdmin             = session?.user?.role === 'admin'

  const [charms, setCharms]         = useState<Charm[]>(DEFAULT_CHARMS)
  const [metal, setMetal]           = useState<Metal>('silver')
  const [numLinks, setNumLinks]     = useState(18)
  const [slots, setSlots]           = useState<(Charm | null)[]>(Array(18).fill(null))
  const [activeCategory, setActiveCategory] = useState('Nature')
  const [dragState, setDragState]   = useState<{ charm: Charm; fromSlot: number | null } | null>(null)
  const [dragOver, setDragOver]     = useState<number | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [payStatus, setPayStatus]   = useState<'success' | 'cancelled' | null>(null)
  const [isMobile, setIsMobile]     = useState(false)
  const [mobileTab, setMobileTab]   = useState<'palette' | 'builder' | 'basket'>('builder')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
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

  const adjustInventory = async (id: string, delta: number) => {
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

  const saveCharms = (c: Charm[]) => {
    setCharms(c)
    try { localStorage.setItem('oc-charms', JSON.stringify(c)) } catch {}
  }

  const saveInventory = (inv: Record<string, number>) => setInventory(inv)

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
    const qty = inventory[charm.id] ?? 100
    if (qty <= 0) return
    const target = selectedSlot !== null ? selectedSlot : slots.findIndex(s => s === null)
    if (target === -1) return
    setSlots(prev => {
      const n = [...prev]
      const displaced = n[target]
      n[target] = charm
      if (displaced) adjustInventory(displaced.id, +1)
      return n
    })
    adjustInventory(charm.id, -1)
    setSelectedSlot(null)
    setMobileTab('builder')
  }

  const onDragStartPalette = (charm: Charm) => {
    const qty = inventory[charm.id] ?? 100
    if (qty <= 0) return
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
        const displaced = prev[targetIdx]
        next[targetIdx] = charm
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
        {isAdmin && (
          <button onClick={() => setShowEditor(true)} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            {isMobile ? 'Edit' : 'Edit Charms'}
          </button>
        )}
        {!isAdmin && <span style={{ width: isMobile ? 24 : 90 }} />}
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
              const qty        = inventory[charm.id] ?? 100
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
                    onClick={isMobile && !touchGhost ? () => {
                      if (selectedSlot !== null && selectedSlot !== i) {
                        setSlots(prev => { const n = [...prev]; [n[i], n[selectedSlot]] = [n[selectedSlot], n[i]]; return n })
                        setSelectedSlot(null)
                      } else {
                        const next = selectedSlot === i ? null : i
                        setSelectedSlot(next)
                        if (next !== null) setMobileTab('palette')
                      }
                    } : undefined}
                    style={{
                      width: isMobile ? 44 : 52, height: isMobile ? 44 : 52,
                      flexShrink: 0,
                      position: 'relative',
                      userSelect: 'none',
                      touchAction: isMobile ? 'none' : 'auto',
                      cursor: charm ? (isMobile ? 'pointer' : 'grab') : 'default',
                      transition: 'transform 0.1s',
                      transform: dragOver === i ? 'scale(1.08)' : 'scale(1)',
                      zIndex: dragOver === i ? 4 : 1,
                      outline: isMobile && selectedSlot === i ? `3px solid ${R}` : dragOver === i ? `2.5px solid ${R}` : 'none',
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
      {showEditor && (
        <CharmEditor
          charms={charms}
          inventory={inventory}
          allCategories={allCategories}
          onUpdate={saveCharms}
          onInventoryUpdate={saveInventory}
          onCategoriesUpdate={cats => { setAllCatsState(cats); if (!cats.includes(activeCategory)) setActiveCategory(cats[0] ?? '') }}
          onClose={() => setShowEditor(false)}
        />
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
