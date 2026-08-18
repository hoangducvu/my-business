import type { Metadata } from 'next'
import BookingTickets from './BookingTickets'
import BuildYourBracelet from './BuildYourBracelet'
import CharmTrain from './CharmTrain'
import GirlClub from './GirlClub'
import HeroVideo from './HeroVideo'
import Locations from './Locations'
import SiteFooter from './SiteFooter'
import SiteNav from './SiteNav'
import VisitMarquee from './VisitMarquee'

export const metadata: Metadata = {
  title: 'OddlyCraft Malta — Customise Your Own Charms, Cases & More',
  description:
    'Walk-in craft workshop in Malta. Make your own phone case, Italian charm bracelet, locket heart, passport cover, bag charm or phone chain — no skills needed!',
}

export default function HomePage() {
  // Pale page base, matching the ticket rail — the nav is transparent, so what
  // shows behind it at rest is whatever main paints.
  //
  // The booking form is deliberately NOT on this page: it lives at /book and is
  // reached by picking a workshop ticket below, so nobody lands on a date
  // picker before they've chosen what they're making.
  return (
    <main className="min-h-screen" style={{ background: '#fffeee', fontFamily: 'var(--font-nunito), sans-serif' }}>

      {/* ── NAV (store awning) ── */}
      <SiteNav />

      {/* ── HERO (full-bleed shop video) ── */}
      <HeroVideo />

      {/* ── CHARM TRAIN (marquee) ── */}
      <CharmTrain />

      {/* ── BOOK YOUR UPCOMING WORKSHOP (ticket rail) ── */}
      <BookingTickets />

      {/* ── BUILD YOUR BRACELET (charm builder promo) ── */}
      <BuildYourBracelet />

      {/* ── THE TWO SHOPS (maps) ── shares the yellow above it, deliberately,
             with the pink ticker as the only thing dividing them */}
      <VisitMarquee />
      <Locations />

      {/* ── JOIN OUR GIRL CLUB (social wall) ── */}
      <GirlClub />

      {/* ── FOOTER ── */}
      <SiteFooter />
    </main>
  )
}
