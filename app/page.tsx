import type { Metadata } from 'next'
import Image from 'next/image'
import BookingSection from './BookingSection'
import NewsletterForm from './NewsletterForm'

export const metadata: Metadata = {
  title: 'Oddly Craft Malta — Trendy Phone Cases & Unique Bracelets',
  description:
    "Experience a crafty space like no other. Design your own phone case or Italian charm bracelet at Mercury Tower, St. Julian's — no artistic skills needed!",
}

const CDN = 'https://images.squarespace-cdn.com/content/v1/66b355473e77ee151ad26afd'

const images = {
  logo:     `${CDN}/9506482f-2d23-49af-890f-fc918122df1a/Group+104.png?format=1500w`,
  hero:     `${CDN}/490a20a6-3e52-4f22-b6c6-7ecc1de2bee6/First+Image+%28HP%29.png`,
  caseHold: `${CDN}/c2c3c3fd-24d5-4e4d-b6f4-20b0f1c4b910/IMG_3213.jpg`,
  caseOut:  `${CDN}/855f872f-a835-4359-923c-7d5fad7e2aa0/IMG_9974.JPG`,
  process:  `${CDN}/14d77091-ddeb-4d3d-aecb-c54c8a44c1b5/Untitled+design+%282%29.png`,
  bracelet: `${CDN}/a7d94c2b-ccf7-4985-8f1c-b47d20402560/Product+4+%28P%29.png`,
}

// ─────────────────────────────────────────────────────────────────────────────
// ✦ WORKSHOPS
// To add a new workshop card: copy one object and paste below the last one.
// ─────────────────────────────────────────────────────────────────────────────
const workshops = [
  {
    id: 'phonecase',
    photo: images.caseOut,
    photoAlt: 'Girl holding a custom seashell phone case',
    title: 'craft your own phone case',
    description:
      "no prior experience needed—just bring your personality, and we'll guide you every step of the way",
    price: '€28',
    tag: 'Most Popular',
    cta: 'Book your ticket',
    href: '#book',
  },
  {
    id: 'bracelet',
    photo: images.bracelet,
    photoAlt: 'Italian charm bracelets on wrist',
    title: 'build your own bracelet',
    description:
      'with over 500 charms to choose from, that showcase your personality, celebrate your milestones, or simply reflect your style',
    price: 'from €15',
    tag: '500+ charms',
    cta: 'Shop online',
    href: '#book',
  },
  // ✦ TO ADD A NEW WORKSHOP — copy the block below, uncomment, and fill in:
  // {
  //   id: 'keychain',
  //   photo: images.process,        // swap for a different image if you have one
  //   photoAlt: 'Custom keychain',
  //   title: 'design your own keychain',
  //   description: 'pick your shape, print your photo — walk away with something uniquely yours',
  //   price: '€18',
  //   tag: 'New!',
  //   cta: 'Book your ticket',
  //   href: '#book',
  // },
]

// ─────────────────────────────────────────────────────────────────────────────
// ✦ USE CASES
// To add more: copy one object and paste below the last one.
// ─────────────────────────────────────────────────────────────────────────────
const useCases = [
  {
    id: 'yourself',
    emoji: '🌟',
    title: 'For Yourself',
    description: 'Ditch boring cookie-cutter cases! Your outfits deserve better matches.',
  },
  {
    id: 'duo',
    emoji: '💑',
    title: 'For Just The Two Of Us',
    description:
      "No love stories the same, why phone cases? Don't just make memories, turn them into daily reminders.",
  },
  {
    id: 'besties',
    emoji: '🫂',
    title: 'For Your Gossip Besties',
    description: 'Make memories that stick with matching phone cases for your besties.',
  },
  {
    id: 'gang',
    emoji: '🎉',
    title: 'For Your Ride-or-die Gang',
    description: "Unite your group's vibe with one-of-a-kind matching phone cases.",
  },
  {
    id: 'family',
    emoji: '👨‍👩‍👧‍👦',
    title: 'For Your One-and-only Family',
    description: 'Too busy for family? Ever dreamed of "My kids made me this phone case" moment?',
  },
  {
    id: 'friendship',
    emoji: '📿',
    title: 'Friendship Bracelets',
    description: 'Mix and Match Unique Friendship Bracelets.',
  },
  // ✦ TO ADD A NEW USE CASE — copy the block below, uncomment, and fill in:
  // {
  //   id: 'corporate',
  //   emoji: '💼',
  //   title: 'For Your Work Team',
  //   description: "Forget boring team-building — create something everyone actually keeps.",
  // },
]

const marqueeItems = ['dream it ♡', 'make it ♡', 'wear it ♡', 'gift it ♡', 'love it ♡', 'own it ♡', 'feel it ♡', 'share it ♡']

export default function HomePage() {
  const doubled = [...marqueeItems, ...marqueeItems]

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Real logo */}
          <a href="/" className="flex-none">
            <Image
              src={images.logo}
              alt="Oddly Craft"
              width={140}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-600">
            <a href="#workshops" className="hover:text-[var(--pink)] transition">Italian Charms</a>
            <a href="#book" className="hover:text-[var(--pink)] transition">Workshop Tickets</a>
            <a href="#newsletter" className="hover:text-[var(--pink)] transition">Gift Card</a>
            <a href="#faqs" className="hover:text-[var(--pink)] transition">FAQs</a>
            <a
              href="https://instagram.com/oddlycraft"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-[var(--pink)] transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>

          <a
            href="#book"
            className="inline-flex items-center px-5 py-2.5 bg-[var(--pink)] hover:bg-[var(--pink-dark)] text-white font-black text-sm rounded-full transition shadow-md"
          >
            Book Now
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--pink-light)] via-white to-[#f8fbff] py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: text */}
          <div>
            <p className="text-sm font-bold text-[var(--pink)] uppercase tracking-widest mb-4">
              experience a crafty space like no other
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-[#111827] mb-4">
              trendy phone cases<br />
              <span className="text-[var(--pink)]">&amp; unique bracelets</span> ♡
            </h1>
            <p className="text-base text-gray-400 mb-2">
              (no artistic skills needed. Oddly team got you covered)
            </p>
            <p className="text-sm text-gray-400 mb-8 flex items-center gap-1.5">
              <span>📍</span> Mercury Tower B1, St. Julian's, Malta
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#book"
                className="inline-flex justify-center items-center px-8 py-4 bg-[var(--yellow)] hover:bg-[var(--yellow-dark)] text-[#111827] font-black text-lg rounded-2xl shadow-lg transition-all"
              >
                Book your ticket →
              </a>
              <a
                href="#workshops"
                className="inline-flex justify-center items-center px-8 py-4 bg-white text-gray-700 font-bold text-lg rounded-2xl border-2 border-gray-200 hover:border-[var(--pink-mid)] shadow-sm transition"
              >
                Explore workshops
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-gray-500">
              <span>⭐⭐⭐⭐⭐ <strong className="text-gray-700">200+ happy crafters</strong></span>
              <span>🎨 <strong className="text-gray-700">Daily 11:00–20:00</strong></span>
              <span>🎁 <strong className="text-gray-700">Perfect gift</strong></span>
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative h-80 sm:h-96 lg:h-[480px] rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src={images.hero}
              alt="Oddly Craft workshop — custom phone cases and bracelets"
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div
        className="overflow-hidden py-4 border-y border-[var(--pink-mid)]"
        style={{ background: 'var(--pink)' }}
        aria-hidden
      >
        <div className="animate-marquee">
          {doubled.map((text, i) => (
            <span
              key={i}
              className="inline-block px-8 text-white font-black text-lg uppercase tracking-widest whitespace-nowrap"
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── WORKSHOPS ── */}
      <section id="workshops" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] mb-3">
              two ways to express yourself
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Pick one — or do both for the ultimate creative day out ♡
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {workshops.map((w) => (
              <div
                key={w.id}
                className="card-hover relative rounded-3xl border-2 border-gray-100 bg-[var(--soft-gray)] overflow-hidden"
              >
                {/* Photo */}
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={w.photo}
                    alt={w.photoAlt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  {/* Tag badge */}
                  <span className="absolute top-4 right-4 px-3 py-1 bg-[var(--pink)] text-white text-xs font-black rounded-full shadow">
                    {w.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-black text-[#111827] mb-2">{w.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">{w.description}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-3xl font-black text-[var(--pink)]">{w.price}</span>
                    <a
                      href={w.href}
                      className="px-6 py-3 bg-[var(--yellow)] hover:bg-[var(--yellow-dark)] text-[#111827] font-black rounded-xl transition shadow-sm text-sm"
                    >
                      {w.cta}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY ── */}
      <section className="py-16 px-4 bg-[var(--pink-light)]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-bold text-[var(--pink)] uppercase tracking-widest mb-8">
            from our workshop ♡
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { src: images.caseHold, alt: 'Custom seashell phone case — dark theme' },
              { src: images.process,  alt: 'Crafting a phone case with shells and gems' },
              { src: images.caseOut,  alt: 'Outdoor lifestyle with custom phone case' },
            ].map((img) => (
              <div key={img.src} className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
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
              className="inline-flex items-center gap-2 text-[var(--pink)] font-black text-sm hover:underline"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              See more on @oddlycraft
            </a>
          </div>
        </div>
      </section>

      {/* ── BOOKING (client component) ── */}
      <BookingSection />

      {/* ── USE CASES ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] mb-3">
              who is this for?
            </h2>
            <p className="text-gray-400 max-w-sm mx-auto">
              Honestly… everyone. But here are a few of our favourites ♡
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {useCases.map((u) => (
              <div
                key={u.id}
                className="card-hover rounded-2xl border-2 border-gray-100 p-5 text-center bg-[var(--soft-gray)]"
              >
                <div className="text-4xl mb-3">{u.emoji}</div>
                <h3 className="font-black text-sm text-[#111827] mb-2 leading-snug">{u.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{u.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section id="faqs" className="py-20 px-4 bg-[var(--pink-light)]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] mb-3">got questions? ♡</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'Do I need any artistic skills?',
                a: 'None at all! Our team guides you every step of the way. Just bring your personality.',
              },
              {
                q: 'How long does a session take?',
                a: 'Phone case sessions take about 45–60 minutes. Bracelet building can be as quick as 30 minutes depending on how many charms you pick!',
              },
              {
                q: 'Can I bring my own photos?',
                a: "Yes! For phone cases you can bring photos on your phone and we'll print them for you.",
              },
              {
                q: 'Do you cater for groups & hen parties?',
                a: "Absolutely — group bookings are our favourite! Contact us for private session packages for groups of 6+.",
              },
              {
                q: 'Where exactly are you located?',
                a: "Level B1, Mercury Tower, St. Julian's, Malta. We also have a bracelet counter at The Plaza Shopping Centre Level 2, Sliema.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer"
              >
                <summary className="font-black text-[#111827] list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-[var(--pink)] text-lg group-open:rotate-45 transition-transform inline-block ml-3 flex-none">+</span>
                </summary>
                <p className="mt-3 text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section id="newsletter" className="py-20 px-4 bg-gradient-to-br from-[var(--pink)] to-[#3b6ec7]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            join the colorful fun! ♡
          </h2>
          <p className="text-blue-100 mb-8">
            Sign up to unlock exclusive discounts, new charm drops, and all the quirky updates
            from our workshop.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#111827] text-gray-400 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <Image
                src={images.logo}
                alt="Oddly Craft"
                width={120}
                height={28}
                className="h-7 w-auto object-contain mb-3 brightness-0 invert"
              />
              <p className="text-sm leading-relaxed">
                Malta's quirkiest craft workshop. Come make something you'll love ♡
              </p>
            </div>
            <div>
              <div className="text-white font-bold mb-3">Navigate</div>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="hover:text-white transition">Home</a></li>
                <li><a href="#workshops" className="hover:text-white transition">Workshops</a></li>
                <li><a href="#book" className="hover:text-white transition">Booking</a></li>
                <li><a href="#faqs" className="hover:text-white transition">FAQs</a></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-bold mb-3">Get in Touch</div>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:oddlycraftmalta@gmail.com" className="hover:text-white transition">oddlycraftmalta@gmail.com</a></li>
                <li><a href="tel:+35699179159" className="hover:text-white transition">+356 9917 9159</a></li>
                <li><a href="tel:+35699179688" className="hover:text-white transition">+356 9917 9688</a></li>
                <li className="pt-1">
                  <a
                    href="https://instagram.com/oddlycraft"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--yellow)] transition font-semibold"
                  >
                    @oddlycraft ↗
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 text-center text-sm">
            <p className="font-bold text-gray-300 mb-1">Thank You For Your Curiosity ♡</p>
            <p>© {new Date().getFullYear()} Oddly Craft Malta. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
