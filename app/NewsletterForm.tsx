'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function NewsletterForm() {
  const [status,  setStatus]  = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')

    const fd = new FormData(e.currentTarget)
    const body = {
      type:  'newsletter',
      name:  fd.get('name')?.toString().trim(),
      email: fd.get('email')?.toString().trim(),
    }

    try {
      const res  = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
        ;(e.target as HTMLFormElement).reset()
      } else {
        setStatus('error')
        setMessage(data.message || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🎉</div>
        <p className="font-black text-xl text-white">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="First Name"
          className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-white outline-none transition text-sm bg-white text-gray-800 placeholder-gray-400"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email Address"
          className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-white outline-none transition text-sm bg-white text-gray-800 placeholder-gray-400"
        />
      </div>

      {status === 'error' && (
        <div role="alert" className="px-4 py-3 rounded-xl text-sm font-bold bg-red-100 text-red-800">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-4 hover:opacity-90 disabled:opacity-60 text-[#111827] font-black text-lg rounded-2xl shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
        style={{ backgroundColor: '#FFFAA0' }}
      >
        {status === 'loading' ? 'Joining…' : "Sign Up — It's Free! ♡"}
      </button>
    </form>
  )
}
