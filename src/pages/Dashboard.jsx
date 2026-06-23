import React, { useState, useEffect, useRef } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import {
  LogIn, LogOut, Sparkles, AlertTriangle, MessageCircle, PhoneCall,
  Euro, Clock, Home, TrendingUp, CalendarCheck, AlertCircle,
  CheckCircle2, Circle, ChevronRight, Plus, Link, Phone, ChevronDown,
  ArrowRight, X, Zap
} from 'lucide-react'
import GuestPortalModal from '../components/GuestPortalModal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase, mapRezervacija, TIP_CONFIG } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { haptic } from '../utils/haptics'

// ─── Dynamic background by time of day ────────────────────────────────────────
function getDobaGradient() {
  const h = new Date().getHours()
  if (h >= 5  && h < 10) return {            // Jutro — toplo zlatno
    bg:  'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    sub: 'text-amber-200',
  }
  if (h >= 10 && h < 17) return {            // Dan — teal (branding)
    bg:  'linear-gradient(135deg, #01696f 0%, #024f53 100%)',
    sub: 'text-teal-200',
  }
  if (h >= 17 && h < 21) return {            // Veče — tamno narandžasto
    bg:  'linear-gradient(135deg, #9a3412 0%, #7c2d12 100%)',
    sub: 'text-orange-200',
  }
  return {                                   // Noć — duboki indigo
    bg:  'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
    sub: 'text-indigo-300',
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr()     { return new Date().toISOString().split('T')[0] }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] }
function tomorrowStr()  { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }
function in7Days()      { const d = new Date(); d.setDate(d.getDate() + 7);  return d.toISOString().split('T')[0] }
function noći(a, b)     { return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000)) }

function waMsg(tel, tekst) { return `https://wa.me/${tel?.replace(/\D/g,'')}?text=${encodeURIComponent(tekst)}` }
function viberUrl(tel)      { return `viber://chat?number=${encodeURIComponent(tel?.replace(/[\s\-()]/g,'') || '')}` }

function checkinTemplate(r, apt) {
  return `Pozdrav ${r.gost}! 👋\n\nVaša rezervacija za *${apt?.naziv || 'apartman'}* je potvrđena.\n\n📅 Check-in: ${r.dolazak} od 14:00\n📅 Check-out: ${r.odlazak} do 11:00\n📍 ${apt?.lokacija || ''}\n\n${apt?.checkinInfo || 'Ključevi su na dogovorenom mestu.'}\n\nSrdačan pozdrav! 🏠`
}
function checkoutTemplate(r, apt) {
  return `Pozdrav ${r.gost}! 🙏\n\nPodsetnik — checkout je *${r.odlazak}* do 11:00.\n\nHvala što ste boravili u *${apt?.naziv || 'apartmanu'}*! ⭐`
}
function pozdrav(ime) {
  const h = new Date().getHours()
  const name = ime?.split(' ')[0] || 'tu'
  if (h >= 5  && h < 12) return { tekst: `Dobro jutro, ${name}`, emoji: '☀️' }
  if (h >= 12 && h < 17) return { tekst: `Dobar dan, ${name}`,   emoji: '👋' }
  if (h >= 17 && h < 21) return { tekst: `Dobro veče, ${name}`,  emoji: '🌆' }
  return { tekst: `Dobra noć, ${name}`, emoji: '🌙' }
}
function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'sada'
  if (m < 60) return `pre ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `pre ${h}h`
  if (h < 48) return 'juče'
  return `pre ${Math.floor(h/24)} dana`
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
function OnboardingScreen({ profile, onApartmanCreated, onNavigate }) {
  const [korak, setKorak] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [naziv, setNaziv]       = useState('')
  const [lokacija, setLokacija] = useState('')
  const [cena, setCena]         = useState('')
  const [icalUrl, setIcalUrl]   = useState('')
  const name = profile?.ime?.split(' ')[0] || 'te'

  async function sacuvajApartman() {
    if (!naziv.trim()) { setError('Naziv je obavezan'); return }
    setSaving(true); setError('')
    const { data, error: err } = await supabase.from('apartmani').insert([{
      naziv: naziv.trim(), lokacija: lokacija.trim(),
      cena_po_noci: parseFloat(cena) || 50, boja: 'var(--color-primary)', kapacitet: 2,
    }]).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    onApartmanCreated(data); setKorak(2)
  }

  async function sacuvajIcal() {
    if (!icalUrl.trim()) { setError('Unesi iCal URL'); return }
    setSaving(true); setError('')
    const { data: apts } = await supabase.from('apartmani').select('id').limit(1)
    const { error: err } = await supabase.from('apartmani').update({ ical_url: icalUrl.trim() }).eq('id', apts?.[0]?.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    onApartmanCreated(); setKorak('done')
  }

  if (korak === 'done') return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Sve je podešeno!</h2>
      <p className="text-slate-400 mb-6">HostOS je spreman za rad.</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-2xl text-white font-bold bg-teal-600">
        Idi na Dashboard →
      </button>
    </div>
  )

  const pct = korak === 1 ? 5 : korak === 2 ? 33 : 66
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-2xl" style={{ backgroundColor: '#01696f20' }}>🏠</div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Dobrodošao{name !== 'te' ? `, ${name}` : ''}!</h1>
          <p className="text-slate-400 mt-1 text-sm">Podesite HostOS za 2 minuta.</p>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-6">
          <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: 'var(--color-primary)', width: `${pct}%` }} />
        </div>
        <div className="space-y-3">
          {/* Step 1 */}
          <div className={`rounded-2xl border bg-white dark:bg-slate-800 overflow-hidden transition-all ${korak === 1 ? 'border-teal-300 dark:border-teal-700 shadow-lg' : korak > 1 ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-700 opacity-50'}`}>
            <div className="p-4 flex items-center gap-3">
              {korak > 1 ? <CheckCircle2 size={20} style={{ color: '#10b981' }} /> : <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white bg-teal-600">1</div>}
              <div><p className="font-bold text-slate-800 dark:text-white">Dodaj prvi apartman</p><p className="text-xs text-slate-400">Naziv, lokacija i cena po noći</p></div>
            </div>
            {korak === 1 && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                <input value={naziv} onChange={e => setNaziv(e.target.value)} placeholder="Naziv apartmana *" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white" />
                <input value={lokacija} onChange={e => setLokacija(e.target.value)} placeholder="Lokacija" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white" />
                <input type="number" value={cena} onChange={e => setCena(e.target.value)} placeholder="Cena po noći (€)" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white" />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button onClick={sacuvajApartman} disabled={saving || !naziv.trim()} className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 bg-teal-600">{saving ? 'Čuvam...' : 'Dodaj apartman →'}</button>
              </div>
            )}
          </div>
          {/* Step 2 */}
          <div className={`rounded-2xl border bg-white dark:bg-slate-800 overflow-hidden transition-all ${korak === 2 ? 'border-teal-300 dark:border-teal-700 shadow-lg' : 'border-slate-200 dark:border-slate-700 opacity-50'}`}>
            <div className="p-4 flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${korak === 2 ? 'text-white' : 'text-slate-400 bg-slate-200 dark:bg-slate-700'}`} style={korak === 2 ? { backgroundColor: 'var(--color-primary)' } : {}}>2</div>
              <div><p className="font-bold text-slate-800 dark:text-white">Dodaj prvu rezervaciju</p><p className="text-xs text-slate-400">Ručno ili uvezi iz Booking-a</p></div>
            </div>
            {korak === 2 && (
              <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-4 grid grid-cols-2 gap-3">
                <button onClick={() => { onNavigate('rezervacije') }} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20">
                  <Plus size={22} className="text-teal-600" /><span className="text-xs font-bold text-slate-700 dark:text-slate-200">Unesi ručno</span>
                </button>
                <button onClick={() => setKorak(3)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                  <Link size={22} className="text-slate-400" /><span className="text-xs font-bold text-slate-500 text-center">Poveži Booking</span>
                </button>
                <button onClick={() => setKorak(3)} className="col-span-2 text-xs text-slate-400 py-1">Preskočim →</button>
              </div>
            )}
          </div>
          {/* Step 3 */}
          <div className={`rounded-2xl border bg-white dark:bg-slate-800 overflow-hidden transition-all ${korak === 3 ? 'border-teal-300 dark:border-teal-700 shadow-lg' : 'border-slate-200 dark:border-slate-700 opacity-50'}`}>
            <div className="p-4 flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${korak === 3 ? 'text-white' : 'text-slate-400 bg-slate-200 dark:bg-slate-700'}`} style={korak === 3 ? { backgroundColor: 'var(--color-primary)' } : {}}>3</div>
              <div><p className="font-bold text-slate-800 dark:text-white">Poveži Booking.com</p><p className="text-xs text-slate-400">Automatski uvoz putem iCal linka</p></div>
            </div>
            {korak === 3 && (
              <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300"><strong>Kako?</strong> Booking.com → Extranet → Kalendar → iCal link</div>
                <input value={icalUrl} onChange={e => setIcalUrl(e.target.value)} placeholder="https://admin.booking.com/hotel/..." className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white" />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button onClick={sacuvajIcal} disabled={saving || !icalUrl.trim()} className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 bg-teal-600">{saving ? 'Čuvam...' : 'Poveži →'}</button>
                <button onClick={() => setKorak('done')} className="w-full text-xs text-slate-400 py-1">Preskočim →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Action Card: Arrival (swipe-to-action) ───────────────────────────────────
function ArrivalCard({ r, apt }) {
  const nights      = noći(r.dolazak, r.odlazak)
  const hasContact  = !!r.kontakt
  const THRESHOLD   = 72
  const MAX_OFFSET  = 92

  const [offset,   setOffset]   = useState(0)
  const [snapping, setSnapping] = useState(false)
  const touchStart = useRef(null)

  function onTouchStart(e) {
    if (!hasContact) return
    touchStart.current = e.touches[0].clientX
    setSnapping(false)
  }

  function onTouchMove(e) {
    if (touchStart.current === null) return
    const dx      = e.touches[0].clientX - touchStart.current
    const clamped = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx))
    // Haptic feedback the moment the threshold is crossed
    if (Math.abs(clamped) >= THRESHOLD && Math.abs(offset) < THRESHOLD) haptic.tap()
    setOffset(clamped)
  }

  function onTouchEnd() {
    if (offset > THRESHOLD && r.kontakt)  window.open(waMsg(r.kontakt, checkinTemplate(r, apt)), '_blank')
    if (offset < -THRESHOLD && r.kontakt) window.location.href = `tel:${r.kontakt}`
    touchStart.current = null
    setSnapping(true)
    setOffset(0)
  }

  // Opacity of the reveals scales from 0 → 1 as offset approaches threshold
  const waAlpha  = Math.min(1, Math.max(0, offset / THRESHOLD))
  const telAlpha = Math.min(1, Math.max(0, -offset / THRESHOLD))

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-sm">

      {/* ── WhatsApp reveal (swipe right) ── */}
      <div
        className="absolute inset-0 bg-green-500 flex items-center gap-3 pl-5 rounded-2xl pointer-events-none"
        style={{ opacity: waAlpha }}
      >
        <MessageCircle size={26} className="text-white" />
        <span className="text-white font-black text-sm">Check-in info</span>
      </div>

      {/* ── Call reveal (swipe left) ── */}
      <div
        className="absolute inset-0 bg-blue-500 flex items-center justify-end gap-3 pr-5 rounded-2xl pointer-events-none"
        style={{ opacity: telAlpha }}
      >
        <span className="text-white font-black text-sm">Pozovi</span>
        <Phone size={26} className="text-white" />
      </div>

      {/* ── Card (slides on swipe) ── */}
      <div
        className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden"
        style={{
          transform:  `translateX(${offset}px)`,
          transition: snapping ? 'transform 0.35s cubic-bezier(0.32,0.72,0,1)' : 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="h-[3px]" style={{ backgroundColor: apt?.boja || '#0d9488' }} />
        <div className="p-4">
          {/* Meta */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: apt?.boja || '#0d9488' }} />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{apt?.naziv || '—'}</span>
            </div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">↓ 14:00</span>
          </div>

          {/* Guest name — krupno, dominantno */}
          <p className="text-xl font-black text-slate-800 dark:text-white leading-tight">{r.gost}</p>
          <p className="text-xs text-slate-400 mt-1">
            {r.brGostiju || 1} gostiju · {nights} {nights === 1 ? 'noć' : 'noći'} ·{' '}
            <span className="font-semibold text-slate-600 dark:text-slate-300">€{r.cena}</span>
          </p>
          {r.napomena && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">📝 {r.napomena}</p>
          )}

          {/* Swipe hint / no-contact fallback */}
          {hasContact ? (
            <div className="mt-3 flex items-center justify-between select-none">
              <span className="text-[11px] text-slate-300 dark:text-slate-600 font-medium">← Pozovi</span>
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />)}
              </div>
              <span className="text-[11px] text-slate-300 dark:text-slate-600 font-medium">WA →</span>
            </div>
          ) : (
            <div className="mt-3 py-2.5 text-center bg-slate-50 dark:bg-slate-700/50 text-slate-400 text-xs rounded-xl">
              Dodaj kontakt za slanje poruka
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Action Card: Departure ────────────────────────────────────────────────────
function DepartureCard({ r, apt, onCheckoutConfirm }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
      <div className="h-[3px] bg-blue-400" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: apt?.boja || '#3b82f6' }} />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{apt?.naziv || '—'}</span>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">↑ 11:00</span>
        </div>
        <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">{r.gost}</p>
        <p className="text-xs text-slate-400 mt-0.5">Checkout danas · <span className="font-semibold text-slate-600 dark:text-slate-300">€{r.cena}</span></p>
        <div className="flex gap-2 mt-3">
          {r.kontakt ? (
            <>
              <a
                href={waMsg(r.kontakt, checkoutTemplate(r, apt))}
                target="_blank" rel="noreferrer"
                className="flex-1 min-h-[48px] bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle size={13} /> Checkout reminder
              </a>
              <a
                href={viberUrl(r.kontakt)}
                className="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              >
                <PhoneCall size={16} />
              </a>
            </>
          ) : (
            <button
              onClick={() => onCheckoutConfirm?.(r.id)}
              className="flex-1 min-h-[48px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <CheckCircle2 size={13} /> Potvrdi checkout
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Cleaning Status Row ───────────────────────────────────────────────────────
function CleaningRow({ task, apt }) {
  const statusCfg = {
    zavrseno: {
      pill: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      label: 'Završeno ✓',
      row: 'bg-white dark:bg-slate-800',
    },
    u_toku: {
      pill: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      label: 'U toku…',
      row: 'bg-blue-50/60 dark:bg-blue-900/10',
    },
    ceka: {
      pill: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      label: 'Na čekanju',
      row: 'bg-white dark:bg-slate-800',
    },
  }
  const s = statusCfg[task.status] || statusCfg.ceka
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${s.row}`}>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: (apt?.boja || '#94a3b8') + '20' }}>
          <Home size={13} style={{ color: apt?.boja || '#94a3b8' }} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{apt?.naziv || '—'}</p>
        <p className="text-xs text-slate-400">{task.vreme || '10:00'}{task.napomena ? ` · ${task.napomena}` : ''}</p>
      </div>
      <span className={`text-xs font-bold flex-shrink-0 px-2.5 py-1 rounded-full ${s.pill}`}>{s.label}</span>
    </div>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ emoji, title, count, boja }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-3">
      <span className="text-base">{emoji}</span>
      <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{title}</h2>
      {count > 0 && (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: boja || 'var(--color-primary)' }}>
          {count}
        </span>
      )}
    </div>
  )
}

// ─── Activity Feed ─────────────────────────────────────────────────────────────
function ActivityFeed({ userId }) {
  const [aktivnosti, setAktivnosti] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!userId) return
    load()
    const channel = supabase.channel(`activity-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' },
        payload => setAktivnosti(prev => [payload.new, ...prev].slice(0, 20)))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  async function load() {
    const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(20)
    setAktivnosti(data || [])
    setLoading(false)
  }

  const cfg = (tip) => TIP_CONFIG[tip] || { emoji: '•', label: tip, boja: '#94a3b8' }

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="flex gap-3"><div className="skeleton w-8 h-8 rounded-full flex-shrink-0" /><div className="flex-1 space-y-1.5"><div className="skeleton h-3 w-3/4 rounded" /><div className="skeleton h-2.5 w-1/3 rounded" /></div></div>)}</div>

  if (aktivnosti.length === 0) return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2 opacity-30">📋</p>
      <p className="text-sm text-slate-400">Aktivnosti se pojavljuju ovde</p>
    </div>
  )

  return (
    <div className="space-y-0 divide-y divide-slate-50 dark:divide-slate-700/50">
      {aktivnosti.map((a, i) => {
        const c = cfg(a.tip)
        return (
          <div key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5" style={{ backgroundColor: c.boja + '18' }}>
              <span style={{ fontSize: 15 }}>{c.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">{a.opis}</p>
              <p className="text-xs text-slate-400 mt-0.5">{relTime(a.created_at)}</p>
            </div>
            {Date.now() - new Date(a.created_at).getTime() < 60000 && (
              <div className="flex-shrink-0 mt-2">
                <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75" style={{ backgroundColor: c.boja }} /><span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: c.boja }} /></span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Chart tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>€{p.value.toLocaleString()}</p>)}
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ apartmani = [], onApartmaniChange, onNavigate, syncedRez = [] }) {
  const { user, profile } = useAuth()
  const [rezervacije, setRezervacije] = useState([])
  const [tasks, setTasks]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [sutraExpanded, setSutraExpanded] = useState(false)
  const [guestPortalApt, setGuestPortalApt] = useState(null)

  const danas = todayStr()
  const juce  = yesterdayStr()
  const sutra = tomorrowStr()
  const za7   = in7Days()

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const [{ data: rez }, { data: tsk }] = await Promise.all([
      supabase.from('rezervacije').select('*').order('dolazak'),
      supabase.from('cistacke_tasks').select('*').order('datum'),
    ])
    setRezervacije((rez || []).map(mapRezervacija))
    setTasks(tsk || [])
    setLoading(false)
  }

  async function confirmCheckout(rezId) {
    await supabase.from('rezervacije').update({ status: 'zavrseno' }).eq('id', rezId)
    await load()
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  // Dedup: localStorage items that were already UPSERT-ed to Supabase are
  // matched by ical_uid — prevents showing the same reservation twice.
  const sveRez = [
    ...rezervacije,
    ...syncedRez.filter(s =>
      !rezervacije.some(r => r.id === s.id || (s.icalUid && r.icalUid === s.icalUid))
    ),
  ]
  const danasCheckin   = sveRez.filter(r => r.dolazak === danas && r.status === 'potvrdjeno')
  const danasCheckout  = sveRez.filter(r => r.odlazak === danas && r.status === 'potvrdjeno')
  const danasTask      = tasks.filter(t => t.datum === danas)
  const kasniCheckin   = sveRez.filter(r => r.dolazak === juce && r.odlazak >= danas && r.status === 'potvrdjeno')
  const sutraCheckins  = sveRez.filter(r => r.dolazak === sutra && r.status === 'potvrdjeno')
  const sutraTasks     = tasks.filter(t => t.datum === sutra)
  const alertCistenje  = sutraCheckins.filter(r => !sutraTasks.some(t => t.apartman_id === r.apartmanId))
  const novacDanas     = danasCheckin.reduce((s, r) => s + (r.cena || 0), 0)
  const narednih7      = sveRez.filter(r => r.dolazak > danas && r.dolazak <= za7 && r.status === 'potvrdjeno').slice(0, 5)
  const mesecniPrihod  = sveRez.filter(r => r.dolazak?.startsWith(new Date().toISOString().slice(0,7)) && ['potvrdjeno','zavrseno'].includes(r.status)).reduce((s,r) => s+(r.cena||0), 0)

  const hasApartman    = apartmani.length > 0
  const hasRezervacija = sveRez.length > 0
  const onboardingDone = hasApartman && hasRezervacija && apartmani.some(a => a.ical_url)

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - 5 + i)
    const key = d.toISOString().slice(0, 7)
    const prihod = sveRez.filter(r => r.dolazak?.startsWith(key)).reduce((s,r) => s+(r.cena||0), 0)
    return { mesec: d.toLocaleDateString('sr-RS', { month: 'short' }), prihod }
  })

  const poz = pozdrav(profile?.ime)

  const [arrivalsRef]   = useAutoAnimate({ duration: 200 })
  const [departuresRef] = useAutoAnimate({ duration: 200 })
  const [cleaningRef]   = useAutoAnimate({ duration: 200 })

  // ── Urgency ───────────────────────────────────────────────────────────────
  const urgent = [
    ...kasniCheckin.map(r => ({ tip: 'kasni', r })),
    ...alertCistenje.map(r => ({ tip: 'cistenje', r })),
  ]

  // ── Stats strip ───────────────────────────────────────────────────────────
  const stats = [
    { label: 'Dolasci',    value: danasCheckin.length,  boja: '#0d9488', Ikona: LogIn,     alert: false },
    { label: 'Odlasci',    value: danasCheckout.length, boja: '#3b82f6', Ikona: LogOut,    alert: false },
    { label: 'Čišćenja',   value: danasTask.length,     boja: '#8b5cf6', Ikona: Sparkles,  alert: false },
    { label: 'Prihod',     value: `€${novacDanas}`,     boja: '#10b981', Ikona: Euro,      alert: false },
    { label: 'Kasni',      value: kasniCheckin.length,  boja: kasniCheckin.length > 0 ? '#ef4444' : '#94a3b8', Ikona: Clock, alert: kasniCheckin.length > 0 },
    { label: 'Narednih 7', value: narednih7.length,     boja: '#f59e0b', Ikona: CalendarCheck, alert: false },
  ]

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>

  if (!hasApartman) return <OnboardingScreen profile={profile} onNavigate={onNavigate} onApartmanCreated={(apt) => { onApartmaniChange?.(); load() }} />

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto md:max-w-7xl space-y-5">

      {/* ── Greeting ── */}
      {(() => { const g = getDobaGradient(); return (
      <div className="rounded-2xl px-5 py-4 shadow-md flex items-center justify-between" style={{ background: g.bg }}>
        <div>
          <h1 className="text-xl font-black text-white">{poz.tekst} <span>{poz.emoji}</span></h1>
          <p className={`${g.sub} text-xs mt-0.5 capitalize`}>
            {new Date().toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
            {danasCheckin.length + danasCheckout.length + danasTask.length > 0
              ? ` · ${danasCheckin.length + danasCheckout.length + danasTask.length} stavki danas`
              : ' · Slobodan dan 🎉'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white tabular-nums">€{mesecniPrihod.toLocaleString()}</p>
          <p className={`${g.sub} text-[11px]`}>ovaj mesec</p>
        </div>
      </div>
      )})()}

      {/* ── Stats strip (horizontal scroll on mobile) ── */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-6" style={{ scrollbarWidth: 'none' }}>
        {stats.map(s => (
          <div key={s.label} className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border shadow-sm min-w-[110px] md:min-w-0 ${s.alert ? 'border-red-200 dark:border-red-800' : 'border-slate-100 dark:border-slate-700'}`}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.boja + '18' }}>
              {s.alert
                ? <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>
                : <s.Ikona size={14} style={{ color: s.boja }} />
              }
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-slate-800 dark:text-white tabular-nums leading-none">{s.value}</p>
              <p className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Urgent banner ── */}
      {urgent.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-red-200 dark:border-red-800">
          <div className="bg-red-500 px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={14} className="text-white flex-shrink-0" />
            <span className="text-white font-bold text-sm">{urgent.length === 1 ? '1 problem' : `${urgent.length} problemi`} — pažnja potrebna</span>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 divide-y divide-red-100 dark:divide-red-900/40">
            {kasniCheckin.map(r => {
              const apt = apartmani.find(a => a.id === r.apartmanId)
              return (
                <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Kasni check-in — {r.gost}</p>
                    <p className="text-xs text-slate-500">{apt?.naziv} · dolazak bio {r.dolazak}</p>
                  </div>
                  {r.kontakt && (
                    <a href={waMsg(r.kontakt, `Pozdrav ${r.gost}, proveravamo status. Jeste li stigli?`)} target="_blank" rel="noreferrer"
                      className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                      <MessageCircle size={14} />
                    </a>
                  )}
                </div>
              )
            })}
            {alertCistenje.map(r => {
              const apt = apartmani.find(a => a.id === r.apartmanId)
              return (
                <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Sutra nema čišćenja!</p>
                    <p className="text-xs text-slate-500">{r.gost} dolazi sutra · {apt?.naziv}</p>
                  </div>
                  <button onClick={() => onNavigate('cistacije')}
                    className="flex-shrink-0 px-4 min-h-[48px] bg-amber-500 text-white text-xs font-bold rounded-xl active:scale-90 transition-transform flex items-center">
                    Dodaj →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Main 2-col layout on desktop, single col on mobile ── */}
      <div className="md:grid md:grid-cols-[1fr_380px] md:gap-5 space-y-5 md:space-y-0">

        {/* ── LEFT: Today Feed ── */}
        <div className="space-y-5">

          {/* Arrivals */}
          {danasCheckin.length > 0 && (
            <div>
              <SectionHeader emoji="🛬" title="Dolasci danas" count={danasCheckin.length} boja="#0d9488" />
              <div ref={arrivalsRef} className="space-y-3">
                {danasCheckin.map(r => <ArrivalCard key={r.id} r={r} apt={apartmani.find(a => a.id === r.apartmanId)} />)}
              </div>
            </div>
          )}

          {/* Departures */}
          {danasCheckout.length > 0 && (
            <div>
              <SectionHeader emoji="🛫" title="Odlasci danas" count={danasCheckout.length} boja="#3b82f6" />
              <div ref={departuresRef} className="space-y-3">
                {danasCheckout.map(r => <DepartureCard key={r.id} r={r} apt={apartmani.find(a => a.id === r.apartmanId)} onCheckoutConfirm={confirmCheckout} />)}
              </div>
            </div>
          )}

          {/* Cleanings */}
          {danasTask.length > 0 && (
            <div>
              <SectionHeader emoji="🧹" title="Čišćenja danas" count={danasTask.length} boja="#8b5cf6" />
              <div ref={cleaningRef} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                {danasTask.map(t => <CleaningRow key={t.id} task={t} apt={apartmani.find(a => a.id === t.apartman_id)} />)}
              </div>
            </div>
          )}

          {/* Empty day */}
          {danasCheckin.length === 0 && danasCheckout.length === 0 && danasTask.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Slobodan dan</p>
              <p className="text-xs text-slate-400 mt-1">Nema check-in-ova, odlazaka ni čišćenja</p>
            </div>
          )}

          {/* Tomorrow preview */}
          <div>
            <button
              onClick={() => setSutraExpanded(!sutraExpanded)}
              className="flex items-center gap-2 px-1 mb-3 w-full group"
            >
              <span className="text-base">📅</span>
              <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Sutra</h2>
              {sutraCheckins.length > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white bg-slate-400">{sutraCheckins.length}</span>
              )}
              <ChevronDown size={14} className={`ml-auto text-slate-400 transition-transform duration-200 ${sutraExpanded ? 'rotate-180' : ''}`} />
            </button>

            {sutraExpanded && (
              <div className="space-y-3 animate-slide-up">
                {sutraCheckins.length === 0 ? (
                  <p className="text-sm text-slate-400 px-1">Nema dolazaka sutra</p>
                ) : (
                  sutraCheckins.map(r => <ArrivalCard key={r.id} r={r} apt={apartmani.find(a => a.id === r.apartmanId)} />)
                )}
              </div>
            )}

            {!sutraExpanded && sutraCheckins.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 divide-y divide-slate-100 dark:divide-slate-700">
                {sutraCheckins.map(r => {
                  const apt = apartmani.find(a => a.id === r.apartmanId)
                  return (
                    <div key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: apt?.boja || '#94a3b8' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{r.gost}</p>
                        <p className="text-xs text-slate-400">{apt?.naziv}</p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">14:00</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Activity + Stats (desktop only, on mobile shows below) ── */}
        <div className="space-y-4">
          {/* Activity feed */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
                </span>
                Aktivnosti
              </h2>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">Live</span>
            </div>
            <ActivityFeed userId={user?.id} />
          </div>

          {/* Narednih 7 dana */}
          {narednih7.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <CalendarCheck size={15} className="text-slate-400" /> Narednih 7 dana
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white bg-teal-600">{narednih7.length}</span>
              </h2>
              <div className="space-y-3">
                {narednih7.map(r => {
                  const apt = apartmani.find(a => a.id === r.apartmanId)
                  return (
                    <div key={r.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (apt?.boja||'#94a3b8')+'20' }}>
                        <Home size={12} style={{ color: apt?.boja||'#94a3b8' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{r.gost}</p>
                        <p className="text-xs text-slate-400">{r.dolazak} · {apt?.naziv}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">€{r.cena}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Apartmani + Guest Portal links */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Home size={15} className="text-slate-400" /> Apartmani
            </h2>
            <div className="space-y-2">
              {apartmani.map(a => {
                const zauzet  = sveRez.some(r => r.apartmanId === a.id && r.dolazak <= danas && r.odlazak > danas && r.status === 'potvrdjeno')
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.boja + '20' }}>
                      <Home size={13} style={{ color: a.boja }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{a.naziv}</p>
                      <p className="text-xs text-slate-400">{zauzet ? 'Zauzet' : 'Slobodan'}</p>
                    </div>
                    <button
                      onClick={() => setGuestPortalApt(a)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all active:scale-95"
                      style={{ color: a.guest_token ? 'var(--color-primary)' : '#94a3b8', borderColor: a.guest_token ? '#01696f40' : '#e2e8f0', backgroundColor: a.guest_token ? '#01696f08' : 'transparent' }}
                      title="Guest Portal"
                    >
                      <Link size={11} /> {a.guest_token ? 'Portal' : 'Podesi'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mini chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <TrendingUp size={15} className="text-slate-400" /> Prihodi
            </h2>
            <p className="text-xs text-slate-400 mb-4">Poslednjih 6 meseci</p>
            {chartData.every(d => d.prihod === 0)
              ? <div className="flex items-center justify-center h-28 text-slate-300 dark:text-slate-600 text-sm">Nema podataka</div>
              : <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="mesec" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => `€${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="prihod" fill="#01696f" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

      </div>

      {/* ── Guest Portal Modal ── */}
      {guestPortalApt && (
        <GuestPortalModal
          apartman={guestPortalApt}
          onClose={() => setGuestPortalApt(null)}
          onSaved={() => { onApartmaniChange?.(); setGuestPortalApt(null) }}
        />
      )}
    </div>
  )
}
