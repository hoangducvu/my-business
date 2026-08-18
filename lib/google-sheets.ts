import { google, type sheets_v4 } from 'googleapis'

// ─── Shared Google Sheets plumbing ───────────────────────────────────────────
// Everything that talks to the spreadsheet goes through here so a request costs
// one HTTP round-trip to Google instead of three.

let client: sheets_v4.Sheets | undefined

/**
 * One Sheets client per process.
 *
 * Building a fresh GoogleAuth per call re-parses the service-account JSON and
 * forces a new OAuth token exchange with Google before the actual read (~300ms
 * of dead time on every request). A reused instance keeps its access token
 * cached for the full hour it is valid.
 */
export function sheetsClient(): sheets_v4.Sheets {
  if (!client) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    client = google.sheets({ version: 'v4', auth })
  }
  return client
}

export function spreadsheetId(): string {
  return process.env.GOOGLE_SPREADSHEET_ID!
}

// ─── One-time setup ──────────────────────────────────────────────────────────

const onceCalls = new Map<string, Promise<void>>()

/**
 * Runs a sheet creation/migration at most once per process instead of on every
 * request. A failed run is forgotten so the next request retries it.
 */
export function once(key: string, fn: () => Promise<void>): Promise<void> {
  let pending = onceCalls.get(key)
  if (!pending) {
    pending = fn().catch((err) => {
      onceCalls.delete(key)
      throw err
    })
    onceCalls.set(key, pending)
  }
  return pending
}

// ─── Short-lived read cache ──────────────────────────────────────────────────

interface Entry { expires: number; value: Promise<unknown> }

const reads = new Map<string, Entry>()

/**
 * Caches a sheet read for `ttlMs` and collapses concurrent callers onto one
 * in-flight request. Used on the public shop routes only — /admin reads stay
 * uncached so the owner always sees the stock they just edited.
 */
export function cachedRead<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = reads.get(key)
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>

  const value = load().catch((err) => {
    reads.delete(key)
    throw err
  })
  reads.set(key, { expires: Date.now() + ttlMs, value })
  return value
}

/** Drops cached reads after a write so the next read reflects it. */
export function invalidate(...keys: string[]): void {
  for (const key of keys) reads.delete(key)
}
