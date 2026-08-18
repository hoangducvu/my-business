import type { Metadata } from "next";
import { Nunito, Baloo_2, Fraunces, Fredoka, Playfair_Display, Space_Mono } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Hero tagline. The editorial serif on the reference site — sturdier serifs
// and more stroke contrast than Fraunces, which reads softer and rounder.
const playfair = Playfair_Display({
  variable: "--font-editorial",
  subsets: ["latin"],
  // 700/800 are here for the hero tagline and the ticket-rail heading, which
  // are both set bold — without them the browser fakes it by smearing the 400.
  weight: ["400", "500", "700", "800"],
});

// The two shop headings. A typewriter face, and the only monospace on the site
// — the even letter widths are what make "Plaza Sliema" and "Mercury
// St Julians" read as two labels on a board rather than as more headline type.
const spaceMono = Space_Mono({
  variable: "--font-mono-display",
  subsets: ["latin"],
  weight: ["700"],
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "OddlyCraft Malta — Customise Your Own Charms, Cases & More",
  description:
    "Walk-in craft workshop in Malta. Make your own phone case, Italian charm bracelet, pencil case, locket heart, passport cover, bag charm, bead bracelet or phone chain — no skills needed!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${baloo.variable} ${fredoka.variable} ${playfair.variable} ${fraunces.variable} ${spaceMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
