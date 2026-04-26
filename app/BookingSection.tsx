'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface AvailabilityDate {
  id:         string
  display:    string
  day:        string
  slots:      string[]
  totalSlots: number
}

const LOCATION_INFO = {
  plaza: {
    label:   'The Plaza Sliema',
    sub:     'Level 2 · Mon–Sun · 10am–7pm',
    emoji:   '🏙️',
    tag:     'Open Daily',
    tagBg:   '#7B1A38',
    cardBg:  '#FDE8EF',
    border:  '#E8829A',
  },
  mercury: {
    label:   'Mercury Tower',
    sub:     'Level B1 · Fri 4–8pm · Sat–Sun 11am–8pm',
    emoji:   '🏢',
    tag:     'Fri + Weekend',
    tagBg:   '#2A7B5C',
    cardBg:  '#E8F9F2',
    border:  '#4BAD87',
  },
} as const
type LocationKey = keyof typeof LOCATION_INFO

const activities = [
  {
    id: 'phonecase',  name: 'Phone Case',
    price: 28, priceLabel: '€28 / person', emoji: '📱',
    desc: 'Design your own custom phone case',
    included: ['All materials & printing','Expert guidance','Take it home same day','All phone models'],
  },
  {
    id: 'bracelet',   name: 'Italian Charm Bracelet',
    price: 15, priceLabel: 'from €15 deposit', emoji: '🔗',
    desc: 'Build your bracelet from 500+ unique charms',
    included: ['Bracelet base included','Choose up to 10 charms','Expert help & advice','Gift packaging'],
  },
  {
    id: 'pencilcase', name: 'Pencil Case',
    price: 0, priceLabel: 'Booking', emoji: '✏️',
    desc: 'Personalise a pencil case that is totally yours',
    included: ['All materials','Guided session','Walk out with it done'],
  },
  {
    id: 'locket',     name: 'Locket Heart',
    price: 0, priceLabel: 'Booking', emoji: '💝',
    desc: 'A personalised locket heart — keep someone close',
    included: ['All materials','Guided session','Walk out with it done'],
  },
  {
    id: 'passportcover', name: 'Passport Cover',
    price: 0, priceLabel: 'Booking', emoji: '🛂',
    desc: 'Personalise your own passport cover',
    included: ['All materials','Guided session','Walk out with it done'],
  },
  {
    id: 'bagcharm',      name: 'Bag Charm',
    price: 0, priceLabel: 'Booking', emoji: '👜',
    desc: 'Create a unique charm for your bag',
    included: ['All materials','Guided session','Walk out with it done'],
  },
  {
    id: 'beadbracelet',  name: 'Bead Bracelet',
    price: 0, priceLabel: 'Booking', emoji: '📿',
    desc: 'Design your own bead bracelet',
    included: ['All materials','Guided session','Walk out with it done'],
  },
  {
    id: 'phonechain',    name: 'Phone Chain',
    price: 0, priceLabel: 'Booking', emoji: '📎',
    desc: 'Create a custom chain for your phone',
    included: ['All materials','Guided session','Walk out with it done'],
  },
]

type FormStatus = 'idle' | 'loading' | 'success' | 'error' | 'redirecting'

export default function BookingSection() {
  const { data: session } = useSession()

  const [selectedLocation, setSelectedLocation] = useState<LocationKey | null>(null)
  const [dates,            setDates]            = useState<AvailabilityDate[]>([])
  const [availLoading,     setAvailLoading]     = useState(false)
  const [availError,       setAvailError]       = useState(false)
  const [selectedDate,     setSelectedDate]     = useState<string | null>(null)
  const [selectedTime,     setSelectedTime]     = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [partySize,        setPartySize]        = useState(1)
  const [showForm,         setShowForm]         = useState(false)
  const [formStatus,       setFormStatus]       = useState<FormStatus>('idle')
  const [formMessage,      setFormMessage]      = useState('')

  // Fetch availability when location changes
  useEffect(() => {
    if (!selectedLocation) return
    setDates([])
    setSelectedDate(null)
    setSelectedTime(null)
    // Reset bracelet selection when switching to Mercury
    if (selectedLocation === 'mercury' && selectedActivity === 'bracelet') {
      setSelectedActivity(null)
    }
    setAvailLoading(true)
    setAvailError(false)

    fetch(`/api/availability?location=${selectedLocation}`)
      .then((r) => r.json())
      .then((data) => { if (data.dates) setDates(data.dates); else setAvailError(true) })
      .catch(() => setAvailError(true))
      .finally(() => setAvailLoading(false))
  }, [selectedLocation])

  const dateObj        = dates.find((d) => d.id === selectedDate)

  // Filter out past time slots when the selected date is today
  const todayStr      = new Date().toISOString().slice(0, 10)
  const currentHour   = new Date().getHours()
  const rawSlots      = dateObj?.slots ?? []
  const availableSlots = selectedDate === todayStr
    ? rawSlots.filter((slot) => parseInt(slot.split(':')[0], 10) > currentHour)
    : rawSlots

  // Hide Italian Charm Bracelet for Mercury location
  const visibleActivities = activities.filter((a) =>
    !(selectedLocation === 'mercury' && a.id === 'bracelet')
  )

  const activity       = visibleActivities.find((a) => a.id === selectedActivity)
  const total          = activity && activity.price > 0 ? activity.price * partySize : null
  const hasPricing     = total !== null
  const canProceed     = selectedLocation && selectedDate && selectedTime && selectedActivity
  const isLargeGroup   = partySize >= 6
  const locInfo        = selectedLocation ? LOCATION_INFO[selectedLocation] : null

  // Pre-fill contact details from session
  const sessionName  = session?.user?.name  ?? ''
  const sessionEmail = session?.user?.email ?? ''
  const sessionPhone = session?.user?.phone ?? ''
  const isLoggedIn   = !!session

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormStatus('loading')

    const fd    = new FormData(e.currentTarget)
    const name  = isLoggedIn ? sessionName  : (fd.get('name')?.toString().trim()  ?? '')
    const email = isLoggedIn ? sessionEmail : (fd.get('email')?.toString().trim() ?? '')
    const phone = isLoggedIn ? sessionPhone : (fd.get('phone')?.toString().trim() ?? '')

    const body = { type: 'booking', name, email, phone, date: selectedDate, time: selectedTime, activity: selectedActivity, partySize, location: selectedLocation }

    try {
      const res  = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()

      if (!res.ok) {
        setFormStatus('error')
        setFormMessage(data.message || 'Something went wrong.')
        return
      }

      if (data.checkoutUrl) {
        // Priced activity — redirect to Stripe
        setFormStatus('redirecting')
        setFormMessage('Redirecting to payment…')
        window.location.href = data.checkoutUrl
      } else {
        // Walk-in activity — show success
        setFormStatus('success')
        setFormMessage(data.message)
      }
    } catch {
      setFormStatus('error')
      setFormMessage('Network error. Please try again.')
    }
  }

  const stepNum = (n: number): React.CSSProperties => ({
    background: 'var(--maroon)', color: '#fff',
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 900, flexShrink: 0,
  })

  return (
    <section id="book" className="py-20 px-4" style={{ background: 'var(--blush)' }}>
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 text-white text-xs font-black rounded-full uppercase tracking-widest mb-4" style={{ background: 'var(--maroon)' }}>
            Let Us Know You're Coming ♡
          </span>
          <h2 className="text-4xl sm:text-5xl font-black mb-3" style={{ fontFamily: 'var(--font-baloo), sans-serif', color: 'var(--maroon)' }}>
            Reserve Your Spot
          </h2>
          <p className="max-w-md mx-auto font-semibold" style={{ color: 'var(--maroon-mid)' }}>
            Walk-ins welcome — registering guarantees your place and lets us prep your materials!
          </p>
        </div>

        <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: 'white' }}>

          {/* ── STEP 1: LOCATION ── */}
          <div className="p-6 sm:p-8 border-b-2" style={{ borderColor: 'var(--petal)' }}>
            <h3 className="font-black text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--maroon)' }}>
              <span style={stepNum(1)} aria-hidden="true">1</span>
              Choose a Location
            </h3>
            <div className="grid sm:grid-cols-2 gap-4" role="group" aria-label="Locations">
              {(Object.entries(LOCATION_INFO) as [LocationKey, typeof LOCATION_INFO[LocationKey]][]).map(([key, info]) => {
                const active = selectedLocation === key
                return (
                  <button
                    key={key} type="button"
                    onClick={() => setSelectedLocation(key)}
                    aria-pressed={active}
                    aria-label={`${info.label}, ${info.sub}${active ? ', selected' : ''}`}
                    className="text-left rounded-2xl border-2 p-5 transition-all cursor-pointer"
                    style={active ? { borderColor: info.tagBg, background: info.cardBg } : { borderColor: 'var(--rose)', background: 'white' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-3xl" aria-hidden="true">{info.emoji}</div>
                      <span className="text-xs font-black text-white px-2 py-0.5 rounded-full flex-none" style={{ background: info.tagBg }}>
                        {info.tag}
                      </span>
                    </div>
                    <div className="mt-2 font-black text-base" style={{ color: 'var(--maroon)' }}>{info.label}</div>
                    <div className="text-xs mt-0.5 font-semibold" style={{ color: 'var(--maroon-mid)' }}>{info.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── STEP 2: DATE ── */}
          {selectedLocation && (
            <div className="p-6 sm:p-8 border-b-2" style={{ borderColor: 'var(--petal)' }}>
              <h3 className="font-black text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--maroon)' }}>
                <span style={stepNum(2)} aria-hidden="true">2</span>
                Choose a Date
              </h3>
              {availLoading && <p className="text-sm font-semibold animate-pulse" style={{ color: 'var(--maroon-mid)' }}>Loading dates…</p>}
              {availError   && <p className="text-sm font-semibold text-red-500">Could not load dates — please refresh.</p>}
              {!availLoading && !availError && (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" role="group" aria-label="Available dates">
                  {dates.map((d) => {
                    const full   = d.slots.length === 0
                    const active = selectedDate === d.id
                    return (
                      <button
                        key={d.id} type="button"
                        disabled={full}
                        onClick={() => { setSelectedDate(d.id); setSelectedTime(null) }}
                        aria-pressed={active}
                        aria-label={`${d.day} ${d.display}${full ? ', fully booked' : `, ${d.slots.length} of ${d.totalSlots} slots free`}`}
                        className="flex-none w-24 rounded-2xl border-2 p-3 text-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={active
                          ? { borderColor: 'var(--maroon)', background: 'var(--maroon)', color: 'white' }
                          : { borderColor: 'var(--rose)', background: 'var(--blush)', color: 'var(--maroon)' }
                        }
                      >
                        <div className="text-xs font-bold uppercase tracking-wide opacity-70" aria-hidden="true">{d.day}</div>
                        <div className="text-lg font-black leading-tight" aria-hidden="true">{d.display}</div>
                        {full
                          ? <div className="text-xs font-bold text-red-400 mt-1" aria-hidden="true">Full</div>
                          : <div className={`text-xs font-semibold mt-1 ${d.slots.length <= 2 ? 'text-red-500' : 'opacity-70'}`} aria-hidden="true">
                              {d.slots.length}/{d.totalSlots}
                            </div>
                        }
                      </button>
                    )
                  })}
                  {dates.length === 0 && !availLoading && (
                    <p className="text-sm font-semibold" style={{ color: 'var(--maroon-mid)' }}>No upcoming dates found.</p>
                  )}
                </div>
              )}
              {dateObj && dateObj.slots.length <= 2 && dateObj.slots.length > 0 && (
                <p className="mt-3 text-sm font-bold text-red-500" role="alert">
                  🔥 Only {dateObj.slots.length} slot{dateObj.slots.length > 1 ? 's' : ''} left on this date!
                </p>
              )}
            </div>
          )}

          {/* ── STEP 3: TIME ── */}
          {selectedDate && (
            <div className="p-6 sm:p-8 border-b-2" style={{ borderColor: 'var(--petal)' }}>
              <h3 className="font-black text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--maroon)' }}>
                <span style={stepNum(3)} aria-hidden="true">3</span>
                Pick a Time Slot
              </h3>
              {availableSlots.length === 0
                ? <p className="text-sm font-semibold text-red-500">All slots on this date are taken. Please choose another date.</p>
                : (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Available time slots">
                    {availableSlots.map((t) => {
                      const active = selectedTime === t
                      return (
                        <button
                          key={t} type="button"
                          onClick={() => setSelectedTime(t)}
                          aria-pressed={active}
                          aria-label={`${t}${active ? ', selected' : ''}`}
                          className="px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer"
                          style={active
                            ? { background: 'var(--maroon)', borderColor: 'var(--maroon)', color: 'white' }
                            : { borderColor: 'var(--rose)', color: 'var(--maroon)', background: 'var(--blush)' }
                          }
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                )
              }
            </div>
          )}

          {/* ── STEP 4: ACTIVITY ── */}
          <div className="p-6 sm:p-8 border-b-2" style={{ borderColor: 'var(--petal)' }}>
            <h3 className="font-black text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--maroon)' }}>
              <span style={stepNum(4)} aria-hidden="true">4</span>
              What Would You Like to Make?
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" role="group" aria-label="Activities">
              {visibleActivities.map((a) => {
                const active = selectedActivity === a.id
                return (
                  <button
                    key={a.id} type="button"
                    onClick={() => setSelectedActivity(a.id)}
                    aria-pressed={active}
                    aria-label={`${a.name}, ${a.priceLabel}${active ? ', selected' : ''}`}
                    className="text-left rounded-2xl border-2 p-4 transition-all cursor-pointer"
                    style={active ? { borderColor: 'var(--maroon)', background: 'var(--blush)' } : { borderColor: 'var(--rose)', background: 'white' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-2xl mb-1" aria-hidden="true">{a.emoji}</div>
                        <div className="font-black text-sm" style={{ color: 'var(--maroon)' }}>{a.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--maroon-mid)' }}>{a.desc}</div>
                      </div>
                      <div className="text-right flex-none">
                        <div className="font-black text-sm" style={{ color: active ? 'var(--maroon)' : 'var(--maroon-mid)' }}>{a.priceLabel}</div>
                        {active && <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--maroon)' }} aria-hidden="true">✓ Selected</div>}
                      </div>
                    </div>
                    <ul className="space-y-0.5" aria-label={`Included in ${a.name}`}>
                      {a.included.map((item) => (
                        <li key={item} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--maroon-mid)' }}>
                          <span className="text-green-500 font-bold" aria-hidden="true">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── STEP 5: PARTY SIZE ── */}
          <div className="p-6 sm:p-8 border-b-2" style={{ borderColor: 'var(--petal)' }}>
            <h3 className="font-black text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--maroon)' }}>
              <span style={stepNum(5)} aria-hidden="true">5</span>
              How Many People?
            </h3>
            <div className="flex items-center gap-4" role="group" aria-label="Party size">
              <button type="button" onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                aria-label="Decrease party size"
                className="w-10 h-10 rounded-full border-2 text-xl font-black flex items-center justify-center transition cursor-pointer hover:opacity-70"
                style={{ borderColor: 'var(--maroon)', color: 'var(--maroon)' }}>−</button>
              <span className="text-3xl font-black w-8 text-center" style={{ color: 'var(--maroon)' }}
                aria-live="polite" aria-label={`${partySize} ${partySize === 1 ? 'person' : 'people'}`}>{partySize}</span>
              <button type="button" onClick={() => setPartySize((n) => Math.min(20, n + 1))}
                aria-label="Increase party size"
                className="w-10 h-10 rounded-full border-2 text-xl font-black flex items-center justify-center transition cursor-pointer hover:opacity-70"
                style={{ borderColor: 'var(--maroon)', color: 'var(--maroon)' }}>+</button>
              <span className="text-sm font-semibold ml-2" style={{ color: 'var(--maroon-mid)' }} aria-hidden="true">
                {partySize === 1 ? 'Just me' : `${partySize} people`}{partySize >= 4 && partySize < 6 ? ' 🎉' : ''}
              </span>
            </div>

            {isLargeGroup && (
              <div className="mt-4 rounded-2xl p-5 border-2" style={{ background: '#FEF9F0', borderColor: '#F5C842' }}>
                <p className="font-black text-base mb-1" style={{ color: '#7B5E00' }}>🎊 Big group? We'd love to host you!</p>
                <p className="text-sm font-semibold mb-3" style={{ color: '#9B7A10' }}>
                  For 6+ people we arrange a private session with dedicated staff. Please reach out directly to organise your experience.
                </p>
                <a
                  href="https://www.instagram.com/oddlycraft"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm text-white transition hover:opacity-90"
                  style={{ background: '#C13584' }}
                >
                  📩 DM us @oddlycraft on Instagram
                </a>
              </div>
            )}
          </div>

          {/* ── SUMMARY & CTA ── */}
          <div className="p-6 sm:p-8" style={{ background: 'var(--petal)' }}>
            {canProceed && !isLargeGroup ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div className="text-sm space-y-1" style={{ color: 'var(--maroon)' }}>
                    {locInfo && <div><span className="font-black">📍 Location:</span> {locInfo.label}</div>}
                    <div><span className="font-black">📅 Date:</span> {dateObj?.display} ({dateObj?.day})</div>
                    <div><span className="font-black">🕐 Time:</span> {selectedTime}</div>
                    <div><span className="font-black">🎨 Activity:</span> {activity?.name}</div>
                    <div><span className="font-black">👥 People:</span> {partySize}</div>
                  </div>
                  {total !== null && (
                    <div className="text-right">
                      <div className="text-sm" style={{ color: 'var(--maroon-mid)' }}>Total due now</div>
                      <div className="text-4xl font-black" style={{ color: 'var(--maroon)' }}>€{total}</div>
                      {selectedActivity === 'bracelet' && (
                        <div className="text-xs" style={{ color: 'var(--maroon-mid)' }}>+ charm selection on the day</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Logged-in user banner */}
                {isLoggedIn && (
                  <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: '#E8F9F2', border: '1.5px solid #4BAD87' }}>
                    <span className="text-xl">👤</span>
                    <div className="text-sm" style={{ color: '#1A5C3A' }}>
                      <span className="font-black">Booking as {sessionName}</span>
                      <span className="ml-2 opacity-70">({sessionEmail})</span>
                    </div>
                  </div>
                )}

                {!showForm ? (
                  <button type="button" onClick={() => setShowForm(true)}
                    className="w-full py-4 font-black text-lg rounded-2xl shadow-lg transition-all cursor-pointer text-white hover:opacity-90"
                    style={{ background: 'var(--maroon)' }}>
                    {hasPricing ? `Reserve & Pay — €${total} →` : 'Reserve My Spot ♡ →'}
                  </button>
                ) : formStatus === 'success' ? (
                  <div className="text-center py-6" role="status">
                    <div className="text-5xl mb-3" aria-hidden="true">🎉</div>
                    <p className="font-black text-lg" style={{ color: 'var(--maroon)' }}>{formMessage}</p>
                  </div>
                ) : formStatus === 'redirecting' ? (
                  <div className="text-center py-6" role="status">
                    <div className="text-5xl mb-3 animate-spin inline-block" aria-hidden="true">⏳</div>
                    <p className="font-black text-lg" style={{ color: 'var(--maroon)' }}>Taking you to payment…</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 mt-2" noValidate>

                    {/* Contact fields — hidden when logged in */}
                    {!isLoggedIn && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="booking-name" className="block text-sm font-black mb-1" style={{ color: 'var(--maroon)' }}>
                              Full Name <span aria-hidden="true">*</span>
                            </label>
                            <input id="booking-name" name="name" type="text" required autoComplete="name" placeholder="Your name"
                              className="w-full px-4 py-3 rounded-xl border-2 outline-none transition text-sm bg-white"
                              style={{ borderColor: 'var(--rose)' }}
                              onFocus={(e) => e.target.style.borderColor = 'var(--maroon)'}
                              onBlur={(e)  => e.target.style.borderColor = 'var(--rose)'} />
                          </div>
                          <div>
                            <label htmlFor="booking-email" className="block text-sm font-black mb-1" style={{ color: 'var(--maroon)' }}>
                              Email <span aria-hidden="true">*</span>
                            </label>
                            <input id="booking-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com"
                              className="w-full px-4 py-3 rounded-xl border-2 outline-none transition text-sm bg-white"
                              style={{ borderColor: 'var(--rose)' }}
                              onFocus={(e) => e.target.style.borderColor = 'var(--maroon)'}
                              onBlur={(e)  => e.target.style.borderColor = 'var(--rose)'} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="booking-phone" className="block text-sm font-black mb-1" style={{ color: 'var(--maroon)' }}>
                            Phone <span style={{ color: 'var(--maroon-mid)', fontWeight: 400 }}>(optional)</span>
                          </label>
                          <input id="booking-phone" name="phone" type="tel" autoComplete="tel" placeholder="+356 ..."
                            className="w-full px-4 py-3 rounded-xl border-2 outline-none transition text-sm bg-white"
                            style={{ borderColor: 'var(--rose)' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--maroon)'}
                            onBlur={(e)  => e.target.style.borderColor = 'var(--rose)'} />
                        </div>
                      </>
                    )}

                    {formStatus === 'error' && (
                      <div role="alert" className="px-4 py-3 rounded-xl text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                        {formMessage}
                      </div>
                    )}

                    <button type="submit" disabled={formStatus === 'loading'}
                      className="w-full py-4 font-black text-lg rounded-2xl shadow-lg transition-all cursor-pointer text-white disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
                      style={{ background: 'var(--maroon)' }}>
                      {formStatus === 'loading'
                        ? (hasPricing ? 'Creating payment…' : 'Reserving…')
                        : hasPricing
                          ? `Pay €${total} with Card →`
                          : 'Confirm Booking →'}
                    </button>

                    {hasPricing ? (
                      <p className="text-center text-xs" style={{ color: 'var(--maroon-mid)' }}>
                        🔒 Secure payment via Stripe. You'll receive an invoice by email after paying.
                      </p>
                    ) : (
                      <p className="text-center text-xs" style={{ color: 'var(--maroon-mid)' }}>
                        We'll confirm your spot within 1 hour. No payment taken yet.
                      </p>
                    )}
                  </form>
                )}
              </>
            ) : (
              <p className="text-center font-semibold py-4" style={{ color: 'var(--maroon-mid)' }}>
                {isLargeGroup ? 'For groups of 6+ please DM us on Instagram ♡' : 'Complete steps 1–5 above to reserve your spot ♡'}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
