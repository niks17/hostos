import React, { useState, useEffect } from 'react'
import {
  LogIn, LogOut, Sparkles, AlertTriangle, MessageCircle, PhoneCall,
  Euro, Clock, Home, TrendingUp, CalendarCheck, AlertCircle, ChevronRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase, mapRezervacija } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr()     { return new Date().toISOString().split('T')[0] }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] }
function tomorrowStr()  { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }
function in7Days()      { const d = new Date(); d.setDate(d.getDate() + 7);  return d.toISOString().split('T')[0] }

function waMsg(tel, tekst)  { return `https://wa.me/${tel?.replace(/\D/g, '')}?text=${encodeURIComponent(tekst)}` }
function viberUrl(tel)       { return `viber://chat?number=${encodeURIComponent(tel?.replace(/[\s\-()]/g, '') || '')}` }

function checkinTemplate(r, apt) {
  return `Pozdrav ${r.gost}! 👋\n\nVaša rezervacija za *${apt?.naziv || 'apartman'}* je potvrđena.\n\n📅 Check-in: ${r.dolazak} od 14:00\n📅 Check-out: ${r.odlazak} do 11:00\n📍 ${apt?.lokacija || ''}\n\n${apt?.checkinInfo || 'Ključevi su na dogovorenom mestu.'}\n\nSrdačan pozdrav! 🏠`
}
function checkoutTemplate(r, apt) {
  return `Pozdrav ${r.gost}! 🙏\n\nPodsetnik — checkout je *${r.odlazak}* do 11:00.\n\nHvala što ste boravili u *${apt?.naziv || 'apartmanu'}*! Nadam se da se vidimo opet. ⭐`
}

function pozdrav(ime) {
  const h = new Date().getHours()
  const name = ime?.split(' ')[0] || 'tu'
  if (h >= 5  && h < 12) return { tekst: `Dobro jutro, ${name}`, emoji: '☀️' }
  if (h >= 12 && h < 17) return { tekst: `Dobar dan, ${name}`, emoji: '👋' }
  if (h >= 17 && h < 21) return { tekst: `Dobro veče, ${name}`, emoji: '🌆' }
  return { tekst: `Dobra noć, ${name}`, emoji: '🌙' }
}

// ─── Stat Tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, boja, alert: isAlert, Ikona, puls }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border shadow-sm flex flex-col gap-1 p-4 min-w-0
      ${isAlert ? 'border-red-300 dark:border-red-700' : 'border-slate-100 dark:border-slate-700'}`}>

      {/* top accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ backgroundColor: boja }} />

      <div className="flex items-center justify-between mb-1">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: boja + '18' }}>
          <Ikona size={15} style={{ color: boja }} />
        </div>
        {puls && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
      </div>

      <p className="text-2xl font-black text-slate-800 dark:text-white tabular-nums leading-none">{value}</p>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-slate-400 truncate mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Timeline item ─────────────────────────────────────────────────────────────
function TimelineItem({ item, apartmani }) {
  const apt = item.rez
    ? apartmani.find(a => a.id === item.rez.apartmanId)
    : apartmani.find(a => a.id === item.task?.apartman_id)
  const tel = item.rez?.kontakt

  const config = {
    checkin:  { label: 'Check-in',  Ikona: LogIn,    bg: 'bg-teal-50   dark:bg-teal-900/20',   border: 'border-teal-200   dark:border-teal-800',   ikonaBg: 'bg-teal-100   dark:bg-teal-900/40',   ikonaText: 'text-teal-600   dark:text-teal-400'   },
    checkout: { label: 'Checkout',  Ikona: LogOut,   bg: 'bg-blue-50   dark:bg-blue-900/20',   border: 'border-blue-200   dark:border-blue-800',   ikonaBg: 'bg-blue-100   dark:bg-blue-900/40',   ikonaText: 'text-blue-600   dark:text-blue-400'   },
    cistenje: { label: 'Čišćenje', Ikona: Sparkles, bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', ikonaBg: 'bg-purple-100 dark:bg-purple-900/40', ikonaText: 'text-purple-600 dark:text-purple-400' },
  }
  const c = config[item.tip]
  const { Ikona } = c

  return (
    <div className={`flex gap-4 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">{item.vreme}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.ikonaBg}`}>
          <Ikona size={15} className={c.ikonaText} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-[10px] font-bold uppercase tracking-wide ${c.ikonaText}`}>{c.label}</span>
        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
          {item.rez?.gost || apt?.naziv || '—'}
        </p>
        <p className="text-xs text-slate-400 truncate">{apt?.naziv || '—'}</p>
      </div>
      {tel && item.tip !== 'cistenje' && (
        <div className="flex gap-1.5 flex-shrink-0 items-center">
          <a href={waMsg(tel, item.tip === 'checkin' ? checkinTemplate(item.rez, apt) : checkoutTemplate(item.rez, apt))}
            target="_blank" rel="noreferrer"
            className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-400 hover:text-green-600 transition-colors shadow-sm"
            title="WhatsApp">
            <MessageCircle size={14} />
          </a>
          <a href={viberUrl(tel)}
            className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-400 hover:text-purple-600 transition-colors shadow-sm"
            title="Viber">
            <PhoneCall size={14} />
          </a>
        </div>
      )}
      {item.tip === 'cistenje' && (
        <div className="flex-shrink-0 flex items-center">
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
            item.task?.status === 'zavrseno' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
            item.task?.status === 'u_toku'   ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            'bg-amber-100 text-amber-700'
          }`}>
            {item.task?.status === 'zavrseno' ? 'Završeno' : item.task?.status === 'u_toku' ? 'U toku' : 'Čeka'}
          </span>
        </div>
      )}
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

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard({ apartmani = [] }) {
  const { user, profile } = useAuth()
  const [rezervacije, setRezervacije] = useState([])
  const [tasks, setTasks]             = useState([])
  const [loading, setLoading]         = useState(true)

  const danas   = todayStr()
  const juce    = yesterdayStr()
  const sutra   = tomorrowStr()
  const za7     = in7Days()

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

  // ── Core metrics ──────────────────────────────────────────────────────────
  const danasCheckin  = rezervacije.filter(r => r.dolazak === danas && r.status === 'potvrdjeno')
  const danasCheckout = rezervacije.filter(r => r.odlazak === danas && r.status === 'potvrdjeno')
  const danasTask     = tasks.filter(t => t.datum === danas)

  // Kasni check-in: gost trebao doći juče, odlazak nije prošao, status još 'potvrdjeno'
  const kasniCheckin  = rezervacije.filter(r =>
    r.dolazak === juce &&
    r.odlazak >= danas &&
    r.status  === 'potvrdjeno'
  )

  // Novac koji stiže danas (od check-in-ova)
  const novacDanas = danasCheckin.reduce((sum, r) => sum + (r.cena || 0), 0)

  // ── Today's timeline ──────────────────────────────────────────────────────
  const timeline = [
    ...danasCheckout.map(r => ({ tip: 'checkout', vreme: '11:00', rez: r })),
    ...danasTask.map(t     => ({ tip: 'cistenje', vreme: t.vreme || '10:00', task: t })),
    ...danasCheckin.map(r  => ({ tip: 'checkin',  vreme: '14:00', rez: r })),
  ].sort((a, b) => a.vreme.localeCompare(b.vreme))

  // ── Alerts ────────────────────────────────────────────────────────────────
  const sutraCheckins = rezervacije.filter(r => r.dolazak === sutra && r.status === 'potvrdjeno')
  const sutraTasks    = tasks.filter(t => t.datum === sutra)
  const alertCistenje = sutraCheckins.filter(r => !sutraTasks.some(t => t.apartman_id === r.apartmanId))
  const alertWifi     = apartmani.filter(a => !a.wifiSifra)
  const ukupnoAlerti  = kasniCheckin.length + alertCistenje.length + alertWifi.length

  // ── Upcoming 7 days ───────────────────────────────────────────────────────
  const narednih7 = rezervacije
    .filter(r => r.dolazak > danas && r.dolazak <= za7 && r.status === 'potvrdjeno')
    .slice(0, 5)

  // ── KPI ───────────────────────────────────────────────────────────────────
  const ovajMesec     = new Date().toISOString().slice(0, 7)
  const mesecniPrihod = rezervacije
    .filter(r => r.dolazak?.startsWith(ovajMesec) && ['potvrdjeno', 'zavrseno'].includes(r.status))
    .reduce((sum, r) => sum + (r.cena || 0), 0)

  // ── Chart ─────────────────────────────────────────────────────────────────
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 5 + i)
    const key    = d.toISOString().slice(0, 7)
    const prihod = rezervacije.filter(r => r.dolazak?.startsWith(key)).reduce((s, r) => s + (r.cena || 0), 0)
    return { mesec: d.toLocaleDateString('sr-RS', { month: 'short' }), prihod }
  })

  const poz = pozdrav(profile?.ime)

  // ── Stat tiles definition ─────────────────────────────────────────────────
  const tiles = [
    {
      label: 'Dolasci',
      value: danasCheckin.length,
      sub:   danasCheckin.length === 0 ? 'Nema danas'
           : danasCheckin.length === 1 ? danasCheckin[0].gost
           : `${danasCheckin[0].gost} +${danasCheckin.length - 1}`,
      boja:  '#0d9488',
      Ikona: LogIn,
      alert: false,
      puls:  false,
    },
    {
      label: 'Odlasci',
      value: danasCheckout.length,
      sub:   danasCheckout.length === 0 ? 'Nema danas'
           : danasCheckout.length === 1 ? danasCheckout[0].gost
           : `${danasCheckout[0].gost} +${danasCheckout.length - 1}`,
      boja:  '#3b82f6',
      Ikona: LogOut,
      alert: false,
      puls:  false,
    },
    {
      label: 'Čišćenja',
      value: danasTask.length,
      sub:   danasTask.length === 0 ? 'Nema danas'
           : `${danasTask.filter(t => t.status === 'zavrseno').length}/${danasTask.length} završeno`,
      boja:  '#8b5cf6',
      Ikona: Sparkles,
      alert: false,
      puls:  false,
    },
    {
      label: 'Stiže danas',
      value: novacDanas > 0 ? `€${novacDanas.toLocaleString()}` : '€0',
      sub:   danasCheckin.length > 0 ? `od ${danasCheckin.length} check-in${danasCheckin.length > 1 ? '-a' : '-a'}` : 'Nema naplate',
      boja:  '#10b981',
      Ikona: Euro,
      alert: false,
      puls:  false,
    },
    {
      label: 'Kasni check-in',
      value: kasniCheckin.length,
      sub:   kasniCheckin.length === 0 ? 'Sve ok ✓'
           : kasniCheckin.length === 1 ? `${kasniCheckin[0].gost} nije stigao`
           : `${kasniCheckin.length} gosta nisu stigla`,
      boja:  kasniCheckin.length > 0 ? '#ef4444' : '#94a3b8',
      Ikona: Clock,
      alert: kasniCheckin.length > 0,
      puls:  kasniCheckin.length > 0,
    },
    {
      label: 'Poruke',
      value: '—',
      sub:   'Uskoro',
      boja:  '#f59e0b',
      Ikona: MessageCircle,
      alert: false,
      puls:  false,
    },
  ]

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">

      {/* ── Greeting ── */}
      <div className="bg-gradient-to-br from-[#01696f] to-[#024f53] rounded-2xl px-6 py-5 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">
              {poz.tekst} <span>{poz.emoji}</span>
            </h1>
            <p className="text-teal-200 mt-0.5 text-sm capitalize">
              {new Date().toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
              {timeline.length > 0
                ? ` · ${timeline.length} ${timeline.length === 1 ? 'stavka' : timeline.length < 5 ? 'stavke' : 'stavki'} danas`
                : ' · Slobodan dan 🎉'}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-3xl font-black text-white tabular-nums">€{mesecniPrihod.toLocaleString()}</p>
            <p className="text-teal-300 text-xs mt-0.5">prihod ovog meseca</p>
          </div>
        </div>
      </div>

      {/* ── 6 Stat tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map(t => (
          <StatTile key={t.label} {...t} />
        ))}
      </div>

      {/* ── Problem alert banner ── */}
      {ukupnoAlerti > 0 && (
        <div className="rounded-2xl overflow-hidden border border-red-200 dark:border-red-800 shadow-sm">
          <div className="bg-red-500 px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={15} className="text-white flex-shrink-0" />
            <span className="text-white font-bold text-sm">
              {ukupnoAlerti === 1 ? '1 problem zahteva pažnju' : `${ukupnoAlerti} problema zahtevaju pažnju`}
            </span>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 divide-y divide-red-100 dark:divide-red-900/40">
            {kasniCheckin.map(r => {
              const apt = apartmani.find(a => a.id === r.apartmanId)
              return (
                <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      Kasni check-in — {r.gost}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Check-in bio {r.dolazak} · boravak do {r.odlazak} · {apt?.naziv || '—'}
                    </p>
                  </div>
                  {r.kontakt && (
                    <a href={waMsg(r.kontakt, `Pozdrav ${r.gost}, proveravamo da li ste stigli u apartman. Jeste li ok?`)}
                      target="_blank" rel="noreferrer"
                      className="ml-auto flex-shrink-0 p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors">
                      <MessageCircle size={13} />
                    </a>
                  )}
                </div>
              )
            })}
            {alertCistenje.map(r => {
              const apt = apartmani.find(a => a.id === r.apartmanId)
              return (
                <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                  <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      Check-in sutra — nema čišćenja
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {r.gost} · {apt?.naziv}
                    </p>
                  </div>
                </div>
              )
            })}
            {alertWifi.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">WiFi šifra nije uneta</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.naziv} — dodaj u podešavanjima</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's timeline ── */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
          Raspored danas
        </h2>
        {timeline.length > 0 ? (
          <div className="space-y-2.5">
            {timeline.map((item, i) => (
              <TimelineItem key={i} item={item} apartmani={apartmani} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Slobodan dan — nema check-in-ova ni čišćenja</p>
          </div>
        )}
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Upcoming 7 days */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <CalendarCheck size={16} className="text-slate-400" />
            Narednih 7 dana
            {narednih7.length > 0 && (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#01696f' }}>
                {narednih7.length}
              </span>
            )}
          </h2>
          {narednih7.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Nema rezervacija u narednih 7 dana</p>
          ) : (
            <div className="space-y-3">
              {narednih7.map(r => {
                const apt = apartmani.find(a => a.id === r.apartmanId)
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (apt?.boja || '#94a3b8') + '20' }}>
                      <Home size={13} style={{ color: apt?.boja || '#94a3b8' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{r.gost}</p>
                      <p className="text-xs text-slate-400 truncate">{r.dolazak} · {apt?.naziv}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">€{r.cena}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Apartments status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Home size={16} className="text-slate-400" />
            Apartmani
          </h2>
          {apartmani.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Dodaj apartman da počneš</p>
          ) : (
            <div className="space-y-2.5">
              {apartmani.map(a => {
                const zauzet   = rezervacije.some(r =>
                  r.apartmanId === a.id && r.dolazak <= danas && r.odlazak > danas && r.status === 'potvrdjeno'
                )
                const sledeci  = rezervacije.find(r =>
                  r.apartmanId === a.id && r.dolazak > danas && r.status === 'potvrdjeno'
                )
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: a.boja + '20' }}>
                      <Home size={15} style={{ color: a.boja }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{a.naziv}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {zauzet
                          ? sledeci ? `Sledeći: ${sledeci.dolazak}` : 'Nema sledeće'
                          : sledeci ? `Slobodan · sledeći ${sledeci.dolazak}` : 'Slobodan'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                      zauzet
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {zauzet ? 'Zauzet' : 'Slobodan'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Revenue chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" />
            Prihodi
          </h2>
          <p className="text-xs text-slate-400 mb-4 mt-0.5">Poslednjih 6 meseci</p>
          {chartData.every(d => d.prihod === 0) ? (
            <div className="flex items-center justify-center h-36 text-slate-300 dark:text-slate-600 text-sm">
              Nema podataka
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="mesec" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} tickFormatter={v => `€${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="prihod" name="Prihod" fill="#01696f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  )
}
