/**
 * HostOS — iCal Proxy
 * Vercel Serverless Function (Node.js)
 *
 * Problem: Booking.com & Airbnb block direct browser fetch (CORS).
 * Solution: Server fetches the iCal URL on behalf of the browser, parses it,
 *           returns clean JSON with reservation events.
 *
 * Security:
 *   - Blocks private/localhost IPs (SSRF prevention)
 *   - Only allows HTTPS URLs
 *   - 10s timeout
 *   - Response cached 30min on Vercel edge
 */

// ── SSRF Guard ─────────────────────────────────────────────────────────────────
// Block requests to private network ranges, localhost, metadata services
const BLOCKED = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./, // AWS metadata / link-local
  /^::1$/,       // IPv6 loopback
  /^fc00:/i,     // IPv6 private
  /^fd[0-9a-f]{2}:/i, // IPv6 ULA
  /\.internal$/i,
  /\.local$/i,
]

function isSafeUrl(urlString) {
  let parsed
  try { parsed = new URL(urlString) } catch { return false }
  if (parsed.protocol !== 'https:') return false
  const h = parsed.hostname.toLowerCase()
  return !BLOCKED.some(re => re.test(h))
}

// ── iCal Parser ────────────────────────────────────────────────────────────────
/**
 * Parses raw iCal text → array of event objects.
 *
 * Handles:
 *   - RFC 5545 line folding (continuation lines)
 *   - DATE and DATE-TIME DTSTART/DTEND formats
 *   - TZID parameter (strips timezone, keeps date)
 *   - Escaped characters in SUMMARY/DESCRIPTION (\n \, \;)
 *   - Multiple VEVENT blocks
 */
function parseIcal(text) {
  // 1. Normalize line endings
  // 2. Unfold folded lines (lines starting with SPACE or TAB are continuations)
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n([ \t])/g, '$1') // unfold: join with next char (strip leading whitespace marker)

  const lines = normalized.split('\n')
  const events = []
  let current = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line === 'BEGIN:VEVENT') {
      current = {}
      continue
    }

    if (line === 'END:VEVENT') {
      if (current && current.dtstart && current.dtend) {
        events.push(current)
      }
      current = null
      continue
    }

    if (!current) continue

    // Split on first colon. Key part may have parameters (DTSTART;VALUE=DATE:...)
    const colonPos = line.indexOf(':')
    if (colonPos === -1) continue

    const keyFull  = line.slice(0, colonPos)   // e.g. "DTSTART;VALUE=DATE"
    const value    = line.slice(colonPos + 1)   // e.g. "20260510"
    const baseKey  = keyFull.split(';')[0].toUpperCase()

    switch (baseKey) {
      case 'DTSTART':
        current.dtstart = toDateString(value)
        break
      case 'DTEND':
        current.dtend = toDateString(value)
        break
      case 'UID':
        current.uid = value.trim()
        break
      case 'SUMMARY':
        current.summary = unescape(value)
        break
      case 'DESCRIPTION':
        current.description = unescape(value)
        break
      case 'STATUS':
        current.status = value.trim().toUpperCase()
        break
    }
  }

  return events
}

/**
 * Convert iCal date/datetime value to YYYY-MM-DD string.
 * Examples:
 *   "20260510"           → "2026-05-10"
 *   "20260510T140000Z"   → "2026-05-10"
 *   "20260510T140000"    → "2026-05-10"
 */
function toDateString(val) {
  if (!val) return null
  // Strip everything after T (time component)
  const datePart = val.split('T')[0].replace(/\D/g, '')
  if (datePart.length < 8) return null
  return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`
}

/** Unescape RFC 5545 text escaping */
function unescape(str) {
  return (str || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

// ── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Allow browser to call this from any origin (same-domain Vercel app)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Validate URL parameter ──────────────────────────────────────────────────
  const rawUrl = req.query.url
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing required parameter: url' })
  }

  let decodedUrl
  try {
    decodedUrl = decodeURIComponent(rawUrl)
  } catch {
    return res.status(400).json({ error: 'Invalid URL encoding' })
  }

  if (!isSafeUrl(decodedUrl)) {
    return res.status(403).json({
      error: 'URL not allowed. Only external HTTPS URLs are supported.',
    })
  }

  // ── Fetch iCal ─────────────────────────────────────────────────────────────
  let icalText
  try {
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 10_000)

    const upstream = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HostOS-Calendar-Sync/1.0; +https://hostos-app.vercel.app)',
        'Accept': 'text/calendar, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!upstream.ok) {
      return res.status(502).json({
        error: `Calendar server responded with HTTP ${upstream.status}`,
        hint: upstream.status === 403
          ? 'The calendar URL may have expired. Get a fresh iCal link from Booking.com or Airbnb.'
          : 'Check that the iCal URL is correct and publicly accessible.',
      })
    }

    icalText = await upstream.text()
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({
        error: 'Calendar server did not respond in time (10s timeout)',
        hint: 'The iCal URL might be slow or unavailable. Try again later.',
      })
    }
    return res.status(502).json({ error: `Fetch failed: ${err.message}` })
  }

  // ── Validate iCal content ──────────────────────────────────────────────────
  if (!icalText.includes('BEGIN:VCALENDAR')) {
    return res.status(502).json({
      error: 'Response is not a valid iCal/ICS file',
      hint: 'Make sure you are using the iCal export URL, not the Booking.com web page URL.',
    })
  }

  // ── Parse & return ────────────────────────────────────────────────────────
  const events = parseIcal(icalText)

  // Cache on Vercel edge for 30 minutes (stale ok for up to 1 hour)
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')

  return res.status(200).json({
    events,
    count: events.length,
    synced_at: new Date().toISOString(),
  })
}
