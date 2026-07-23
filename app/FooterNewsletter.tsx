'use client'

import { useState } from 'react'

const BLUE = '#005CFF'
const SHOP_EMAIL = 'oddlycraftmalta@gmail.com'

export default function FooterNewsletter() {
  const [done, setDone] = useState(false)

  // No newsletter backend yet — open a pre-filled email so sign-ups still reach the shop.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email')?.toString().trim()
    if (!email) return
    const subject = encodeURIComponent('Newsletter sign-up')
    const body = encodeURIComponent(`Hi OddlyCraft! Please add me to your list: ${email}`)
    window.location.href = `mailto:${SHOP_EMAIL}?subject=${subject}&body=${body}`
    setDone(true)
  }

  if (done) {
    return (
      <p className="text-sm font-bold" style={{ color: BLUE }}>
        Thanks! Your email app just opened — hit send and you&apos;re on the list ♡
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center"
      style={{ border: `2px solid ${BLUE}`, borderRadius: 2 }}
    >
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder-current"
        style={{ color: BLUE }}
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="px-4 py-3 transition hover:opacity-60"
        style={{ color: BLUE }}
      >
        <svg width="26" height="18" viewBox="0 0 26 18" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M1 9h23M17 2l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  )
}
