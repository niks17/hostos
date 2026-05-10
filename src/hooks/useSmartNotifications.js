import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
// notification: { id, tip, prioritet, naslov, poruka, akcija, ikona }
// prioritet: 'critical' | 'high' | 'medium'

function todayStr()    { return new Date().toISOString().split('T')[0] }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }

function minutesUntil(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  return Math.round((target - Date.now()) / 60000)
}

export function useSmartNotifications({ apartmani = [], userId }) {
  const [notifications, setNotifications] = useState([])
  const shownBrowserNotifs = useRef(new Set())

  useEffect(() => {
    if (!userId) return
    compute()
    const interval = setInterval(compute, 3 * 60 * 1000) // recompute every 3 min
    return () => clearInterval(interval)
  }, [userId, apartmani.length])

  async function compute() {
    const danas = todayStr()
    const sutra = tomorrowStr()
    const now   = new Date()
    const hour  = now.getHours()
    const minNow = hour * 60 + now.getMinutes()

    const [{ data: rez }, { data: tasks }] = await Promise.all([
      supabase.from('rezervacije').select('*').neq('status', 'otkazano'),
      supabase.from('cistacke_tasks').select('*'),
    ])

    if (!rez || !tasks) return

    const notifs = []

    // ── 1. Gost stiže uskoro (check-in danas, unutar 2h) ─────────────────────
    const danasCheckins = rez.filter(r => r.dolazak === danas && r.status === 'potvrdjeno')
    const checkinMin = 14 * 60 // 14:00
    const minUntilCheckin = checkinMin - minNow
    if (minUntilCheckin > 0 && minUntilCheckin <= 120) {
      danasCheckins.forEach(r => {
        const apt = apartmani.find(a => a.id === r.apartman_id)
        notifs.push({
          id:        `checkin-soon-${r.id}`,
          tip:       'checkin_soon',
          prioritet: 'high',
          naslov:    'Gost stiže uskoro',
          poruka:    `${r.gost} — ${apt?.naziv || 'apartman'} za ${minUntilCheckin} min`,
          akcija:    'rezervacije',
          ikona:     '🏃',
        })
      })
    }

    // ── 2. Čišćenje kasni (danas, prošlo > 1h od zakazanog, nije završeno) ───
    const danasTaskovi = tasks.filter(t => t.datum === danas && t.status !== 'zavrseno')
    danasTaskovi.forEach(t => {
      const [th, tm] = (t.vreme || '10:00').split(':').map(Number)
      const taskMin = th * 60 + tm
      if (minNow > taskMin + 60) { // more than 1h late
        const apt = apartmani.find(a => a.id === t.apartman_id)
        const kasnjenje = minNow - taskMin
        notifs.push({
          id:        `late-cleaning-${t.id}`,
          tip:       'late_cleaning',
          prioritet: 'high',
          naslov:    'Čišćenje kasni',
          poruka:    `${apt?.naziv || 'Apartman'} — zakazano ${t.vreme}, kasni ${Math.round(kasnjenje / 60)}h ${kasnjenje % 60}min`,
          akcija:    'cistacije',
          ikona:     '🧹',
        })
      }
    })

    // ── 3. Checkout nije potvrđen (danas, posle 12:00, gost još "potvrdjeno") ──
    if (hour >= 12) {
      const danasCheckouts = rez.filter(r => r.odlazak === danas && r.status === 'potvrdjeno')
      danasCheckouts.forEach(r => {
        const apt = apartmani.find(a => a.id === r.apartman_id)
        notifs.push({
          id:        `checkout-pending-${r.id}`,
          tip:       'checkout_pending',
          prioritet: 'medium',
          naslov:    'Checkout nije potvrđen',
          poruka:    `${r.gost} — ${apt?.naziv || 'apartman'}, trebalo do 11:00`,
          akcija:    'rezervacije',
          ikona:     '🚪',
        })
      })
    }

    // ── 4. Sutra nema čišćenja za check-in ────────────────────────────────────
    const sutraCheckins = rez.filter(r => r.dolazak === sutra && r.status === 'potvrdjeno')
    const sutraTasks    = tasks.filter(t => t.datum === sutra)
    sutraCheckins.forEach(r => {
      if (!sutraTasks.some(t => t.apartman_id === r.apartman_id)) {
        const apt = apartmani.find(a => a.id === r.apartman_id)
        notifs.push({
          id:        `no-cleaning-${r.id}`,
          tip:       'no_cleaning',
          prioritet: 'high',
          naslov:    'Sutra nema čišćenja!',
          poruka:    `${apt?.naziv || 'Apartman'} — ${r.gost} dolazi sutra`,
          akcija:    'cistacije',
          ikona:     '⚠️',
        })
      }
    })

    // ── 5. iCal conflict (preklapanje rezervacija za isti apartman) ───────────
    apartmani.forEach(apt => {
      const aptRez = rez
        .filter(r => r.apartman_id === apt.id && ['potvrdjeno', 'cekanje'].includes(r.status))
        .sort((a, b) => a.dolazak.localeCompare(b.dolazak))

      for (let i = 0; i < aptRez.length - 1; i++) {
        const curr = aptRez[i]
        const next = aptRez[i + 1]
        // Overlap: current checkout > next checkin
        if (curr.odlazak > next.dolazak) {
          notifs.push({
            id:        `conflict-${curr.id}-${next.id}`,
            tip:       'conflict',
            prioritet: 'critical',
            naslov:    'KONFLIKT rezervacija!',
            poruka:    `${apt.naziv}: "${curr.gost}" i "${next.gost}" se preklapaju (${curr.odlazak} vs ${next.dolazak})`,
            akcija:    'rezervacije',
            ikona:     '🔴',
          })
        }
      }
    })

    // ── 6. Apartman bez WiFi šifre (samo jednom upozoriti) ────────────────────
    apartmani.filter(a => !a.wifiSifra && !a.wifi_sifra).forEach(a => {
      notifs.push({
        id:        `no-wifi-${a.id}`,
        tip:       'no_wifi',
        prioritet: 'medium',
        naslov:    'WiFi šifra nedostaje',
        poruka:    `${a.naziv} — gosti ne mogu da dobiju WiFi podatke`,
        akcija:    'podesavanja',
        ikona:     '📶',
      })
    })

    // Sort: critical → high → medium
    const priorityOrder = { critical: 0, high: 1, medium: 2 }
    notifs.sort((a, b) => priorityOrder[a.prioritet] - priorityOrder[b.prioritet])

    setNotifications(notifs)

    // ── Browser push for critical & new high notifications ────────────────────
    triggerBrowserNotifs(notifs)
  }

  function triggerBrowserNotifs(notifs) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const urgent = notifs.filter(n => n.prioritet === 'critical' || n.prioritet === 'high')
    urgent.forEach(n => {
      if (!shownBrowserNotifs.current.has(n.id)) {
        shownBrowserNotifs.current.add(n.id)
        new Notification(`HostOS — ${n.naslov}`, {
          body: n.poruka,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: n.id, // prevents duplicates
        })
      }
    })
  }

  async function requestBrowserPermission() {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  return { notifications, refresh: compute, requestBrowserPermission }
}
