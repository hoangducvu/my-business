'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────
// ✦ UPCOMING DATES
// To add a date: copy one object, paste below the last one.
//   id        → YYYY-MM-DD (must be unique)
//   display   → short label shown on card  e.g. "Jun 6"
//   day       → day of week abbreviation   e.g. "Fri"
//   spotsLeft → remaining spots (set to 0 to show SOLD OUT)
// ─────────────────────────────────────────────
const upcomingDates = [
  { id: '2026-04-25', display: 'Apr 25', day: 'Fri', spotsLeft: 3  },
  { id: '2026-05-02', display: 'May 2',  day: 'Sat', spotsLeft: 8  },
  { id: '2026-05-09', display: 'May 9',  day: 'Fri', spotsLeft: 6  },
  { id: '2026-05-16', display: 'May 16', day: 'Sat', spotsLeft: 2  },
  { id: '2026-05-23', display: 'May 23', day: 'Fri', spotsLeft: 10 },
  // ✦ ADD MORE DATES HERE ↓
  // { id: '2026-06-06', display: 'Jun 6', day: 'Sat', spotsLeft: 12 },
]

// ─────────────────────────────────────────────
// ✦ TIME SLOTS — add or remove times here
// ─────────────────────────────────────────────
const timeSlots = ['11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']

// ─────────────────────────────────────────────
// ✦ ACTIVITIES / PRODUCTS
// To add: copy one object, paste below the last one.
//   id          → unique string
//   name        → display name
//   price       → number in euros (used for total)
//   priceLabel  → shown on card  e.g. "€28 / person"
//   emoji       → decorative icon
//   desc        → short one-liner
//   included    → bullet list shown on card
// ─────────────────────────────────────────────
const activities = [
  {
    id: 'phonecase',
    name: 'Phone Case Workshop',
    price: 28,
    priceLabel: '€28 / person',
    emoji: '📱',
    desc: 'Design & build your own custom phone case',
    included: ['All materials & printing', 'Expert guidance', 'Take it home same day', 'All phone models supported'],
  },
  {
    id: 'bracelet',
    name: 'Italian Charm Bracelet',
    price: 15,
    priceLabel: 'from €15 deposit',
    emoji: '📿',
    desc: 'Build your bracelet from 500+ unique charms',
    included: ['Bracelet base included', 'Choose up to 10 charms (€1–€6 each)', 'Expert help & advice', 'Comes in gift packaging'],
  },
  // ✦ ADD MORE ACTIVITIES HERE ↓
  // {
  //   id: 'keychain',
  //   name: 'Custom Keychain',
  //   price: 18,
  //   priceLabel: '€18 / person',
  //   emoji: '🔑',
  //   desc: 'Design a personalised keychain to keep or gift',
  //   included: ['All materials', 'Guided session', 'Ready in 30 mins'],
  // },
]

function SpotsBar({ spots }: { spots: number }) {
  const pct = Math.min(100, (spots / 12) * 100)
  const color = spots <= 2 ? '#ff6b6b' : spots <= 5 ? '#ff9f43' : '#2ecc71'
  return (
    <div className="mt-1">
      <div className="h-1.5 rounded-full bg-white/40 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function BookingSection() {
  const [selectedDate,     setSelectedDate]     = useState<string | null>(null)
  const [selectedTime,     setSelectedTime]     = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [partySize,        setPartySize]        = useState(1)
  const [showForm,         setShowForm]         = useState(false)
  const [formStatus,       setFormStatus]       = useState<FormStatus>('idle')
  const [formMessage,      setFormMessage]      = useState('')

  const activity  = activities.find((a) => a.id === selectedActivity)
  const total     = activity ? activity.price * partySize : 0
  const canProceed = selectedDate && selectedTime && selectedActivity
  const dateObj   = upcomingDates.find((d) => d.id === selectedDate)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormStatus('loading')

    const fd = new FormData(e.currentTarget)
    const body = {
      type: 'booking',
      name:      fd.get('name')?.toString().trim(),
      email:     fd.get('email')?.toString().trim(),
      phone:     fd.get('phone')?.toString().trim(),
      date:      selectedDate,
      time:      selectedTime,
      activity:  selectedActivity,
      partySize,
    }

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setFormStatus('success')
        setFormMessage(data.message)
        ;(e.target as HTMLFormElement).reset()
      } else {
        setFormStatus('error')
        setFormMessage(data.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setFormStatus('error')
      setFormMessage('Network error. Please try again.')
    }
  }

  return (
    <section id="book" className="py-20 px-4 bg-[var(--pink-light)]">
      <div className="max-w-4xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-[var(--pink)] text-white text-xs font-bold rounded-full uppercase tracking-widest mb-4">
            Book Your Session
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] mb-3">
            Pick Your Date & Craft ♡
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Sessions run daily 11:00–20:00 at{' '}
            <strong>Level B1, Mercury Tower, St. Julian's</strong>.
            Reserve your spot — they fill up fast!
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--pink)] font-bold">
            <span className="w-2 h-2 rounded-full bg-[var(--pink)] animate-pulse inline-block" />
            47 people booked in the last 30 days
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* ── STEP 1: DATE ── */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--pink)] text-white text-sm flex items-center justify-center font-black">1</span>
              Choose a Date
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {upcomingDates.map((d) => {
                const soldOut = d.spotsLeft === 0
                const active  = selectedDate === d.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => setSelectedDate(d.id)}
                    className={`flex-none w-24 rounded-2xl border-2 p-3 text-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                      ${active
                        ? 'border-[var(--pink)] bg-[var(--pink)] text-white shadow-lg'
                        : 'border-gray-200 bg-white hover:border-[var(--pink-mid)]'
                      }`}
                  >
                    <div className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-blue-100' : 'text-gray-400'}`}>
                      {d.day}
                    </div>
                    <div className="text-lg font-black leading-tight">{d.display}</div>
                    {soldOut ? (
                      <div className="text-xs font-bold text-red-400 mt-1">Sold out</div>
                    ) : (
                      <div className={`text-xs font-semibold mt-1 ${d.spotsLeft <= 3 ? 'text-red-500' : active ? 'text-blue-100' : 'text-gray-400'}`}>
                        {d.spotsLeft} left
                      </div>
                    )}
                    {!soldOut && <SpotsBar spots={d.spotsLeft} />}
                  </button>
                )
              })}
            </div>
            {dateObj && dateObj.spotsLeft <= 3 && (
              <p className="mt-3 text-sm text-red-500 font-bold flex items-center gap-1">
                🔥 Only {dateObj.spotsLeft} spots remaining — book now before it sells out!
              </p>
            )}
          </div>

          {/* ── STEP 2: TIME ── */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--pink)] text-white text-sm flex items-center justify-center font-black">2</span>
              Pick a Time Slot
            </h3>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((t) => {
                const active = selectedTime === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer
                      ${active
                        ? 'slot-active'
                        : 'border-gray-200 hover:border-[var(--pink-mid)] text-gray-700'
                      }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── STEP 3: ACTIVITY ── */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--pink)] text-white text-sm flex items-center justify-center font-black">3</span>
              What Would You Like to Make?
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {activities.map((a) => {
                const active = selectedActivity === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedActivity(a.id)}
                    className={`text-left rounded-2xl border-2 p-5 transition-all cursor-pointer
                      ${active
                        ? 'border-[var(--pink)] bg-[var(--pink-light)] shadow-md'
                        : 'border-gray-200 bg-white hover:border-[var(--pink-mid)]'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-2xl mb-1">{a.emoji}</div>
                        <div className="font-black text-base">{a.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{a.desc}</div>
                      </div>
                      <div className="text-right flex-none">
                        <div className={`font-black text-lg ${active ? 'text-[var(--pink)]' : 'text-gray-800'}`}>
                          {a.priceLabel}
                        </div>
                        {active && <div className="text-xs text-[var(--pink)] font-bold mt-0.5">✓ Selected</div>}
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {a.included.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="text-green-500 font-bold">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── STEP 4: PARTY SIZE ── */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--pink)] text-white text-sm flex items-center justify-center font-black">4</span>
              How Many People?
            </h3>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-200 text-xl font-black flex items-center justify-center hover:border-[var(--pink)] transition cursor-pointer"
              >
                −
              </button>
              <span className="text-3xl font-black w-8 text-center">{partySize}</span>
              <button
                type="button"
                onClick={() => setPartySize((n) => Math.min(dateObj?.spotsLeft ?? 10, n + 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-200 text-xl font-black flex items-center justify-center hover:border-[var(--pink)] transition cursor-pointer"
              >
                +
              </button>
              <span className="text-sm text-gray-400 ml-2">
                {partySize === 1 ? 'Just me' : `${partySize} people`}
                {partySize >= 4 && ' 🎉 Group fun!'}
              </span>
            </div>
            {partySize >= 6 && (
              <p className="mt-3 text-sm text-[var(--pink)] font-bold">
                🎊 Groups of 6+ — contact us for a private session deal!
              </p>
            )}
          </div>

          {/* ── SUMMARY & CTA ── */}
          <div className="p-6 sm:p-8 bg-gray-50">
            {canProceed ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><span className="font-bold">📅 Date:</span> {dateObj?.display} ({dateObj?.day})</div>
                    <div><span className="font-bold">🕐 Time:</span> {selectedTime}</div>
                    <div><span className="font-bold">🎨 Activity:</span> {activity?.name}</div>
                    <div><span className="font-bold">👥 People:</span> {partySize}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Estimated total</div>
                    <div className="text-4xl font-black text-[var(--pink)]">€{total}</div>
                    {selectedActivity === 'bracelet' && (
                      <div className="text-xs text-gray-400">+ charm selection on the day</div>
                    )}
                  </div>
                </div>

                {!showForm ? (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="w-full py-4 bg-[var(--yellow)] hover:bg-[var(--yellow-dark)] text-[#111827] font-black text-lg rounded-2xl shadow-lg transition-all cursor-pointer"
                  >
                    Reserve My Spot →
                  </button>
                ) : formStatus === 'success' ? (
                  <div className="text-center py-6">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="font-black text-lg text-[var(--pink)]">{formMessage}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Full Name <span className="text-[var(--pink)]">*</span>
                        </label>
                        <input
                          name="name"
                          type="text"
                          required
                          placeholder="Your name"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[var(--pink)] outline-none transition text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Email <span className="text-[var(--pink)]">*</span>
                        </label>
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[var(--pink)] outline-none transition text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Phone (optional)</label>
                      <input
                        name="phone"
                        type="tel"
                        placeholder="+356 ..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[var(--pink)] outline-none transition text-sm bg-white"
                      />
                    </div>

                    {formStatus === 'error' && (
                      <div role="alert" className="px-4 py-3 rounded-xl text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                        {formMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={formStatus === 'loading'}
                      className="w-full py-4 bg-[var(--pink)] hover:bg-[var(--pink-dark)] disabled:opacity-60 text-white font-black text-lg rounded-2xl shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      {formStatus === 'loading' ? 'Reserving…' : `Confirm Booking — €${total} →`}
                    </button>
                    <p className="text-center text-xs text-gray-400">
                      We'll confirm your spot within 1 hour. No payment taken yet.
                    </p>
                  </form>
                )}
              </>
            ) : (
              <p className="text-center text-gray-400 font-semibold py-4">
                Complete steps 1–4 above to reserve your spot ♡
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
