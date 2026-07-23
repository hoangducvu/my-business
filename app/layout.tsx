import type { Metadata } from "next";
import { Nunito, Baloo_2, DM_Serif_Display } from "next/font/google";
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

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
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
    <html lang="en" className={`${nunito.variable} ${baloo.variable} ${dmSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
