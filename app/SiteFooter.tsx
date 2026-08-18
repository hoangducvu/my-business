import FooterNewsletter from './FooterNewsletter'

/**
 * The yellow footer, shared by every full page (home, /book).
 *
 * Lifted out of app/page.tsx when booking moved to its own route — two copies
 * of a footer this size drift apart within a week.
 *
 * ── The shape ────────────────────────────────────────────────────────────
 * A full-width serif line across the top, then one row of six: the mark, four
 * columns of links, and the newsletter. Then a wave, then the small print.
 *
 * The headline is LEFT-ALIGNED and set to fill the measure. Centred, a line
 * this long leaves two ragged wedges of yellow at the ends and reads as a
 * caption; ranged left it reads as a masthead, which is the job.
 *
 * ── Every link here points at something that exists ──────────────────────
 * The columns are built from real routes and real anchors only — `/`, `/book`,
 * `/charm-builder`, and the `#tickets`, `#build`, `#locations`, `#girl-club`
 * sections on the homepage. Do not add a heading here for a page that has not
 * been built yet: a footer is where people go when they are already lost, and
 * a link that scrolls nowhere is worse than no link. (There is already one of
 * those on the site — the nav's `#faqs`, which has no matching section.)
 */

/** The four link columns. Headings are the column's own label. */
const COLUMNS: { heading: string; links: [string, string][] }[] = [
  {
    heading: 'Explore',
    links: [
      ['/', 'Home'],
      ['/#tickets', 'Workshops'],
      ['/#locations', 'Our Shops'],
      ['/#girl-club', 'Girl Club'],
    ],
  },
  {
    heading: 'Make Something',
    links: [
      ['/book', 'Book a Session'],
      ['/#build', 'Build a Bracelet'],
      ['/charm-builder', 'Charm Builder'],
    ],
  },
]

const PHONES = ['+356 9917 9159', '+356 9905 5882', '+356 9917 9688']

export default function SiteFooter() {
  return (
    <footer className="pt-16 pb-8" style={{ background: '#FFEA6D', color: '#005CFF' }}>
      <div className="w-full px-6 sm:px-12 lg:px-20">

        {/* Big serif line, ranged left and sized to fill the measure. The
            nowrap is what lets the clamp push it right out to the edges —
            allow it to wrap and the font-size stops doing any work.

            6vw, NOT the 6.6 this used to carry. The string is 13.6em wide in
            Fraunces, and the container's padding jumps at sm (24→48px a side)
            and again at lg (48→80px): just past each of those jumps the line
            is at its tightest, and anything above ~6.2vw runs off the right
            edge there. It was already overflowing before — centred, so it
            spilled evenly at both ends and read as deliberate. Re-measure the
            13.6 before raising this; it is a property of the typeface. */}
        <h2
          className="mb-14 whitespace-nowrap text-left"
          style={{
            fontFamily: 'var(--font-serif), Georgia, serif',
            color: '#005CFF',
            fontWeight: 400,
            lineHeight: 1,
            fontSize: 'clamp(1rem, 6vw, 7.5rem)',
          }}
        >
          Thank you for your curiosity.
        </h2>

        {/* Mark + four columns + newsletter. Two columns on a phone, three at
            sm, and the full six-across only once there is room for the
            newsletter to sit beside them rather than under them. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[auto_1fr_1fr_1fr_1fr_1.5fr] gap-y-12 gap-x-8 mb-16 items-start">

          {/* Logo mark. Spans the row on a phone so the columns below it start
              level with each other instead of one being pushed down. */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex items-start">
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

          {/* Visit Us — the two shops, then the hours under a gap. The gap is
              what stops the hours reading as part of the second address. */}
          <div>
            <h3 className="text-xl font-bold uppercase mb-5">Visit Us</h3>
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                The Plaza Sliema — Level 2<br />
                Sliema, Malta
              </p>
              <p>
                Mercury Tower — Level B1<br />
                St Julian&apos;s, Malta
              </p>
              <p className="pt-3">10am – 7pm daily</p>
            </div>
          </div>

          {COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="text-xl font-bold uppercase mb-5">{heading}</h3>
              <ul className="space-y-4 text-base">
                {links.map(([href, label]) => (
                  <li key={label}>
                    <a href={href} className="hover:opacity-60 transition">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Let's Talk Shop */}
          <div>
            <h3 className="text-xl font-bold uppercase mb-5">Let&apos;s Talk Shop</h3>
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                Questions? Comments?<br />
                Email us!<br />
                <a href="mailto:oddlycraftmalta@gmail.com" className="hover:opacity-60 transition break-all">
                  oddlycraftmalta@gmail.com
                </a>
              </p>
              <p>
                Give us a call!<br />
                {PHONES.map((n) => (
                  <a
                    key={n}
                    href={`tel:${n.replace(/\s/g, '')}`}
                    className="block hover:opacity-60 transition"
                  >
                    {n}
                  </a>
                ))}
              </p>
            </div>
          </div>

          {/* Newsletter. Spans the row below lg, where it sits under the
              columns rather than beside them and would otherwise be squeezed
              into a third of the width. */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <p className="text-base leading-relaxed mb-5 max-w-xs">
              Join 200+ other crafters who already get our emails — first dibs on new
              drops, events &amp; workshops.
            </p>
            <FooterNewsletter />
          </div>
        </div>

        {/* Wavy divider — animated scroll (left → right), full-bleed */}
        <div className="wave-scroll mb-6 -mx-6 sm:-mx-12 lg:-mx-20" aria-hidden="true" />

        {/* Small print: policies left, socials dead centre of the page (not of
            the space left over), copyright right. */}
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-black uppercase tracking-widest">
            <li><a href="#" className="hover:opacity-60 transition">Refund Policy</a></li>
            <li><a href="#" className="hover:opacity-60 transition">Privacy Policy</a></li>
            <li><a href="#" className="hover:opacity-60 transition">Terms of Service</a></li>
          </ul>

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
  )
}
