import type { Metadata } from 'next'
import BookingSection from './BookingSection'
import DanglingCharms from './DanglingCharms'
import FooterNewsletter from './FooterNewsletter'
import MobileNav from './MobileNav'
import ShopDropdown from './ShopDropdown'

export const metadata: Metadata = {
  title: 'OddlyCraft Malta — Customise Your Own Charms, Cases & More',
  description:
    'Walk-in craft workshop in Malta. Make your own phone case, Italian charm bracelet, locket heart, passport cover, bag charm or phone chain — no skills needed!',
}

const locations = [
  {
    id: 'plaza',
    name: 'The Plaza Sliema',
    level: 'Level 2',
    icon: '',
    hours: 'Mon – Sun  ·  10am – 7pm',
    badge: 'Open every day!',
    badgeBg: '#005CFF',
    bg: '#FAF5D8',
  },
  {
    id: 'mercury',
    name: 'Mercury Tower',
    level: 'Level B1',
    icon: '',
    hours: 'Fri 4pm–8pm  ·  Sat & Sun 11am–8pm',
    badge: 'Weekend only',
    badgeBg: '#2F6FE0',
    bg: '#FAF4DA',
  },
]

const marqueeItems = [
  'make it yours ✦', 'wear it daily ✦', 'gift with love ✦',
  'no skills needed ✦', 'all customisable ✦', 'walk in anytime ✦',
  'malta made ✦', 'dream it ✦',
]

export default function HomePage() {
  const doubled = [...marqueeItems, ...marqueeItems]

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)', fontFamily: 'var(--font-nunito), sans-serif' }}>

      {/* ── NAV (store awning) ── */}
      <nav className="sticky top-0 z-50">
        <DanglingCharms />
        {/* Thin striped awning with scalloped bottom edge */}
        <div
          className="relative h-5"
          style={{ background: 'repeating-linear-gradient(90deg, #feffd7 0 56px, #fae8a2 56px 112px)' }}
        >
          <div
            aria-hidden
            className="absolute left-0 right-0 top-full h-7 pointer-events-none"
            style={{
              backgroundImage: 'url(/scallops.svg)',
              backgroundRepeat: 'repeat-x',
              backgroundSize: '112px 28px',
              backgroundPosition: 'left top',
            }}
          />
        </div>

        {/* Controls row (below the canopy) + centred badge hanging outside it */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between gap-2 sm:gap-4">

          {/* Left: Shop dropdown (desktop) + hamburger (mobile) */}
          <div className="flex-1 flex items-center justify-start">
            <div className="hidden md:block">
              <ShopDropdown />
            </div>
            <MobileNav />
          </div>

          {/* Right: customer account + shopping basket */}
          <div className="flex-1 flex items-center justify-end gap-5 sm:gap-6">
            {/* Customer account */}
            <a
              href="#account"
              aria-label="Account"
              className="inline-flex items-center"
              style={{ color: '#005CFF', textDecoration: 'none' }}
            >
              <svg width="29" height="29" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z" />
              </svg>
            </a>
            {/* Shopping basket */}
            <a
              href="#book"
              aria-label="Shopping basket"
              className="inline-flex items-center"
              style={{ color: '#005CFF', textDecoration: 'none' }}
            >
              <svg width="31" height="31" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.21 9l-4.38-6.56c-.19-.28-.51-.42-.83-.42-.32 0-.64.14-.83.43L6.79 9H2c-.55 0-1 .45-1 1 0 .09.01.18.04.27l2.54 9.27c.23.84 1 1.46 1.92 1.46h13c.92 0 1.69-.62 1.93-1.46l2.54-9.27L23 10c0-.55-.45-1-1-1h-4.79zM9 9l3-4.4L15 9H9zm3 8c-1.1 0-2-.9-2-2 0-1.1.9-2 2-2s2 .9 2 2c0 1.1-.9 2-2 2z" />
              </svg>
            </a>
          </div>

          {/* Centred brand badge — blue, sitting fully below the awning */}
          <a
            href="/"
            aria-label="OddlyCraft home"
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: '32px' }}
          >
            <span
              className="relative inline-flex items-center justify-center h-16 sm:h-[4.5rem]"
              style={{
                aspectRatio: '1.58 / 1',
                background: '#005CFF',
                borderRadius: '50%',
                boxShadow: '0 8px 20px rgba(0,92,255,0.28)',
              }}
            >
              {/* cream ring */}
              <span
                aria-hidden
                className="absolute rounded-[50%]"
                style={{ inset: '7%', border: '2px solid #FEFFD7' }}
              />
              {/* stacked wordmark, recoloured cream */}
              <span
                role="img"
                aria-label="OddlyCraft"
                className="relative block h-[52%]"
                style={{
                  width: 'auto', aspectRatio: '527 / 333',
                  backgroundColor: '#FEFFD7',
                  WebkitMaskImage: 'url(/logo-stacked.png)',
                  maskImage: 'url(/logo-stacked.png)',
                  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center', maskPosition: 'center',
                  WebkitMaskSize: 'contain', maskSize: 'contain',
                }}
              />
            </span>
          </a>
        </div>
      </nav>

      {/* ── MARQUEE ── */}
      <div
        className="overflow-hidden py-4 border-y-2"
        style={{ background: 'var(--maroon)', borderColor: 'var(--maroon-dark)' }}
        aria-hidden
      >
        <div className="animate-marquee">
          {doubled.map((text, i) => (
            <span
              key={i}
              className="inline-block px-10 font-black text-base uppercase tracking-widest whitespace-nowrap"
              style={{ color: 'var(--rose)', fontFamily: 'var(--font-baloo), sans-serif' }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── LOCATIONS ── */}
      <section id="locations" className="py-20 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-4xl sm:text-5xl font-black mb-3"
              style={{ fontFamily: 'var(--font-baloo), sans-serif', color: 'var(--maroon)' }}
            >
              walk in & create ♡
            </h2>
            <p className="font-semibold" style={{ color: 'var(--maroon-mid)' }}>
              No booking needed — just show up and start making
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="card-hover rounded-3xl p-8 relative overflow-hidden"
                style={{ background: loc.bg, border: '2px solid var(--rose)' }}
              >
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-black text-white mb-4"
                  style={{ background: loc.badgeBg }}
                >
                  {loc.badge}
                </span>
                <h3
                  className="text-2xl font-black mb-1"
                  style={{ fontFamily: 'var(--font-baloo), sans-serif', color: 'var(--maroon)' }}
                >
                  {loc.name}
                </h3>
                <p className="font-bold text-sm mb-4" style={{ color: 'var(--maroon-mid)' }}>
                  {loc.level}
                </p>
                <div
                  className="flex items-start gap-3 rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                >
                  <span className="text-xl mt-0.5"></span>
                  <span className="font-black text-sm leading-relaxed" style={{ color: 'var(--maroon)' }}>
                    {loc.hours}
                  </span>
                </div>
                {/* Decorative large emoji */}
                <div
                  className="absolute -bottom-4 -right-4 text-8xl opacity-10 pointer-events-none select-none"
                  aria-hidden
                >
                 
                </div>
              </div>
            ))}
          </div>

          <p className="text-center mt-6 text-sm font-bold" style={{ color: 'var(--maroon-mid)' }}>
            Can't make it? DM us on{' '}
            <a
              href="https://instagram.com/oddlycraft"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--maroon)' }}
            >
              @oddlycraft
            </a>
            {' '}and we'll sort something out ♡
          </p>
        </div>
      </section>

      {/* ── BOOKING ── */}
      <BookingSection />

      {/* ── FOOTER ── */}
      <footer className="pt-16 pb-8" style={{ background: '#FFEA6D', color: '#005CFF' }}>
        <div className="w-full px-6 sm:px-12 lg:px-20">

          {/* Big serif tagline — one line, thin, stretched full width */}
          <h2
            className="mb-14 whitespace-nowrap text-center"
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              color: '#005CFF',
              fontWeight: 400,
              lineHeight: 1,
              fontSize: 'clamp(1rem, 6.6vw, 7.5rem)',
            }}
          >
            Thank you for your curiosity.
          </h2>

          {/* Logo + columns + newsletter */}
          <div className="grid gap-y-12 gap-x-8 lg:grid-cols-[auto_1fr_1fr_1fr_1.4fr] mb-16 items-start">

            {/* Logo mark */}
            <div className="flex items-start">
              <span
                role="img"
                aria-label="OddlyCraft"
                className="block h-20 sm:h-28"
                style={{
                  width: 'auto', aspectRatio: '527 / 333',
                  backgroundColor: '#005CFF',
                  WebkitMaskImage: 'url(/logo-stacked.png)',
                  maskImage: 'url(/logo-stacked.png)',
                  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'left center', maskPosition: 'left center',
                  WebkitMaskSize: 'contain', maskSize: 'contain',
                }}
              />
            </div>

            {/* Visit Us */}
            <div>
              <div className="text-lg font-black uppercase tracking-wide mb-5">Visit Us</div>
              <div className="space-y-4 text-base font-semibold leading-relaxed">
                <p>
                  The Plaza Sliema — Level 2<br />
                  Sliema, Malta
                </p>
                <p>
                  Mercury Tower — Level B1<br />
                  St Julian's, Malta
                </p>
                <p>10am – 7pm daily</p>
              </div>
            </div>

            {/* Explore */}
            <div>
              <div className="text-lg font-black uppercase tracking-wide mb-5">Explore</div>
              <ul className="space-y-4 text-base font-semibold">
                {[['/', 'Home'], ['#locations', 'Find Us'], ['#book', 'Book a Session'], ['/charm-builder', 'Charm Builder']].map(([href, label]) => (
                  <li key={label}>
                    <a href={href} className="hover:opacity-60 transition">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Let's Talk Shop */}
            <div>
              <div className="text-lg font-black uppercase tracking-wide mb-5">Let&apos;s Talk Shop</div>
              <div className="space-y-4 text-base font-semibold leading-relaxed">
                <p>
                  Questions? Comments?<br />
                  Email us!<br />
                  <a href="mailto:oddlycraftmalta@gmail.com" className="hover:opacity-60 transition break-all">oddlycraftmalta@gmail.com</a>
                </p>
                <p>
                  Give us a call!<br />
                  <a href="tel:+35699179159" className="hover:opacity-60 transition">+356 9917 9159</a>
                </p>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-base font-semibold leading-relaxed mb-5 max-w-xs">
                Join 200+ other crafters who already get our emails — first dibs on new drops, events &amp; workshops.
              </p>
              <FooterNewsletter />
            </div>
          </div>

          {/* Wavy divider — animated scroll (left → right), full-bleed */}
          <div className="wave-scroll mb-6 -mx-6 sm:-mx-12 lg:-mx-20" aria-hidden="true" />

          {/* Bottom bar: policies + socials */}
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-black uppercase tracking-widest">
              <li><a href="#" className="hover:opacity-60 transition">Refund Policy</a></li>
              <li><a href="#" className="hover:opacity-60 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:opacity-60 transition">Terms of Service</a></li>
            </ul>

            {/* Social icons — centered */}
            <div className="flex items-center gap-6 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
              <a href="https://instagram.com/oddlycraft" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-60 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@oddlycraft.mt" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:opacity-60 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
                </svg>
              </a>
            </div>

            <p className="text-xs font-bold opacity-70 sm:text-right">© {new Date().getFullYear()} OddlyCraft Malta</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
