import Link from 'next/link'
import OddlyCraftLogo from './OddlyCraftLogo'
import MobileNav from './MobileNav'
import { DEFAULT_CHARMS } from './charm-builder/charms'

const MAROON = '#7B1A38'

// A hand-picked spread of charms for the showcase grid
const SHOWCASE = [
  'blossom', 'butterfly', 'moon', 'star', 'heart', 'crystal', 'crown', 'diamond',
  'music', 'travel', 'coffee', 'cat', 'rainbow', 'clover', 'lightning', 'anchor',
  'letter-A', 'letter-B', 'aries', 'leo', 'sun', 'key', 'infinity', 'peace',
]
  .map(id => DEFAULT_CHARMS.find(c => c.id === id))
  .filter(Boolean) as typeof DEFAULT_CHARMS

const STEPS = [
  { icon: '⚙️', title: 'Pick your metal', body: 'Silver, gold, or bronze — choose the finish and how many links your bracelet has.' },
  { icon: '🔗', title: 'Add your charms', body: 'Drag charms onto your bracelet. Mix hearts, letters, zodiac signs — make it yours.' },
  { icon: '📦', title: 'Checkout & ship', body: 'Pay securely with card. We handcraft it in Malta and post it to your door.' },
]

const METALS = [
  { name: 'Silver', emoji: '🥈', note: 'Standard finish', img: '/silver.png' },
  { name: 'Gold',   emoji: '🥇', note: '+€6.00',          img: '/gold.png' },
  { name: 'Bronze', emoji: '🥉', note: '+€3.00',          img: '/bronze.png' },
]

const FAQS = [
  { q: 'How much does a bracelet cost?', a: 'The base bracelet starts at €10 (depending on the number of links), plus €2.50–€4.50 per charm and an optional metal upgrade. You see the exact total live as you build.' },
  { q: 'Do I need any crafting skills?', a: 'None at all. Our online builder does the work — just pick a metal, drag on the charms you love, and check out.' },
  { q: 'How long does delivery take?', a: 'Each bracelet is handmade to order in Malta and typically ships within 3–5 days.' },
  { q: 'Can I design a gift?', a: 'Absolutely — spell out a name with letter charms, match someone’s zodiac sign, or theme it to their hobbies. It makes a lovely personalised gift.' },
]

export default function Home() {
  return (
    <main className="flex-1" style={{ background: 'var(--background)', fontFamily: 'var(--font-nunito,sans-serif)', color: '#3D0E1E' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,240,244,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #F4D0DA' }}>
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1120, height: 56, padding: '0 16px' }}>
          <Link href="/" aria-label="OddlyCraft home" style={{ display: 'flex', alignItems: 'center' }}>
            <OddlyCraftLogo className="h-6 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-bold" style={{ color: MAROON }}>
            <a href="#how" className="hover:opacity-70 transition">How It Works</a>
            <a href="#charms" className="hover:opacity-70 transition">Charms</a>
            <a href="#faqs" className="hover:opacity-70 transition">FAQs</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/charm-builder"
              className="hidden sm:inline-flex text-xs sm:text-sm"
              style={{ alignItems: 'center', padding: '8px 16px', borderRadius: 9999, background: MAROON, color: '#fff', fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(123,26,56,0.35)' }}
            >
              Design Yours →
            </Link>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden dots-bg" style={{ background: 'var(--blush)', padding: '48px 16px 72px' }}>
        <div className="absolute text-4xl animate-float select-none" style={{ top: 40, left: 24, animationDelay: '0s' }}>✨</div>
        <div className="absolute text-3xl animate-float-r select-none" style={{ top: 28, right: 36, animationDelay: '1.2s' }}>💝</div>
        <div className="absolute text-3xl animate-float-slow select-none" style={{ bottom: 60, left: 40, animationDelay: '0.6s' }}>🌸</div>
        <div className="absolute text-2xl animate-float select-none hidden sm:block" style={{ top: 96, left: '40%', animationDelay: '2s' }}>⭐</div>
        <div className="absolute text-3xl animate-float-r select-none" style={{ bottom: 48, right: 48, animationDelay: '1.8s' }}>🎀</div>

        <div className="mx-auto text-center relative" style={{ maxWidth: 760 }}>
          <span style={{ display: 'inline-block', background: '#fff', color: MAROON, fontWeight: 800, fontSize: 12, letterSpacing: '.08em', padding: '6px 14px', borderRadius: 9999, boxShadow: '0 2px 8px rgba(123,26,56,0.10)' }}>
            🇲🇹 HANDMADE IN MALTA · SHIPPED TO YOU
          </span>
          <h1 style={{ margin: '20px 0 0', fontFamily: 'var(--font-baloo,sans-serif)', fontWeight: 800, color: MAROON, fontSize: 'clamp(34px,7vw,60px)', lineHeight: 1.05 }}>
            Design your own<br />Italian charm bracelet
          </h1>
          <p style={{ margin: '18px auto 0', maxWidth: 520, fontSize: 17, color: '#6B3345', lineHeight: 1.6 }}>
            Pick your metal, choose your links, and add the charms that tell your story. No skills needed — just your vibe. Build it in minutes.
          </p>
          <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/charm-builder" style={{ padding: '15px 30px', borderRadius: 9999, background: MAROON, color: '#fff', fontWeight: 900, fontSize: 17, textDecoration: 'none', boxShadow: '0 6px 18px rgba(123,26,56,0.30)' }}>
              🔗 Start designing
            </Link>
            <a href="#how" style={{ padding: '15px 26px', borderRadius: 9999, background: '#fff', color: MAROON, fontWeight: 800, fontSize: 16, textDecoration: 'none', border: '2px solid #F4D0DA' }}>
              How it works
            </a>
          </div>
          <p style={{ marginTop: 18, fontSize: 13, color: '#9B3A54', fontWeight: 700 }}>
            ⭐⭐⭐⭐⭐ Loved by 200+ crafters · from €10
          </p>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ background: MAROON, overflow: 'hidden', padding: '12px 0' }}>
        <div className="animate-marquee" style={{ display: 'inline-flex', whiteSpace: 'nowrap', gap: 28, color: '#F4BFCC', fontWeight: 900, fontSize: 14, letterSpacing: '.05em' }}>
          {Array.from({ length: 2 }).flatMap((_, r) =>
            ['DREAM IT ♡', 'DESIGN IT ♡', 'WEAR IT ♡', 'GIFT IT ♡', 'ALL CUSTOMISABLE ♡', 'MALTA MADE ♡', 'NO SKILLS NEEDED ♡'].map((t, i) => (
              <span key={`${r}-${i}`}>{t}</span>
            ))
          )}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 16px 24px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-baloo,sans-serif)', fontWeight: 800, color: MAROON, fontSize: 'clamp(26px,5vw,38px)', margin: 0 }}>
          Three steps to your bracelet
        </h2>
        <p style={{ textAlign: 'center', color: '#6B3345', margin: '10px 0 40px', fontSize: 16 }}>Easy enough for anyone. Fun enough to do twice.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
          {STEPS.map((s, i) => (
            <div key={s.title} style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', textAlign: 'center', boxShadow: '0 2px 20px rgba(123,26,56,0.07)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, right: 18, fontWeight: 900, color: '#F4D0DA', fontSize: 22 }}>{i + 1}</div>
              <div style={{ fontSize: 40 }}>{s.icon}</div>
              <h3 style={{ margin: '12px 0 8px', color: MAROON, fontWeight: 800, fontSize: 19 }}>{s.title}</h3>
              <p style={{ margin: 0, color: '#6B3345', fontSize: 15, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CHARM SHOWCASE ── */}
      <section id="charms" style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 16px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-baloo,sans-serif)', fontWeight: 800, color: MAROON, fontSize: 'clamp(26px,5vw,38px)', margin: 0 }}>
          100+ charms to choose from
        </h2>
        <p style={{ textAlign: 'center', color: '#6B3345', margin: '10px 0 32px', fontSize: 16 }}>Nature, symbols, zodiac, letters and more — here&apos;s a taste.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(80px,1fr))', gap: 12 }}>
          {SHOWCASE.map(c => (
            <div key={c.id} title={c.name} style={{ background: c.bg, borderRadius: 16, aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(123,26,56,0.06)' }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>{c.emoji}</span>
              <span style={{ fontSize: 10, color: '#6B3345', fontWeight: 700, marginTop: 4 }}>{c.name}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/charm-builder" style={{ padding: '14px 28px', borderRadius: 9999, background: MAROON, color: '#fff', fontWeight: 900, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 14px rgba(123,26,56,0.25)' }}>
            See them all in the builder →
          </Link>
        </div>
      </section>

      {/* ── METALS ── */}
      <section style={{ background: 'var(--blush)', padding: '56px 16px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-baloo,sans-serif)', fontWeight: 800, color: MAROON, fontSize: 'clamp(24px,4.5vw,34px)', margin: '0 0 32px' }}>
            Choose your finish
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18 }}>
            {METALS.map(m => (
              <div key={m.name} style={{ background: '#fff', borderRadius: 18, padding: '24px 20px', textAlign: 'center', boxShadow: '0 2px 16px rgba(123,26,56,0.08)' }}>
                <div style={{ fontSize: 36 }}>{m.emoji}</div>
                <h3 style={{ margin: '8px 0 2px', color: MAROON, fontWeight: 800, fontSize: 18 }}>{m.name}</h3>
                <p style={{ margin: 0, color: '#9B3A54', fontSize: 14, fontWeight: 700 }}>{m.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section id="faqs" style={{ maxWidth: 780, margin: '0 auto', padding: '64px 16px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-baloo,sans-serif)', fontWeight: 800, color: MAROON, fontSize: 'clamp(26px,5vw,38px)', margin: '0 0 32px' }}>
          Good to know
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FAQS.map(f => (
            <details key={f.q} style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 10px rgba(123,26,56,0.06)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 800, color: MAROON, fontSize: 16, listStyle: 'none' }}>{f.q}</summary>
              <p style={{ margin: '10px 0 0', color: '#6B3345', fontSize: 15, lineHeight: 1.6 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: MAROON, padding: '64px 16px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-baloo,sans-serif)', fontWeight: 800, fontSize: 'clamp(28px,5.5vw,44px)' }}>
          Ready to make something<br />that&apos;s totally you?
        </h2>
        <Link href="/charm-builder" style={{ display: 'inline-block', marginTop: 26, padding: '16px 36px', borderRadius: 9999, background: '#fff', color: MAROON, fontWeight: 900, fontSize: 18, textDecoration: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
          🔗 Design your bracelet
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#3D0E1E', color: '#F4BFCC', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 16 }}>
          <a href="https://instagram.com/oddlycraft" target="_blank" rel="noopener noreferrer" style={{ color: '#F4BFCC', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>@oddlycraft</a>
          <a href="https://www.tiktok.com/@oddlycraft.mt" target="_blank" rel="noopener noreferrer" style={{ color: '#F4BFCC', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>TikTok</a>
        </div>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>OddlyCraft Malta · Handmade Italian charm bracelets · Made with ♡ in Malta</p>
      </footer>
    </main>
  )
}
