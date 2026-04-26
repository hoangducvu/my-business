import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SignOutButton from './SignOutButton'

export default async function PortalPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const firstName = session.user?.name?.split(' ')[0] ?? session.user?.email ?? 'there'
  const isAdmin   = session.user?.role === 'admin'

  return (
    <main style={{ minHeight: '100vh', background: '#FFF0F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 20, boxShadow: '0 2px 24px rgba(123,26,56,.10)', overflow: 'hidden' }}>
        <div style={{ background: '#7B1A38', padding: '32px 32px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 36 }}>🎨</p>
          <h1 style={{ margin: '8px 0 0', color: '#fff', fontSize: 24, fontWeight: 900, fontFamily: 'system-ui,sans-serif' }}>
            Welcome back, {firstName}!
          </h1>
          <p style={{ margin: '8px 0 0', color: '#F4BFCC', fontSize: 14 }}>
            OddlyCraft Malta — {isAdmin ? 'Admin Portal' : 'Client Portal'}
          </p>
        </div>

        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ background: '#FDE8EF', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#9B3A54', textTransform: 'uppercase', letterSpacing: '.05em' }}>Signed in as</p>
            <p style={{ margin: 0, fontSize: 15, color: '#3D0E1E', fontWeight: 600 }}>{session.user?.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#7B1A38' }}>{session.user?.email}</p>
            {isAdmin && (
              <span style={{ display: 'inline-block', marginTop: 8, background: '#7B1A38', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Admin
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
            {/* Back to Homepage — shown for all users */}
            <a href="/"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#7B1A38', borderRadius: 14, textDecoration: 'none' }}>
              <span style={{ fontSize: 24 }}>🏠</span>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Back to Homepage</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#F4BFCC' }}>Return to OddlyCraft Malta</p>
              </div>
            </a>

            {isAdmin && (
              <>
                <a href="https://docs.google.com/spreadsheets" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#FFF0F4', borderRadius: 14, textDecoration: 'none', border: '1.5px solid #F4BFCC' }}>
                  <span style={{ fontSize: 24 }}>📊</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3D0E1E' }}>Bookings & Leads</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#7B1A38' }}>View all submissions in Google Sheets</p>
                  </div>
                </a>
                <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#FFF0F4', borderRadius: 14, textDecoration: 'none', border: '1.5px solid #F4BFCC' }}>
                  <span style={{ fontSize: 24 }}>📅</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3D0E1E' }}>Google Calendar</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#7B1A38' }}>Manage your schedule</p>
                  </div>
                </a>
              </>
            )}

            {!isAdmin && (
              <a href="/#book" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#FFF0F4', borderRadius: 14, textDecoration: 'none', border: '1.5px solid #F4BFCC' }}>
                <span style={{ fontSize: 24 }}>🎨</span>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3D0E1E' }}>Book a Workshop</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#7B1A38' }}>Reserve your next craft session</p>
                </div>
              </a>
            )}
          </div>

          <SignOutButton />
        </div>
      </div>
    </main>
  )
}
