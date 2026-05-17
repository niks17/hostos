import React, { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, Clock, Zap, Sparkles, FileWarning,
  Banknote, CalendarX, CheckCircle2, RefreshCw,
  MessageCircle, ChevronRight, Phone
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { eturistaKompletan } from '../lib/supabase'

// ─── Konstante ────────────────────────────────────────────────────────────────
function todayStr()    { return new Date().toISOString().split('T')[0] }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }
function in7Days()     { const d = new Date(); d.setDate(d.getDate() + 7);  return d.toISOString().split('T')[0] }

function nowMinutes() {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}
function timeToMinutes(t) {
  if (!t) return 840 // default 14:00
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesLeft(t) { return timeToMinutes(t) - nowMinutes() }
function waUrl(tel, tekst) {
  return `https://wa.me/${tel?.replace(/\D/g, '')}?text=${encodeURIComponent(tekst || '')}`
}

// ─── Konfiguracija tipova problema ────────────────────────────────────────────
const NIVO_CFG = {
  kritično: {
    bg:     'bg-red-50 dark:bg-red-900/15',
    border: 'border-red-200 dark:border-red-800/50',
    badge:  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    dot:    'bg-red-500',
    label:  'KRITIČNO',
  },
  urgentno: {
    bg:     'bg-orange-50 dark:bg-orange-900/15',
    border: 'border-orange-200 dark:border-orange-800/50',
    badge:  'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    dot:    'bg-orange-400',
    label:  'URGENTNO',
  },
  važno: {
    bg:     'bg-amber-50 dark:bg-amber-900/15',
    border: 'border-amber-200 dark:border-amber-800/50',
    badge:  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    dot:    'bg-amber-400',
    label:  'VAŽNO',
  },
}

// ─── Problem Card ─────────────────────────────────────────────────────────────
function ProblemCard({ problem, onNavigate }) {
  const cfg = NIVO_CFG[problem.nivo]
  return (
    <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3">
        {/* Emoji / ikona */}
        <div className="text-2xl flex-shrink-0 mt-0.5">{problem.emoji}</div>

        <div className="flex-1 min-w-0">
          {/* Badge + naslov */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full tracking-wider ${cfg.badge}`}>
              {cfg.label}
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug">
              {problem.naslov}
            </p>
          </div>

          {/* Opis */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            {problem.opis}
          </p>

          {/* Akcije */}
          <div className="flex gap-2 flex-wrap">
            {problem.akcije?.map((a, i) => (
              <button
                key={i}
                onClick={() => a.onKlik(onNavigate)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                  transition-all active:scale-95
                  ${i === 0
                    ? 'text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                  }
                `}
                style={i === 0 ? { backgroundColor: a.boja || '#01696f' } : {}}
              >
                {a.ikona && <a.ikona size={12} />}
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Detekcija problema ───────────────────────────────────────────────────────
function detectProblems({ rezervacije, apartmani, tasks, gosti, placeni }) {
  const danas    = todayStr()
  const sutra    = tomorrowStr()
  const za7dana  = in7Days()
  const sada     = nowMinutes()
  const problems = []

  // ─── 1. BOOKING CONFLICT — iste apartman, preklapa datume ─────────────────
  const aktivne = rezervacije.filter(r => !['otkazano', 'zavrseno'].includes(r.status))
  for (let i = 0; i < aktivne.length; i++) {
    for (let j = i + 1; j < aktivne.length; j++) {
      const a = aktivne[i], b = aktivne[j]
      if (a.apartman_id !== b.apartman_id) continue
      const preklapanje = a.dolazak < b.odlazak && b.dolazak < a.odlazak
      if (!preklapanje) continue
      const apt = apartmani.find(x => x.id === a.apartman_id)
      problems.push({
        id:     `conflict-${a.id}-${b.id}`,
        nivo:   'kritično',
        emoji:  '⚡',
        naslov: `Konflikt rezervacija — ${apt?.naziv || 'apartman'}`,
        opis:   `${a.gost} (${a.dolazak} – ${a.odlazak}) se preklapa sa ${b.gost} (${b.dolazak} – ${b.odlazak})`,
        akcije: [{
          label: 'Idi na Rezervacije', ikona: ChevronRight, boja: '#dc2626',
          onKlik: nav => nav('rezervacije'),
        }],
      })
    }
  }

  // ─── 2. CHECK-IN USKORO (< 60 min do 14:00, gost nije stigao) ────────────
  const danasCheckin = rezervacije.filter(r =>
    r.dolazak === danas && ['potvrdjeno', 'cekanje'].includes(r.status)
  )
  danasCheckin.forEach(r => {
    const minLeft = minutesLeft('14:00')
    if (minLeft > 0 && minLeft <= 60) {
      const apt = apartmani.find(x => x.id === r.apartman_id)
      const danasTask = tasks.find(t => t.apartman_id === r.apartman_id && t.datum === danas)
      if (danasTask && danasTask.status !== 'zavrseno') return // handled by cleaning alert
      problems.push({
        id:     `checkin-soon-${r.id}`,
        nivo:   'kritično',
        emoji:  '⏰',
        naslov: `Check-in za ${minLeft} min — ${r.gost}`,
        opis:   `${apt?.naziv || 'Apartman'} · Check-in u 14:00 · Pošalji informacije gostu`,
        akcije: r.kontakt ? [{
          label: 'WhatsApp gostu', ikona: MessageCircle, boja: '#16a34a',
          onKlik: () => window.open(waUrl(r.kontakt, `Pozdrav ${r.gost}! 👋 Dobrodošli! Apartman je spreman. ${apt?.lokacija || ''}`), '_blank'),
        }] : [],
      })
    }
  })

  // ─── 3. GOST KASNI (check-in bio danas, još nije označen kao završen, prošlo 16:00) ──
  if (sada > 16 * 60) {
    danasCheckin.forEach(r => {
      const apt = apartmani.find(x => x.id === r.apartman_id)
      problems.push({
        id:     `late-${r.id}`,
        nivo:   'kritično',
        emoji:  '🚨',
        naslov: `Gost kasni — ${r.gost}`,
        opis:   `${apt?.naziv || 'Apartman'} · Check-in bio u 14:00 · Gost se nije javio`,
        akcije: [
          ...(r.kontakt ? [{
            label: 'WhatsApp', ikona: MessageCircle, boja: '#16a34a',
            onKlik: () => window.open(waUrl(r.kontakt, `Pozdrav ${r.gost}! Proveravamo da li ste stigli? 😊`), '_blank'),
          }] : []),
          ...(r.kontakt ? [{
            label: 'Pozovi', ikona: Phone, boja: null,
            onKlik: () => window.open(`tel:${r.kontakt}`, '_self'),
          }] : []),
        ],
      })
    })
  }

  // ─── 4. ČIŠĆENJE NIJE ZAVRŠENO (task danas, status != zavrseno, vreme prošlo) ─
  tasks
    .filter(t => t.datum === danas && t.status !== 'zavrseno')
    .forEach(t => {
      const apt        = apartmani.find(x => x.id === t.apartman_id)
      const taskMin    = timeToMinutes(t.vreme || '10:00')
      const kasniMin   = sada - taskMin
      const kasni      = kasniMin > 30  // prošlo > 30 min od zakazanog vremena
      if (!kasni) return
      const checkinRez = rezervacije.find(r =>
        r.apartman_id === t.apartman_id && r.dolazak === danas && ['potvrdjeno', 'cekanje'].includes(r.status)
      )
      problems.push({
        id:     `cistenje-${t.id}`,
        nivo:   checkinRez ? 'kritično' : 'urgentno',
        emoji:  '🧹',
        naslov: `Čišćenje nije završeno — ${apt?.naziv || 'apartman'}`,
        opis:   `Zakazano ${t.vreme || '10:00'}, kasni ${kasniMin} min${checkinRez ? ` · Gost ${checkinRez.gost} stiže danas!` : ''}`,
        akcije: [{
          label: 'Čistačice Hub', ikona: Sparkles, boja: '#8b5cf6',
          onKlik: nav => nav('cistacije'),
        }],
      })
    })

  // ─── 5. PRAZAN PERIOD BEZ ČIŠĆENJA (odlazak danas/sutra, dolazak sutra, nema task) ─
  const odlasci = rezervacije.filter(r =>
    (r.odlazak === danas || r.odlazak === sutra) && r.status !== 'otkazano'
  )
  odlasci.forEach(r => {
    const sledecaRez = rezervacije.find(s =>
      s.apartman_id === r.apartman_id &&
      s.dolazak > r.odlazak &&
      s.dolazak <= sutra &&
      !['otkazano'].includes(s.status)
    )
    if (!sledecaRez) return
    const imaTask = tasks.some(t =>
      t.apartman_id === r.apartman_id &&
      t.datum >= r.odlazak &&
      t.datum <= sledecaRez.dolazak
    )
    if (imaTask) return
    const apt = apartmani.find(x => x.id === r.apartman_id)
    problems.push({
      id:     `gap-${r.id}`,
      nivo:   'urgentno',
      emoji:  '🏠',
      naslov: `Nema zakazanog čišćenja — ${apt?.naziv || 'apartman'}`,
      opis:   `${r.gost} odlazi ${r.odlazak}, ${sledecaRez.gost} stiže ${sledecaRez.dolazak} · Nema zadatka čišćenja između`,
      akcije: [{
        label: 'Zakaži čišćenje', ikona: Sparkles, boja: '#8b5cf6',
        onKlik: nav => nav('cistacije'),
      }],
    })
  })

  // ─── 6. ETURISTA PODACI NEDOSTAJU (rezervacija u narednih 7 dana) ──────────
  const predstojece = rezervacije.filter(r =>
    r.dolazak >= danas && r.dolazak <= za7dana && !['otkazano'].includes(r.status)
  )
  predstojece.forEach(r => {
    const gost = gosti.find(g =>
      g.ime?.toLowerCase().trim() === r.gost?.toLowerCase().trim() ||
      `${g.ime} ${g.prezime || ''}`.toLowerCase().trim() === r.gost?.toLowerCase().trim()
    )
    if (gost && eturistaKompletan(gost)) return
    const apt = apartmani.find(x => x.id === r.apartman_id)
    problems.push({
      id:     `eturista-${r.id}`,
      nivo:   'važno',
      emoji:  '📋',
      naslov: `eTurista podaci nedostaju — ${r.gost}`,
      opis:   `${apt?.naziv || 'Apartman'} · Check-in ${r.dolazak} · Ime, pasoš, datum rođenja nisu uneti`,
      akcije: [{
        label: 'Idi na Goste', ikona: FileWarning, boja: '#d97706',
        onKlik: nav => nav('gosti'),
      }],
    })
  })

  // ─── 7. NEPLAĆENA BORAVIŠNA TAKSA ─────────────────────────────────────────
  const meseci = new Set(
    rezervacije
      .filter(r => ['potvrdjeno', 'zavrseno'].includes(r.status))
      .map(r => r.dolazak?.slice(0, 7))
      .filter(Boolean)
  )
  const neplaceniMeseci = [...meseci].filter(m => {
    const info = placeni[m]
    return !info?.placeno
  })
  if (neplaceniMeseci.length > 0) {
    const sorted = [...neplaceniMeseci].sort()
    problems.push({
      id:     'taksa-neplacena',
      nivo:   'važno',
      emoji:  '💰',
      naslov: `Neplaćena boravišna taksa — ${neplaceniMeseci.length} ${neplaceniMeseci.length === 1 ? 'mesec' : 'meseci'}`,
      opis:   `Neplaćeno: ${sorted.join(', ')}`,
      akcije: [{
        label: 'Finansije', ikona: Banknote, boja: '#d97706',
        onKlik: nav => nav('finansije'),
      }],
    })
  }

  return problems
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProblemiCentar({ apartmani = [], onNavigate }) {
  const { user } = useAuth()
  const [problems,  setProblems]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [lastCheck, setLastCheck] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const danas   = todayStr()
    const za7dana = in7Days()
    const [
      { data: rez },
      { data: tasks },
      { data: stavke },
      { data: gosti },
      { data: taksaRows },
    ] = await Promise.all([
      supabase.from('rezervacije').select('*').neq('status', 'otkazano'),
      supabase.from('cistacke_tasks').select('*'),
      supabase.from('cistacke_stavke').select('task_id, zavrseno'),
      supabase.from('gosti').select('*'),
      supabase.from('taksa_status').select('mesec_godina, placeno'),
    ])

    // Enrich tasks sa status-om
    const tasksEnriched = (tasks || []).map(t => {
      const ts = (stavke || []).filter(s => s.task_id === t.id)
      if (ts.length === 0) return { ...t, status: t.status || 'ceka' }
      const allDone = ts.every(s => s.zavrseno)
      const anyDone = ts.some(s => s.zavrseno)
      return {
        ...t,
        status: allDone ? 'zavrseno' : anyDone ? 'u_toku' : 'ceka',
      }
    })

    // Placeni mapa
    const placeni = {}
    ;(taksaRows || []).forEach(r => { placeni[r.mesec_godina] = { placeno: r.placeno } })

    const found = detectProblems({
      rezervacije: rez || [],
      apartmani,
      tasks: tasksEnriched,
      gosti: gosti || [],
      placeni,
    })

    // Sort: kritično > urgentno > važno
    const redosled = { kritično: 0, urgentno: 1, važno: 2 }
    found.sort((a, b) => redosled[a.nivo] - redosled[b.nivo])

    setProblems(found)
    setLastCheck(new Date())
    setLoading(false)
  }, [user, apartmani])

  useEffect(() => { load() }, [load])

  // ── Grupiši po nivou ──────────────────────────────────────────────────────
  const kriticni  = problems.filter(p => p.nivo === 'kritično')
  const urgentni  = problems.filter(p => p.nivo === 'urgentno')
  const vazni     = problems.filter(p => p.nivo === 'važno')

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            {problems.length > 0
              ? <><AlertTriangle size={20} className="text-red-500" /> Šta danas gori</>
              : <><CheckCircle2 size={20} className="text-emerald-500" /> Problemi</>
            }
          </h1>
          {lastCheck && (
            <p className="text-xs text-slate-400 mt-0.5">
              Provereno {lastCheck.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
            bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            text-slate-500 dark:text-slate-400 hover:text-teal-600 hover:border-teal-400
            transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Osvježi
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton rounded-2xl h-24" />
          ))}
        </div>
      )}

      {/* ── Sve OK ── */}
      {!loading && problems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5 text-4xl">
            🎉
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">
            Sve je pod kontrolom!
          </h2>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            Nema kritičnih problema, konflikata, ni neplaćenih dugova. Slobodan dan. 😎
          </p>
        </div>
      )}

      {/* ── Grupe problema ── */}
      {!loading && problems.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex gap-2 flex-wrap">
            {kriticni.length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {kriticni.length} kritično
              </span>
            )}
            {urgentni.length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                {urgentni.length} urgentno
              </span>
            )}
            {vazni.length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {vazni.length} važno
              </span>
            )}
          </div>

          {/* Kritično */}
          {kriticni.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Kritično — odmah reaguj
              </h2>
              {kriticni.map(p => <ProblemCard key={p.id} problem={p} onNavigate={onNavigate} />)}
            </section>
          )}

          {/* Urgentno */}
          {urgentni.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                Urgentno — reši danas
              </h2>
              {urgentni.map(p => <ProblemCard key={p.id} problem={p} onNavigate={onNavigate} />)}
            </section>
          )}

          {/* Važno */}
          {vazni.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Važno — ne zaboravi
              </h2>
              {vazni.map(p => <ProblemCard key={p.id} problem={p} onNavigate={onNavigate} />)}
            </section>
          )}
        </>
      )}
    </div>
  )
}

// ─── Export helper za badge u navigaciji ─────────────────────────────────────
export async function fetchProblemCount(user, apartmani) {
  if (!user) return 0
  try {
    const danas = todayStr()
    const za7dana = in7Days()
    const [
      { data: rez },
      { data: tasks },
      { data: stavke },
      { data: gosti },
      { data: taksaRows },
    ] = await Promise.all([
      supabase.from('rezervacije').select('*').neq('status', 'otkazano'),
      supabase.from('cistacke_tasks').select('*'),
      supabase.from('cistacke_stavke').select('task_id, zavrseno'),
      supabase.from('gosti').select('id, ime, prezime, datum_rodjenja, pol, tip_dokumenta, broj_dokumenta'),
      supabase.from('taksa_status').select('mesec_godina, placeno'),
    ])
    const tasksEnriched = (tasks || []).map(t => {
      const ts = (stavke || []).filter(s => s.task_id === t.id)
      if (!ts.length) return t
      return { ...t, status: ts.every(s => s.zavrseno) ? 'zavrseno' : ts.some(s => s.zavrseno) ? 'u_toku' : 'ceka' }
    })
    const placeni = {}
    ;(taksaRows || []).forEach(r => { placeni[r.mesec_godina] = { placeno: r.placeno } })
    const problems = detectProblems({ rezervacije: rez || [], apartmani, tasks: tasksEnriched, gosti: gosti || [], placeni })
    return problems.filter(p => p.nivo === 'kritično' || p.nivo === 'urgentno').length
  } catch { return 0 }
}
