import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'hostos_ical_urls'
const SYNC_KEY = 'hostos_ical_reservations'
const INTERVAL_MS = 60 * 60 * 1000 // 1 hour

function loadUrls() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

function saveUrls(urls) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls))
}

function loadSynced() {
  try { return JSON.parse(localStorage.getItem(SYNC_KEY) || '[]') } catch { return [] }
}

function saveSynced(rez) {
  localStorage.setItem(SYNC_KEY, JSON.stringify(rez))
}

// Detect platform from URL domain
function detectIzvor(url) {
  if (url.includes('booking.com')) return 'Booking.com'
  if (url.includes('airbnb.com')) return 'Airbnb'
  return 'iCal'
}

// Convert parsed iCal event to reservation object
function eventToRez(event, apartmanId, izvor, uid) {
  const summary = event.summary || ''
  // Booking/Airbnb don't expose guest names in iCal — use placeholder
  const gost = izvor === 'Booking.com' ? 'Booking.com gost' : izvor === 'Airbnb' ? 'Airbnb gost' : 'iCal gost'
  return {
    id: `ical_${uid}`,
    apartmanId,
    gostId: null,
    gost,
    dolazak: event.dtstart,
    odlazak: event.dtend,
    cena: 0,
    status: 'potvrdjeno',
    izvor,
    kontakt: '',
    napomena: event.description ? event.description.slice(0, 100) : '',
    icalImport: true,
  }
}

export function useIcalSync() {
  const [icalUrls, setIcalUrls] = useState(loadUrls)
  const [syncedRez, setSyncedRez] = useState(loadSynced)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [syncError, setSyncError] = useState(null)

  function setUrl(apartmanId, platform, url) {
    const next = { ...icalUrls, [`${apartmanId}_${platform}`]: url }
    setIcalUrls(next)
    saveUrls(next)
  }

  function getUrl(apartmanId, platform) {
    return icalUrls[`${apartmanId}_${platform}`] || ''
  }

  const sync = useCallback(async () => {
    const entries = Object.entries(icalUrls).filter(([, url]) => url.trim())
    if (entries.length === 0) return

    setSyncing(true)
    setSyncError(null)
    const all = []

    for (const [key, url] of entries) {
      const [apartmanId, platform] = key.split('_')
      const izvor = detectIzvor(url)
      try {
        const res = await fetch(`/api/sync-ical?url=${encodeURIComponent(url)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { events } = await res.json()
        for (const ev of events) {
          const uid = `${key}_${ev.uid || ev.dtstart}`
          all.push(eventToRez(ev, Number(apartmanId), izvor, uid))
        }
      } catch (err) {
        setSyncError(`Greška za ${platform}: ${err.message}`)
      }
    }

    setSyncedRez(all)
    saveSynced(all)
    setLastSync(new Date().toISOString())
    setSyncing(false)
  }, [icalUrls])

  // Auto sync on load and every hour
  useEffect(() => {
    sync()
    const timer = setInterval(sync, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [sync])

  return { icalUrls, setUrl, getUrl, syncedRez, syncing, lastSync, syncError, sync }
}
