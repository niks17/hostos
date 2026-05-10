/**
 * useIcalSync — iCal synchronization hook
 *
 * Fetches iCal URLs via /api/sync-ical (Vercel serverless proxy).
 * The proxy is necessary because Booking.com & Airbnb block direct
 * browser fetch requests (CORS).
 *
 * Storage:
 *   - iCal URLs: localStorage (hostos_ical_urls_v1)
 *   - Synced reservations: localStorage (hostos_ical_rez_v1)
 */
import { useState, useEffect, useCallback, useRef } from 'react'

const URL_KEY  = 'hostos_ical_urls_v1'
const REZ_KEY  = 'hostos_ical_rez_v1'
const INTERVAL = 60 * 60 * 1000 // re-sync every hour

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
  catch { return fallback }
}
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function detectIzvor(url) {
  if (url.includes('booking.com')) return 'Booking.com'
  if (url.includes('airbnb.com'))  return 'Airbnb'
  return 'iCal'
}

function eventToRez(ev, apartmanId, izvor, uid) {
  const gost =
    izvor === 'Booking.com' ? 'Booking.com gost' :
    izvor === 'Airbnb'      ? 'Airbnb gost' : 'iCal gost'
  return {
    id:         `ical_${uid}`,
    apartmanId,
    gostId:     null,
    gost,
    dolazak:    ev.dtstart,
    odlazak:    ev.dtend,
    cena:       0,
    status:     'potvrdjeno',
    izvor,
    kontakt:    '',
    napomena:   ev.description ? ev.description.slice(0, 120) : '',
    icalImport: true,
    br_gostiju: 1,
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useIcalSync() {
  const [icalUrls,  setIcalUrls]  = useState(() => loadJson(URL_KEY, {}))
  const [syncedRez, setSyncedRez] = useState(() => loadJson(REZ_KEY, []))
  const [syncing,   setSyncing]   = useState(false)
  const [lastSync,  setLastSync]  = useState(null)
  const [errors,    setErrors]    = useState([]) // [{ platform, message }]

  // Prevent duplicate syncs
  const syncingRef = useRef(false)

  // ── URL management ──────────────────────────────────────────────────────────
  function setUrl(apartmanId, platform, url) {
    const next = { ...icalUrls, [`${apartmanId}_${platform}`]: url }
    setIcalUrls(next)
    saveJson(URL_KEY, next)
  }

  function getUrl(apartmanId, platform) {
    return icalUrls[`${apartmanId}_${platform}`] || ''
  }

  function removeUrl(apartmanId, platform) {
    const next = { ...icalUrls }
    delete next[`${apartmanId}_${platform}`]
    setIcalUrls(next)
    saveJson(URL_KEY, next)
    // Also clear synced rez for this source
    const key = `ical_${apartmanId}_${platform}`
    const filtered = syncedRez.filter(r => !r.id.startsWith(`ical_${key}`))
    setSyncedRez(filtered)
    saveJson(REZ_KEY, filtered)
  }

  // ── Core sync ───────────────────────────────────────────────────────────────
  const sync = useCallback(async (force = false) => {
    if (syncingRef.current) return
    const entries = Object.entries(icalUrls).filter(([, url]) => url?.trim())
    if (entries.length === 0) return

    syncingRef.current = true
    setSyncing(true)
    setErrors([])

    const allRez   = []
    const newErrors = []

    await Promise.allSettled(
      entries.map(async ([key, url]) => {
        const [apartmanIdStr, platform] = key.split('_')
        const apartmanId = Number(apartmanIdStr)
        const izvor      = detectIzvor(url)

        try {
          const res = await fetch(
            `/api/sync-ical?url=${encodeURIComponent(url)}`,
            { signal: AbortSignal.timeout(15_000) }
          )

          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body.error || `HTTP ${res.status}`)
          }

          const { events = [] } = await res.json()

          for (const ev of events) {
            if (!ev.dtstart || !ev.dtend) continue
            // Skip cancelled events (some providers mark them STATUS:CANCELLED)
            if (ev.status === 'CANCELLED' || ev.status === 'CANCELED') continue
            const uid = `${key}_${ev.uid || ev.dtstart}`
            allRez.push(eventToRez(ev, apartmanId, izvor, uid))
          }
        } catch (err) {
          const msg = err.name === 'TimeoutError'
            ? 'Server nije odgovorio na vreme (timeout)'
            : err.message
          newErrors.push({ platform: platform || izvor, message: msg })
        }
      })
    )

    setSyncedRez(allRez)
    saveJson(REZ_KEY, allRez)
    setLastSync(new Date().toISOString())
    setErrors(newErrors)
    setSyncing(false)
    syncingRef.current = false
  }, [icalUrls])

  // ── Auto-sync on mount + hourly ─────────────────────────────────────────────
  useEffect(() => {
    // Delay first sync by 2s (don't block initial render)
    const initialTimer = setTimeout(() => sync(), 2000)
    const interval     = setInterval(() => sync(), INTERVAL)
    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [sync])

  return {
    // Data
    icalUrls,
    syncedRez,
    // State
    syncing,
    lastSync,
    errors,
    hasErrors: errors.length > 0,
    // Actions
    setUrl,
    getUrl,
    removeUrl,
    sync: () => sync(true),
  }
}
