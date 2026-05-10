import React, { useState, useEffect } from 'react'
import { Home, TrendingUp, CalendarCheck, AlertTriangle, MessageCircle, PhoneCall, Sparkles, LogIn, LogOut, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase, mapRezervacija } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Helpers ──────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split('T')[0] }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }
function in7Days() { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] }

function waMsg(tel, tekst) { return `https://wa.me/${tel?.replace(/\D/g, '')}?text=${encodeURIComponent(tekst)}` }
function viberUrl(tel) { return `viber://chat?number=${encodeURIComponent(tel?.replace(/[\s\-()]/g, '') || '')}` }

function checkinTemplate(r, apt) {
  return `Pozdrav ${r.gost}! 👋\n\nVaša rezervacija za *${apt?.naziv || 'apartman'}* je potvrđena.\n\n📅 Check-in: ${r.dolazak} od 14:00\n📅 Check-out: ${r.odlazak} do 11:00\n📍 ${apt?.lokacija || ''}\n\n${apt?.checkinInfo || 'Ključevi su na dogovorenom mestu.'}\n\nSrdačan pozdrav! 🏠`
}
function checkoutTemplate(r, apt) {
  return `Pozdrav ${r.gost}! 🙏\n\nPodsetnik — checkout je *${r.odlazak}* do 11:00.\n\nHvala što ste boravili u *${apt?.naziv || 'apartmanu'}*! Nadam se da se vidimo opet. ⭐`
}

function pozdrav(ime) {
  const h = new Date().getHours()
  const name = ime?.split(' ')[0] || 'tu'
  if (h >= 5 && h < 12) return { tekst: `Dobro jutro, ${name}`, emoji: '☀️' }
  if (h >= 12 && h < 17) return { tekst: `Dobar dan, ${name}`, emoji: '👋' }
  if (h >= 17 && h < 21) return { tekst: `Dobro veče, ${name}`, emoji: '🌆' }
  return { tekst: `Dobra noć, ${name}`, emoji: '🌙' }
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>€{p.value.toLocaleString()}</p>)}
    </div>
  )
}

// ─── Timeline item ─────────────────────────────────────────────────────────
function TimelineItem({ item, apartmani }) {
  const apt = item.rez ? apartmani.find(a => a.id === item.rez.apartmanId) : apartmani.find(a => a.id === item.task?.apartman_id)
  const tel = item.rez?.kontakt

  const config = {
    checkin: { label: 'Check-in', ikona: LogIn, boja: 'teal', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', ikonaBg: 'bg-teal-100 dark:bg-teal-900/40', ikonaText: 'text-teal-600 dark:text-teal-400' },
    checkout: { label: 'Checkout', ikona: LogOut, boja: 'blue', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', ikonaBg: 'bg-blue-100 dark:bg-blue-900/40', ikonaText: 'text-blue-600 dark:text-blue-400' },
    cistenje: { label: 'Čišćenje', ikona: Sparkles, boja: 'purple', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', ikonaBg: 'bg-purple-100 dark:bg-purple-900/40', ikonaText: 'text-purple-600 dark:text-purple-400' },
  }
  const c = config[item.tip]
  const Ikona = c.ikona

  return (
    <div className={`flex gap-4 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">{item.vreme}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.ikonaBg}`}>
          <Ikona size={15} className={c.ikonaText} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${c.ikonaText}`}>{c.label}</span>
        </div>
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
            item.task?.status === 'u_toku' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {item.task?.status === 'zavrseno' ? 'Završeno' : item.task?.status === 'u_toku' ? 'U toku' : 'Čeka'}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function Dashboard({ apartmani = [], syncedRez = [] }) {
  const { user, profile } = useAuth()
  const [rezervacije, setRezervacije] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const danas = todayStr()
  const sutra = tomorrowStr()
  const za7 = in7Days()

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

  // ── Today's timeline ──
  const danasCheckout = rezervacije.filter(r => r.odlazak === danas && r.status === 'potvrdjeno')
  const danasCheckin  = rezervacije.filter(r => r.dolazak === danas && r.status === 'potvrdjeno')
  const danasTask     = tasks.filter(t => t.datum === danas)

  const timeline = [
    ...danasCheckout.map(r => ({ tip: 'checkout', vreme: '11:00', rez: r })),
    ...danasTask.map(t => ({ tip: 'cistenje', vreme: t.vreme || '10:00', task: t })),
    ...danasCheckin.map(r => ({ tip: 'checkin', vreme: '14:00', rez: r })),
  ].sort((a, b) => a.vreme.localeCompare(b.vreme))

  // ── Alerts ──
  const sutraCheckins = rezervacije.filter(r => r.dolazak === sutra && r.status === 'potvrdjeno')
  const sutraTasks    = tasks.filter(t => t.datum === sutra)
  const alertCistenje = sutraCheckins.filter(r => !sutraTasks.some(t => t.apartman_id === r.apartmanId))
  const alertWifi     = apartmani.filter(a => !a.wifiSifra)
  const alerts        = [
    ...alertCistenje.map(r => ({ tip: 'cistenje', rez: r })),
    ...alertWifi.map(a => ({ tip: 'wifi', apt: a })),
  ]

  // ── Upcoming 7 days (excluding today) ──
  const narednih7 = rezervacije
    .filter(r => r.dolazak > danas && r.dolazak <= za7 && r.status === 'potvrdjeno')
    .slice(0, 5)

  // ── KPI stats ──
  const ovajMesec = new Date().toISOString().slice(0, 7)
  const mesecniPrihod = rezervacije
    .filter(r => r.dolazak?.startsWith(ovajMesec) && ['potvrdjeno', 'zavrseno'].includes(r.status))
    .reduce((sum, r) => sum + (r.cena || 0), 0)
  const aktivne = rezervacije.filter(r => r.status === 'potvrdjeno').length

  // ── Chart — last 6 months ──
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 5 + i)
    const key = d.toISOString().slice(0, 7)
    const prihod = rezervacije.filter(r => r.dolazak?.startsWith(key)).reduce((s, r) => s + (r.cena || 0), 0)
    return { mesec: d.toLocaleDateString('sr-RS', { month: 'short' }), prihod }
  })

  const poz = pozdrav(profile?.ime)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">

      {/* ── Greeting ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl px-6 py-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {poz.tekst} <span>{poz.emoji}</span>
            </h1>
            <p className="text-slate-400 dark:text-slate-500 mt-0.5 capitalize">
              {new Date().toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
              {timeline.length > 0
                ? ` · ${timeline.length} ${timeline.length === 1 ? 'stavka' : timeline.length < 5 ? 'stavke' : 'stavki'} danas`
                : ' · Slobodan dan 🎉'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">€{mesecniPrihod.toLocaleString()}</p>
              <p className="text-xs text-slate-400">prihod ovog meseca</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Today's timeline ── */}
      {timeline.length > 0 ? (
        <div>
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Danas</h2>
          <div className="space-y-2.5">
            {timeline.map((item, i) => (
              <TimelineItem key={i} item={item} apartmani={apartmani} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-sm">Nema check-in-ova, checkout-ova ni čišćenja danas.</p>
        </div>
      )}

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 px-1">⚠️ Zahteva pažnju</h2>
          <div className="space-y-2">
            {alertCistenje.map(r => {
              const apt = apartmani.find(a => a.id === r.apartmanId)
              return (
                <div key={r.id} className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                  <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Check-in sutra — nema čišćenja</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.gost} · {apt?.naziv}</p>
                  </div>
                </div>
              )
            })}
            {alertWifi.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">WiFi šifra nije unešena</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.naziv} — dodaj u Apartmani tabu</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { naziv: 'Prihod ovog meseca', vrednost: `€${mesecniPrihod.toLocaleString()}`, ikona: TrendingUp, boja: '#01696f' },
          { naziv: 'Aktivne rezervacije', vrednost: aktivne, ikona: CalendarCheck, boja: '#8b5cf6' },
          { naziv: 'Apartmani', vrednost: apartmani.length, ikona: Home, boja: '#f59e0b' },
          { naziv: 'Narednih 7 dana', vrednost: narednih7.length + ' rez.', ikona: CalendarCheck, boja: '#3b82f6' },
        ].map(k => {
          const Ik = k.ikona
          return (
            <div key={k.naziv} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: k.boja + '20' }}>
                <Ik size={18} style={{ color: k.boja }} />
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{k.vrednost}</p>
              <p className="text-xs text-slate-400 mt-0.5">{k.naziv}</p>
            </div>
          )
        })}
      </div>

      {/* ── Bottom grid: Upcoming + Apartments + Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Upcoming 7 days */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            Narednih 7 dana
            {narednih7.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#01696f' }}>{narednih7.length}</span>}
          </h2>
          {narednih7.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nema rezervacija u narednih 7 dana</p>
          ) : (
            <div className="space-y-2.5">
              {narednih7.map(r => {
                const apt = apartmani.find(a => a.id === r.apartmanId)
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (apt?.boja || '#94a3b8') + '20' }}>
                      <Home size={13} style={{ color: apt?.boja || '#94a3b8' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{r.gost}</p>
                      <p className="text-xs text-slate-400 truncate">{r.dolazak} · {apt?.naziv}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">€{r.cena}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Apartments status */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Apartmani</h2>
          {apartmani.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Dodaj apartman da počneš</p>
          ) : (
            <div className="space-y-2.5">
              {apartmani.map(a => {
                const zauzet = rezervacije.some(r => r.apartmanId === a.id && r.dolazak <= danas && r.odlazak > danas && r.status === 'potvrdjeno')
                const sledeci = rezervacije.find(r => r.apartmanId === a.id && r.dolazak > danas && r.status === 'potvrdjeno')
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.boja + '20' }}>
                      <Home size={15} style={{ color: a.boja }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{a.naziv}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {sledeci ? `Sledeći: ${sledeci.dolazak}` : 'Slobodan'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${zauzet ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {zauzet ? 'Zauzet' : 'Slobodan'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-1">Prihodi</h2>
          <p className="text-xs text-slate-400 mb-4">Poslednjih 6 meseci</p>
          {chartData.every(d => d.prihod === 0) ? (
            <div className="flex items-center justify-center h-40 text-slate-300 dark:text-slate-600 text-sm">
              Nema podataka
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
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
