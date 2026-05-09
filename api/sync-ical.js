export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url parameter' })

  let decoded
  try {
    decoded = decodeURIComponent(url)
    new URL(decoded) // validate it's a real URL
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  try {
    const response = await fetch(decoded, {
      headers: { 'User-Agent': 'HostOS/1.0 iCal-Sync' },
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const ical = await response.text()
    const events = parseIcal(ical)
    res.status(200).json({ events, synced: new Date().toISOString() })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}

function parseIcal(ical) {
  // Unfold continuation lines (RFC 5545: lines starting with space/tab are continuations)
  const unfolded = ical.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  const events = []
  let current = null

  for (const raw of lines) {
    const line = raw.trim()
    if (line === 'BEGIN:VEVENT') {
      current = {}
    } else if (line === 'END:VEVENT') {
      if (current?.dtstart && current?.dtend) events.push(current)
      current = null
    } else if (current) {
      if (line.startsWith('DTSTART'))      current.dtstart     = extractDate(line)
      else if (line.startsWith('DTEND'))   current.dtend       = extractDate(line)
      else if (line.startsWith('SUMMARY')) current.summary     = extractValue(line)
      else if (line.startsWith('UID'))     current.uid         = extractValue(line)
      else if (line.startsWith('DESCRIPTION')) current.description = extractValue(line)
    }
  }

  return events
}

function extractValue(line) {
  const idx = line.indexOf(':')
  return idx >= 0 ? line.slice(idx + 1).trim() : ''
}

function extractDate(line) {
  const val = extractValue(line)
  // Handles: 20260510, 20260510T150000Z, 20260510T150000
  const digits = val.replace(/\D/g, '').slice(0, 8)
  if (digits.length < 8) return null
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}
