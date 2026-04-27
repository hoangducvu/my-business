import type { Metadata } from 'next'
import Image from 'next/image'
import BookingSection from './BookingSection'
import NewsletterForm from './NewsletterForm'
import OddlyCraftLogo from './OddlyCraftLogo'
import NavAuthButton from './NavAuthButton'
import MobileNav from './MobileNav'

export const metadata: Metadata = {
  title: 'OddlyCraft Malta — Customise Your Own Charms, Cases & More',
  description:
    'Walk-in craft workshop in Malta. Make your own phone case, Italian charm bracelet, pencil case, locket heart, passport cover, bag charm, bead bracelet or phone chain — no skills needed!',
}

const CDN = 'https://images.squarespace-cdn.com/content/v1/66b355473e77ee151ad26afd'

const images = {
  hero:     `${CDN}/490a20a6-3e52-4f22-b6c6-7ecc1de2bee6/First+Image+%28HP%29.png`,
  caseHold: `${CDN}/c2c3c3fd-24d5-4e4d-b6f4-20b0f1c4b910/IMG_3213.jpg`,
  caseOut:  `${CDN}/855f872f-a835-4359-923c-7d5fad7e2aa0/IMG_9974.JPG`,
  process:  `${CDN}/14d77091-ddeb-4d3d-aecb-c54c8a44c1b5/Untitled+design+%282%29.png`,
  bracelet: `${CDN}/a7d94c2b-ccf7-4985-8f1c-b47d20402560/Product+4+%28P%29.png`,
}

const products = [
  {
    id: 'phonecase',
    emoji: '📱',
    name: 'Phone Case',
    description: 'Design with shells, gems & photos — every model supported',
    price: '€28',
    tag: '✦ Most Popular',
    tagBg: '#7B1A38',
    cardBg: '#FDE8EF',
    borderColor: '#E8829A',
    priceColor: '#7B1A38',
  },
  {
    id: 'charms',
    emoji: '🔗',
    name: 'Italian Charms',
    description: 'Pick from 500+ unique charms, celebrate your story',
    price: 'from €15',
    tag: '500+ charms',
    tagBg: '#2A7B5C',
    cardBg: '#E8F9F2',
    borderColor: '#4BAD87',
    priceColor: '#2A7B5C',
  },
  {
    id: 'pencilcase',
    emoji: '✏️',
    name: 'Pencil Case',
    description: 'Personalise a pencil case that is totally yours',
    price: 'Booking',
    tag: 'Fan fave',
    tagBg: '#B07B10',
    cardBg: '#FEF6DF',
    borderColor: '#E6B830',
    priceColor: '#B07B10',
  },
  {
    id: 'locket',
    emoji: '💝',
    name: 'Locket Heart',
    description: 'Keep someone close — a locket that tells your story',
    price: 'Booking',
    tag: 'So cute ♡',
    tagBg: '#7B2A9B',
    cardBg: '#F5E8FD',
    borderColor: '#C47AE0',
    priceColor: '#7B2A9B',
  },
  {
    id: 'passportcover',
    emoji: '🛂',
    name: 'Passport Cover',
    description: 'Personalise your own passport cover — travel in style',
    price: 'Booking',
    tag: '✨ New!',
    tagBg: '#1A5C7B',
    cardBg: '#E8F4FD',
    borderColor: '#5AADD4',
    priceColor: '#1A5C7B',
  },
  {
    id: 'bagcharm',
    emoji: '👜',
    name: 'Bag Charm',
    description: 'Create a unique charm that hangs from any bag',
    price: 'Booking',
    tag: '✨ New!',
    tagBg: '#6B2A7B',
    cardBg: '#F0E8FD',
    borderColor: '#B47AE0',
    priceColor: '#6B2A7B',
  },
  {
    id: 'beadbracelet',
    emoji: '📿',
    name: 'Bead Bracelet',
    description: 'Design your own bead bracelet, bead by bead',
    price: 'Booking',
    tag: '✨ New!',
    tagBg: '#7B4A10',
    cardBg: '#FDF0E0',
    borderColor: '#E0A040',
    priceColor: '#7B4A10',
  },
  {
    id: 'phonechain',
    emoji: '📎',
    name: 'Phone Chain',
    description: 'Custom chain for your phone — style meets function',
    price: 'Booking',
    tag: '✨ New!',
    tagBg: '#3B6B1A',
    cardBg: '#EBF9E2',
    borderColor: '#7ABD50',
    priceColor: '#3B6B1A',
  },
]

const locations = [
  {
    id: 'plaza',
    name: 'The Plaza Sliema',
    level: 'Level 2',
    icon: '✨',
    hours: 'Mon – Sun  ·  10am – 7pm',
    badge: 'Open every day!',
    badgeBg: '#7B1A38',
    bg: '#FDE8EF',
  },
  {
    id: 'mercury',
    name: 'Mercury Tower',
    level: 'Level B1',
    icon: '‼️',
    hours: 'Fri 4pm–8pm  ·  Sat & Sun 11am–8pm',
    badge: 'Weekend only',
    badgeBg: '#C94870',
    bg: '#FADADD',
  },
]

const useCases = [
  { emoji: '🌟', title: 'For Yourself',    desc: 'Ditch boring cookie-cutter cases — your outfits deserve better.',  bg: '#FDE8EF', border: '#E8829A' },
  { emoji: '💑', title: 'For You Two',     desc: "No two love stories are the same — why should your cases be?",    bg: '#FEF6DF', border: '#E6B830' },
  { emoji: '🫂', title: 'For Your Besties',desc: 'Make memories that stick with matching pieces for your crew.',     bg: '#E8F9F2', border: '#4BAD87' },
  { emoji: '🎉', title: 'For Your Gang',   desc: "Unite your group's vibe with one-of-a-kind matching creations.",  bg: '#F5E8FD', border: '#C47AE0' },
  { emoji: '👨‍👩‍👧‍👦', title: 'For Family', desc: '"My kids made me this" — the best kind of gift.',              bg: '#E8F4FD', border: '#5AADD4' },
  { emoji: '🎁', title: 'As a Gift',       desc: 'Genuinely thoughtful. Genuinely unique. Walk out with it done.',  bg: '#FDE8EF', border: '#E8829A' },
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

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b-2" style={{ background: '#F9C5D0', borderColor: '#E8829A' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <a href="/" className="flex-none">
            <Image
              src="/logo-transparent.png"
              alt="OddlyCraft"
              width={773}
              height={164}
              className="h-7 sm:h-10 w-auto object-contain"
              priority
            />
          </a>

          <div className="hidden md:flex items-center gap-6 text-sm font-bold" style={{ color: '#7B1A38' }}>
            <a href="#workshops" className="hover:opacity-70 transition">What We Make</a>
            <a href="#faqs" className="hover:opacity-70 transition">FAQs</a>
            <a href="/charm-builder" className="hover:opacity-70 transition">Charm Builder</a>
            <a
              href="https://instagram.com/oddlycraft"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:opacity-70 transition"
              style={{ color: '#7B1A38' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@oddlycraft.mt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:opacity-70 transition"
              style={{ color: '#7B1A38' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NavAuthButton />
            <a
              href="#book"
              className="hidden sm:inline-flex text-xs sm:text-sm"
              style={{
                alignItems: 'center',
                padding: '8px 14px', borderRadius: '9999px',
                background: '#7B1A38', color: 'white',
                fontWeight: 900,
                textDecoration: 'none', whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(123,26,56,0.35)',
              }}
            >
              Book
            </a>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden dots-bg pt-3 pb-10 sm:pt-10 sm:pb-20 px-4" style={{ background: 'var(--blush)' }}>

        {/* Floating stickers */}
        <div className="absolute top-12 left-6  text-4xl animate-float     pointer-events-none select-none" style={{animationDelay:'0s'}}>✨</div>
        <div className="absolute top-8  right-10 text-3xl animate-float-r  pointer-events-none select-none" style={{animationDelay:'1.2s'}}>💝</div>
        <div className="absolute bottom-20 left-12 text-3xl animate-float-slow pointer-events-none select-none" style={{animationDelay:'0.6s'}}>🌸</div>
        <div className="absolute top-28 left-[38%] text-2xl animate-float pointer-events-none select-none hidden sm:block" style={{animationDelay:'2s'}}>⭐</div>
        <div className="absolute bottom-16 right-16 text-3xl animate-float-r pointer-events-none select-none" style={{animationDelay:'1.8s'}}>🎀</div>
        <div className="absolute top-16 right-1/3 text-2xl animate-float-slow pointer-events-none select-none hidden lg:block" style={{animationDelay:'0.3s'}}>🌙</div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">

          {/* Left: copy */}
          <div>
            <p className="text-sm font-black uppercase tracking-widest mb-3" style={{ color: 'var(--maroon-mid)' }}>
              walk-in craft workshop · malta
            </p>

            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] mb-4"
              style={{ fontFamily: 'var(--font-baloo), sans-serif', color: 'var(--maroon)' }}
            >
              make it.<br />
              <span style={{ color: 'var(--maroon-mid)' }}>wear it.</span><br />
              gift it ♡
            </h1>

            <p className="text-base font-semibold mb-6 max-w-sm" style={{ color: 'var(--maroon-mid)' }}>
              Eight totally customisable creations — no artistic skills needed, just bring your vibe and we'll guide you every step of the way.
            </p>

            {/* Product pills */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {['📱 Phone Case', '🔗 Italian Charms', '✏️ Pencil Case', '💝 Locket Heart', '🛂 Passport Cover', '👜 Bag Charm', '📿 Bead Bracelet', '📎 Phone Chain'].map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded-full text-xs font-black border-2"
                  style={{ borderColor: 'var(--maroon)', color: 'var(--maroon)', background: 'var(--cream)' }}
                >
                  {p}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <a
                href="#locations"
                className="inline-flex justify-center items-center px-8 py-4 font-black text-lg rounded-2xl shadow-lg transition-all text-white"
                style={{ background: 'var(--maroon)' }}
              >
                Find Us →
              </a>
              <a
                href="https://instagram.com/oddlycraft"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center gap-2 px-8 py-4 font-black text-lg rounded-2xl border-2 transition-all"
                style={{ borderColor: 'var(--maroon)', color: 'var(--maroon)', background: 'var(--cream)' }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                @oddlycraft
              </a>
            </div>

            <div className="flex flex-wrap gap-4 text-sm font-bold" style={{ color: 'var(--maroon-mid)' }}>
              <span>⭐⭐⭐⭐⭐ 200+ happy crafters</span>
              <span>🎨 No booking needed</span>
              <span>🎁 Perfect gift idea</span>
            </div>
          </div>

          {/* Right: product sticker collage */}
          <div className="relative h-[420px] sm:h-[480px] hidden sm:block">
            {/* Background blob */}
            <div
              className="absolute inset-0 rounded-full opacity-40 animate-spin-slow"
              style={{
                background: 'radial-gradient(circle at 40% 40%, var(--rose) 0%, transparent 70%)',
                transform: 'scale(1.1)',
              }}
            />

            {/* Hero photo */}
            <div className="absolute inset-8 rounded-3xl overflow-hidden shadow-2xl" style={{ border: '3px solid var(--rose)' }}>
              <Image
                src={images.hero}
                alt="OddlyCraft workshop"
                fill
                className="object-cover object-center"
                priority
                sizes="50vw"
              />
            </div>

            {/* Sticker cards — scattered and rotated */}
            <div
              className="absolute -top-4 -left-6 bg-white rounded-2xl p-3 shadow-xl text-center w-28 animate-float"
              style={{ border: '2px dashed var(--maroon)', transform: 'rotate(-8deg)', animationDelay: '0s' }}
            >
              <div className="text-3xl mb-1">📱</div>
              <div className="text-xs font-black" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-baloo)' }}>Phone Case</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--maroon-mid)' }}>€28</div>
            </div>

            <div
              className="absolute -top-2 -right-4 bg-white rounded-2xl p-3 shadow-xl text-center w-28 animate-float-r"
              style={{ border: '2px dashed var(--maroon)', transform: 'rotate(7deg)', animationDelay: '0.8s' }}
            >
              <div className="text-3xl mb-1">🔗</div>
              <div className="text-xs font-black" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-baloo)' }}>Charms</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--maroon-mid)' }}>from €15</div>
            </div>

            <div
              className="absolute bottom-0 -left-8 bg-white rounded-2xl p-3 shadow-xl text-center w-28 animate-float-slow"
              style={{ border: '2px dashed var(--maroon)', transform: 'rotate(-5deg)', animationDelay: '1.5s' }}
            >
              <div className="text-3xl mb-1">🛂</div>
              <div className="text-xs font-black" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-baloo)' }}>Passport Cover</div>
            </div>

            <div
              className="absolute bottom-4 -right-6 bg-white rounded-2xl p-3 shadow-xl text-center w-28 animate-float"
              style={{ border: '2px dashed var(--maroon)', transform: 'rotate(6deg)', animationDelay: '2.2s' }}
            >
              <div className="text-3xl mb-1">📿</div>
              <div className="text-xs font-black" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-baloo)' }}>Bead Bracelet</div>
            </div>

            <div
              className="absolute top-1/2 -right-6 bg-white rounded-2xl p-3 shadow-xl text-center w-28 animate-float-r"
              style={{ border: '2px dashed var(--maroon)', transform: 'rotate(4deg)', animationDelay: '0.4s' }}
            >
              <div className="text-3xl mb-1">💝</div>
              <div className="text-xs font-black" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-baloo)' }}>Locket Heart</div>
            </div>
          </div>
        </div>
      </section>

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

      {/* ── PRODUCTS ── */}
      <section id="workshops" className="py-20 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 text-white"
              style={{ background: 'var(--maroon)' }}
            >
              all customisable ✦
            </span>
            <h2
              className="text-4xl sm:text-5xl font-black mb-3"
              style={{ fontFamily: 'var(--font-baloo), sans-serif', color: 'var(--maroon)' }}
            >
              what will you make?
            </h2>
            <p className="max-w-md mx-auto font-semibold" style={{ color: 'var(--maroon-mid)' }}>
              Eight unique workshops — pick one, try them all. Every single one is completely yours to design ♡
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((p) => (
              <a
                key={p.id}
                href="#book"
                className="card-hover group block rounded-2xl p-3 sm:p-6 text-center transition-all"
                style={{
                  background: p.cardBg,
                  border: `3px solid ${p.borderColor}`,
                }}
              >
                <div className="text-5xl mb-3">{p.emoji}</div>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black text-white mb-2"
                  style={{ background: p.tagBg }}
                >
                  {p.tag}
                </span>
                <h3
                  className="font-black text-base mb-1 leading-tight"
                  style={{ fontFamily: 'var(--font-baloo), sans-serif', color: p.priceColor }}
                >
                  {p.name}
                </h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: p.priceColor, opacity: 0.75 }}>
                  {p.description}
                </p>
                <span className="text-lg font-black" style={{ color: p.priceColor }}>
                  {p.price}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY ── */}
      <section className="py-16 px-4" style={{ background: 'var(--blush)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-black uppercase tracking-widest mb-8" style={{ color: 'var(--maroon)' }}>
            from our workshop ♡
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { src: images.caseHold, alt: 'Custom seashell phone case' },
              { src: images.process,  alt: 'Crafting a phone case with gems' },
              { src: images.caseOut,  alt: 'Lifestyle with custom phone case' },
            ].map((img) => (
              <div
                key={img.src}
                className="relative aspect-square rounded-3xl overflow-hidden shadow-lg"
                style={{ border: '2px solid var(--rose)' }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a
              href="https://instagram.com/oddlycraft"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-black text-sm hover:opacity-70 transition"
              style={{ color: 'var(--maroon)' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              See more on @oddlycraft ↗
            </a>
          </div>
        </div>
      </section>

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
                  {loc.icon} {loc.badge}
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
                  <span className="text-xl mt-0.5">🕐</span>
                  <span className="font-black text-sm leading-relaxed" style={{ color: 'var(--maroon)' }}>
                    {loc.hours}
                  </span>
                </div>
                {/* Decorative large emoji */}
                <div
                  className="absolute -bottom-4 -right-4 text-8xl opacity-10 pointer-events-none select-none"
                  aria-hidden
                >
                  📍
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

      {/* ── USE CASES ── */}
      <section className="py-20 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-4xl sm:text-5xl font-black mb-3"
              style={{ fontFamily: 'var(--font-baloo), sans-serif', color: 'var(--maroon)' }}
            >
              who is this for?
            </h2>
            <p className="font-semibold" style={{ color: 'var(--maroon-mid)' }}>
              Honestly… everyone. But here are a few of our favourites ♡
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {useCases.map((u) => (
              <div
                key={u.title}
                className="card-hover rounded-2xl p-5 text-center"
                style={{ background: u.bg, border: `2px solid ${u.border}` }}
              >
                <div className="text-4xl mb-3">{u.emoji}</div>
                <h3 className="font-black text-sm mb-2 leading-snug" style={{ color: 'var(--maroon)' }}>
                  {u.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--maroon-mid)' }}>{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section id="faqs" className="py-20 px-4" style={{ background: 'var(--blush)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-4xl sm:text-5xl font-black mb-3"
              style={{ fontFamily: 'var(--font-baloo), sans-serif', color: 'var(--maroon)' }}
            >
              got questions? ♡
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'Do I need to book in advance?',
                a: 'Nope! We\'re a walk-in workshop — just show up during opening hours. For large groups (6+) we recommend reaching out first so we can make sure we have space.',
              },
              {
                q: 'Do I need any artistic skills?',
                a: 'None at all! Our team guides you every step of the way. Just bring your personality.',
              },
              {
                q: 'How long does a session take?',
                a: 'Phone cases take about 45–60 minutes. Charm bracelets can be as quick as 30 minutes depending on how many charms you pick. Bead bracelets, bag charms, phone chains, passport covers, pencil cases and locket hearts vary — ask us when you arrive!',
              },
              {
                q: 'Where exactly are you located?',
                a: '📍 The Plaza Sliema – Level 2 (Mon–Sun, 10am–7pm)\n📍 Mercury Tower – Level B1 (Fri 4–8pm, Sat–Sun 11am–8pm)',
              },
              {
                q: 'Can I bring my own photos?',
                a: 'Yes! For phone cases you can bring photos on your phone and we\'ll print them for you.',
              },
              {
                q: 'Do you cater for groups & hen parties?',
                a: 'Absolutely — group sessions are our favourite! Drop us a message on Instagram @oddlycraft for private packages.',
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl p-5 cursor-pointer"
                style={{ background: 'var(--cream)', border: '2px solid var(--rose)' }}
              >
                <summary
                  className="font-black list-none flex items-center justify-between"
                  style={{ color: 'var(--maroon)' }}
                >
                  {faq.q}
                  <span
                    className="text-xl group-open:rotate-45 transition-transform inline-block ml-3 flex-none font-black"
                    style={{ color: 'var(--maroon-mid)' }}
                  >
                    +
                  </span>
                </summary>
                <p
                  className="mt-3 text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: 'var(--maroon-mid)' }}
                >
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section id="newsletter" className="py-20 px-4" style={{ background: 'linear-gradient(135deg, var(--maroon) 0%, var(--maroon-mid) 100%)' }}>
        <div className="max-w-xl mx-auto text-center">
          <div className="text-5xl mb-4">🌸</div>
          <h2
            className="text-4xl sm:text-5xl font-black text-white mb-3"
            style={{ fontFamily: 'var(--font-baloo), sans-serif' }}
          >
            join the fun! ♡
          </h2>
          <p className="mb-8 font-semibold" style={{ color: 'var(--rose)' }}>
            Sign up for exclusive discounts, new charm drops, and all the quirky updates from our workshop.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-4" style={{ background: '#5C1129', color: '#F9C5D0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="mb-3">
                <Image
                  src="/logo-transparent.png"
                  alt="OddlyCraft"
                  width={773}
                  height={164}
                  className="h-14 w-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(244,191,204,0.8)' }}>
                Malta's quirkiest craft workshop. Come make something you'll love ♡
              </p>
            </div>

            <div>
              <div className="font-black mb-3 text-white">Navigate</div>
              <ul className="space-y-2 text-sm">
                {[['/', 'Home'], ['#workshops', 'What We Make'], ['#locations', 'Find Us'], ['#book', 'Walk-in'], ['#faqs', 'FAQs']].map(([href, label]) => (
                  <li key={label}>
                    <a href={href} className="hover:text-white transition" style={{ color: 'rgba(244,191,204,0.8)' }}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-black mb-3 text-white">Get in Touch</div>
              <ul className="space-y-2 text-sm" style={{ color: 'rgba(244,191,204,0.8)' }}>
                <li>
                  <a href="mailto:oddlycraftmalta@gmail.com" className="hover:text-white transition">
                    oddlycraftmalta@gmail.com
                  </a>
                </li>
                <li><a href="tel:+35699179159" className="hover:text-white transition">+356 9917 9159</a></li>
                <li><a href="tel:+35699179688" className="hover:text-white transition">+356 9917 9688</a></li>
                <li className="pt-1">
                  <a
                    href="https://instagram.com/oddlycraft"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition font-black"
                    style={{ color: 'var(--rose)' }}
                  >
                    @oddlycraft ↗
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 text-center text-sm" style={{ borderColor: 'rgba(244,191,204,0.2)', color: 'rgba(244,191,204,0.6)' }}>
            <p className="font-black mb-1" style={{ color: 'var(--rose)' }}>Thank You For Your Curiosity ♡</p>
            <p>© {new Date().getFullYear()} OddlyCraft Malta. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
