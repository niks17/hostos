import React, { useState, useEffect, useRef } from 'react'
import {
  CheckSquare, Square, Clock, CheckCheck, AlertCircle, Home,
  Plus, X, Trash2, Pencil, Check, MapPin, Timer, MessageSquare,
  AlertTriangle, ChevronDown, Sparkles
} from 'lucide-react'
import { supabase, logActivity } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { haptic } from '../utils/haptics'

const STAVKE_DEFAULT = [
  'Posteljina i peškiri',
  'Kupatilo',
  'Kuhinja i sudovi',
  'Usisavanje i brisanje',
  'Terasa',
]

const statusBoje = {
  zavrseno: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  u_toku:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ceka:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}
const statusNaziv = { zavrseno: 'Završeno', u_toku: 'U toku', ceka: 'Čeka' }
const statusIkona = { zavrseno: CheckCheck, u_toku: Clock, ceka: AlertCircle }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split('T')[0] }

function minutesDiff(targetTime) {
  if (!targetTime) return null
  const [h, m] = targetTime.split(':').map(Number)
  const now    = new Date()
  const target = new Date()
  target.setHours(h, m, 0, 0)
  return Math.round((target - now) / 60000)
}

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}min`
}

// ─── Konfeti čestica ──────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#01696f','#10b981','#f59e0b','#3b82f6','#ec4899','#a78bfa','#f97316']

function ConfettiBurst() {
  const particles = Array.from({ length: 14 }, (_, i) => {
    const angle  = (i / 14) * 360 + (Math.random() * 20 - 10)
    const dist   = 38 + Math.random() * 32
    const tx     = Math.round(Math.cos((angle * Math.PI) / 180) * dist)
    const ty     = Math.round(Math.sin((angle * Math.PI) / 180) * dist - 10)
    const size   = 5 + Math.floor(Math.random() * 6)
    const color  = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    const delay  = (Math.random() * 80).toFixed(0) + 'ms'
    const radius = i % 4 === 0 ? '3px' : '50%'
    return { tx, ty, size, color, delay, radius }
  })
  return (
    <>
      {particles.map((p, i) => (
        <span
          key={i}
          className="confetti-particle"
          style={{
            left: '18px', top: '18px',
            width: p.size, height: p.size,
            backgroundColor: p.color,
            borderRadius: p.radius,
            animationDelay: p.delay,
            '--tx': p.tx + 'px',
            '--ty': p.ty + 'px',
          }}
        />
      ))}
    </>
  )
}

// ─── Animated Checkbox Item ────────────────────────────────────────────────────
function ChecklistItem({ stavka, onToggle }) {
  const [bouncing,  setBouncing]  = useState(false)
  const [confetti,  setConfetti]  = useState(false)

  function handleTap() {
    // Konfeti samo kad završavamo (ne kad odčekiramo)
    if (!stavka.zavrseno) {
      setConfetti(true)
      setTimeout(() => setConfetti(false), 800)
    }
    setBouncing(true)
    setTimeout(() => setBouncing(false), 350)
    haptic.tap()
    onToggle()
  }

  return (
    <button
      onClick={handleTap}
      className={`
        w-full flex items-center gap-4 p-4 rounded-2xl border-2
        transition-all duration-200 active:scale-[0.97]
        ${stavka.zavrseno
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 active:border-teal-300'
        }
      `}
    >
      {/* Checkbox + konfeti omotač */}
      <div className="relative flex-shrink-0 w-9 h-9">
        <div
          className={`
            w-9 h-9 rounded-full border-2 flex items-center justify-center
            transition-all duration-200
            ${bouncing ? 'scale-125' : 'scale-100'}
            ${stavka.zavrseno
              ? 'border-teal-600'
              : 'border-slate-300 dark:border-slate-600'
            }
          `}
          style={stavka.zavrseno ? { backgroundColor: '#01696f', borderColor: '#01696f' } : {}}
        >
          {stavka.zavrseno && (
            <Check size={17} className="text-white" strokeWidth={3} />
          )}
        </div>
        {/* Konfeti čestica — apsolutno u odnosu na checkbox */}
        {confetti && <ConfettiBurst />}
      </div>

      {/* Label */}
      <span className={`
        text-base font-semibold flex-1 text-left leading-snug transition-all duration-200
        ${stavka.zavrseno
          ? 'line-through text-slate-400 dark:text-slate-500'
          : 'text-slate-800 dark:text-white'
        }
      `}>
        {stavka.naziv}
      </span>

      {/* Timestamp */}
      {stavka.ts && (
        <span className="text-xs font-semibold flex-shrink-0 tabular-nums" style={{ color: '#01696f' }}>
          {stavka.ts}
        </span>
      )}
    </button>
  )
}

// ─── CLEANER VIEW ──────────────────────────────────────────────────────────────
function CleanerView({ taskovi, apartmani, toggleStavka, rezervacije }) {
  const danas       = todayStr()
  const [aktivniIdx, setAktivniIdx] = useState(0)
  const [zavrsioId,  setZavrsioId]  = useState(null)
  const [napomena,   setNapomena]   = useState('')
  const [saving,     setSaving]     = useState(false)
  const [elapsed,    setElapsed]    = useState(0)
  const startRef = useRef(Date.now())

  const aktivni = taskovi.filter(t => t.status !== 'zavrseno' && t.datum <= danas)
  const task    = aktivni[aktivniIdx] || null
  const apt     = task ? apartmani.find(a => a.id === task.apartmanId) : null

  // Reset index if tasks change
  useEffect(() => {
    if (aktivniIdx >= aktivni.length && aktivni.length > 0) setAktivniIdx(0)
  }, [aktivni.length])

  // Elapsed timer
  useEffect(() => {
    startRef.current = Date.now()
    setElapsed(0)
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [aktivniIdx])

  // Deadline countdown — find next check-in for this apartment today
  const checkinRez = task
    ? rezervacije.find(r =>
        (r.apartman_id === task.apartman_id || r.apartmanId === task.apartmanId) &&
        r.dolazak === danas
      )
    : null
  const checkinVreme  = checkinRez ? '14:00' : null
  const minutesLeft   = checkinVreme ? minutesDiff(checkinVreme) : null
  const deadlineUrgent = minutesLeft !== null && minutesLeft < 90

  // ── Success screen ──
  if (zavrsioId) {
    const taskDone = taskovi.find(t => t.id === zavrsioId)
    const aptDone  = taskDone ? apartmani.find(a => a.id === taskDone.apartmanId) : null
    const remaining = aktivni.filter(t => t.id !== zavrsioId)

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #f0fafa 0%, #d1f5f5 100%)' }}>

        {/* Big check */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full flex items-center justify-center animate-bounce-in shadow-2xl"
            style={{ backgroundColor: '#01696f' }}>
            <Check size={56} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-1">Odlično! 🎉</h1>
        <p className="text-slate-500 text-lg mb-6">
          {aptDone?.naziv || 'Apartman'} je spreman za goste.
        </p>

        {/* Stats row */}
        <div className="flex gap-6 mb-8">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-800">{formatElapsed(elapsed)}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">vreme</p>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-2xl font-black text-slate-800">{taskDone?.stavke?.length || 0}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">stavki</p>
          </div>
          {napomena && (
            <>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-black text-slate-800">✓</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">napomena</p>
              </div>
            </>
          )}
        </div>

        {remaining.length > 0 ? (
          <button
            onClick={() => { setZavrsioId(null); setNapomena('') }}
            className="px-8 py-4 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform text-lg"
            style={{ backgroundColor: '#01696f' }}>
            Sledeći zadatak →
          </button>
        ) : (
          <div className="text-slate-500 text-base">
            Nema više zadataka za danas 🏖️
          </div>
        )}
      </div>
    )
  }

  // ── No tasks ──
  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900">
        <div className="text-7xl mb-5">🧹</div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Slobodan dan!</h2>
        <p className="text-slate-400">Nema zadataka čišćenja za danas.</p>
        <p className="text-slate-300 dark:text-slate-600 text-sm mt-1">Proveri ponovo sutra.</p>
      </div>
    )
  }

  const zavrsenoCount = task.stavke.filter(s => s.zavrseno).length
  const procenat      = task.stavke.length ? Math.round((zavrsenoCount / task.stavke.length) * 100) : 100
  const sveZavrseno   = task.stavke.length === 0 || zavrsenoCount === task.stavke.length

  async function handleZavrseno() {
    haptic.done()
    setSaving(true)
    await supabase.from('cistacke_tasks')
      .update({ napomena: napomena.trim() || null, status: 'zavrseno' })
      .eq('id', task.id)
    await logActivity(
      task.user_id,
      'cistenje',
      `${apt?.naziv || 'Apartman'} je očišćen`,
      { task_id: task.id, apt_naziv: apt?.naziv, napomena: napomena.trim() || null }
    )
    setSaving(false)
    setZavrsioId(task.id)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-slate-800 px-5 pt-safe-top pt-6 pb-5 shadow-sm">

        {/* Task switcher dots */}
        {aktivni.length > 1 && (
          <div className="flex gap-2 mb-5">
            {aktivni.map((t, i) => {
              const a = apartmani.find(a => a.id === t.apartmanId)
              return (
                <button
                  key={t.id}
                  onClick={() => setAktivniIdx(i)}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${i === aktivniIdx ? 'opacity-100' : 'opacity-20'}`}
                  style={{ backgroundColor: a?.boja || '#01696f' }}
                />
              )
            })}
          </div>
        )}

        {/* Apartment info */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: (apt?.boja || '#01696f') + '20' }}>
            🏠
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-white leading-tight">{apt?.naziv || 'Apartman'}</h1>
            {apt?.lokacija && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                <p className="text-sm text-slate-400 truncate">{apt.lokacija}</p>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              {/* Timer */}
              <div className="flex items-center gap-1">
                <Timer size={13} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-400 tabular-nums">{formatElapsed(elapsed)}</span>
              </div>
              {/* Deadline */}
              {minutesLeft !== null && (
                <div className={`flex items-center gap-1 ${deadlineUrgent ? 'text-red-500' : 'text-slate-400'}`}>
                  <Clock size={13} />
                  <span className={`text-xs font-semibold tabular-nums`}>
                    {minutesLeft <= 0
                      ? 'Gosti stigli!'
                      : minutesLeft < 60
                        ? `${minutesLeft}min do dolaska`
                        : `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}min do dolaska`
                    }
                  </span>
                  {deadlineUrgent && minutesLeft > 0 && <AlertTriangle size={12} />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {zavrsenoCount} od {task.stavke.length} završeno
            </span>
            <span className="text-sm font-black tabular-nums" style={{ color: '#01696f' }}>{procenat}%</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${procenat}%`, backgroundColor: sveZavrseno ? '#10b981' : '#01696f' }}
            />
          </div>
        </div>
      </div>

      {/* ── Checklist ── */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-48">
        {task.stavke.map(stavka => (
          <ChecklistItem
            key={stavka.id}
            stavka={stavka}
            onToggle={() => toggleStavka(task.id, stavka.id, stavka.zavrseno)}
          />
        ))}

        {task.stavke.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Nema stavki čišćenja — tapni ZAVRŠENO.</p>
          </div>
        )}
      </div>

      {/* ── Bottom: note + button ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-2xl"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>

        {/* Note input — slides in when all done */}
        {sveZavrseno && (
          <div className="px-4 pt-3 pb-2 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-slate-400" />
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Napomena za vlasnika (opcionalno)
              </label>
            </div>
            <textarea
              value={napomena}
              onChange={e => setNapomena(e.target.value)}
              placeholder="npr. Sudoper malo curi, fali WC papir u kupatilu..."
              rows={2}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white placeholder-slate-400"
            />
          </div>
        )}

        <div className="px-4 pt-2 pb-1">
          <button
            onClick={sveZavrseno ? handleZavrseno : undefined}
            disabled={saving}
            className={`
              w-full py-5 text-lg font-black rounded-2xl transition-all duration-200
              ${sveZavrseno
                ? 'text-white active:scale-95 btn-lock-pulse'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
            style={sveZavrseno ? { backgroundColor: '#059669' } : {}}
          >
            {saving
              ? '⏳ Čuvam...'
              : sveZavrseno
                ? '🔒 ZAKLJUČAJ APARTMAN'
                : `Još ${task.stavke.length - zavrsenoCount} ${
                    (task.stavke.length - zavrsenoCount) === 1 ? 'stavka' : 'stavke'
                  }`
            }
          </button>
        </div>
      </div>

    </div>
  )
}

// ─── OWNER VIEW ────────────────────────────────────────────────────────────────
export default function CistacijeHub({ apartmani = [] }) {
  const { user, profile } = useAuth()
  const [taskovi,      setTaskovi]      = useState([])
  const [rezervacije,  setRezervacije]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [noviTask,     setNoviTask]     = useState(false)
  const [forma,        setForma]        = useState({ apartmanId: '', datum: '', vreme: '10:00' })
  const [brisanje,     setBrisanje]     = useState(null)
  const [izmena,       setIzmena]       = useState(null)
  const [izmenaForma,  setIzmenaForma]  = useState({ apartmanId: '', datum: '', vreme: '' })
  const [filterTab,    setFilterTab]    = useState('sve')  // 'sve' | 'danas' | 'zavrseno'

  const danas = todayStr()

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const [{ data: tsk }, { data: rez }] = await Promise.all([
      supabase.from('cistacke_tasks').select('*, cistacke_stavke(*)').order('datum', { ascending: false }),
      supabase.from('rezervacije').select('id, apartman_id, dolazak, status'),
    ])
    setTaskovi((tsk || []).map(t => ({
      ...t,
      apartmanId: t.apartman_id,
      stavke: (t.cistacke_stavke || []).sort((a, b) => a.id - b.id),
    })))
    setRezervacije(rez || [])
    setLoading(false)
  }

  async function toggleStavka(taskId, stavkaId, trenutnoZavrseno) {
    const novoZavrseno = !trenutnoZavrseno
    const ts = novoZavrseno
      ? new Date().toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
      : null
    await supabase.from('cistacke_stavke').update({ zavrseno: novoZavrseno, ts }).eq('id', stavkaId)

    const task       = taskovi.find(t => t.id === taskId)
    const novaStavke = task.stavke.map(s => s.id === stavkaId ? { ...s, zavrseno: novoZavrseno, ts } : s)
    const sveZavr    = novaStavke.every(s => s.zavrseno)
    const imaZavr    = novaStavke.some(s => s.zavrseno)
    const noviStatus = sveZavr ? 'zavrseno' : imaZavr ? 'u_toku' : 'ceka'

    await supabase.from('cistacke_tasks').update({ status: noviStatus }).eq('id', taskId)
    setTaskovi(taskovi.map(t => t.id !== taskId ? t : { ...t, status: noviStatus, stavke: novaStavke }))
  }

  async function dodajTask() {
    if (!forma.datum || !forma.apartmanId) return
    const { data: task, error } = await supabase
      .from('cistacke_tasks')
      .insert([{
        user_id: user.id,
        apartman_id: Number(forma.apartmanId),
        datum: forma.datum,
        vreme: forma.vreme,
        status: 'ceka',
      }])
      .select().single()

    if (!error && task) {
      await supabase.from('cistacke_stavke').insert(
        STAVKE_DEFAULT.map(naziv => ({ task_id: task.id, naziv, zavrseno: false }))
      )
    }
    await load()
    setNoviTask(false)
    setForma({ apartmanId: '', datum: '', vreme: '10:00' })
  }

  async function sacuvajIzmenu() {
    await supabase.from('cistacke_tasks').update({
      apartman_id: Number(izmenaForma.apartmanId),
      datum: izmenaForma.datum,
      vreme: izmenaForma.vreme,
    }).eq('id', izmena.id)
    await load()
    setIzmena(null)
  }

  async function obrisi(id) {
    await supabase.from('cistacke_tasks').delete().eq('id', id)
    setTaskovi(taskovi.filter(t => t.id !== id))
    setBrisanje(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Cistacica sees mobile flow
  if (profile?.role === 'cistacica') {
    return (
      <CleanerView
        taskovi={taskovi}
        apartmani={apartmani}
        toggleStavka={toggleStavka}
        rezervacije={rezervacije}
      />
    )
  }

  // ── Owner: filter + sort ──
  const filtered = taskovi
    .filter(t => {
      if (filterTab === 'danas')    return t.datum === danas
      if (filterTab === 'zavrseno') return t.status === 'zavrseno'
      if (filterTab === 'aktivno')  return t.status !== 'zavrseno'
      return true
    })
    .sort((a, b) => {
      // Today first, then by date ascending
      if (a.datum === danas && b.datum !== danas) return -1
      if (b.datum === danas && a.datum !== danas) return  1
      return a.datum.localeCompare(b.datum)
    })

  const zavrseno = taskovi.filter(t => t.status === 'zavrseno').length
  const uToku    = taskovi.filter(t => t.status === 'u_toku').length
  const ceka     = taskovi.filter(t => t.status === 'ceka').length

  const filterTabs = [
    { id: 'sve',      label: 'Sve',      count: taskovi.length },
    { id: 'aktivno',  label: 'Aktivno',  count: uToku + ceka },
    { id: 'danas',    label: 'Danas',    count: taskovi.filter(t => t.datum === danas).length },
    { id: 'zavrseno', label: 'Završeno', count: zavrseno },
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { naziv: 'Završeno', broj: zavrseno, boja: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { naziv: 'U toku',   broj: uToku,    boja: '#3b82f6', bg: 'bg-blue-50   dark:bg-blue-900/20'    },
          { naziv: 'Čeka',     broj: ceka,     boja: '#f59e0b', bg: 'bg-amber-50  dark:bg-amber-900/20'   },
        ].map(s => (
          <div key={s.naziv} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-black tabular-nums" style={{ color: s.boja }}>{s.broj}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{s.naziv}</p>
          </div>
        ))}
      </div>

      {/* ── Header + filters ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold
                transition-all duration-150 whitespace-nowrap flex-shrink-0
                ${filterTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }
              `}
              style={filterTab === tab.id ? { backgroundColor: '#01696f' } : {}}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setNoviTask(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity flex-shrink-0 ml-2"
          style={{ backgroundColor: '#01696f' }}>
          <Plus size={15} /> Novi
        </button>
      </div>

      {/* ── Task list ── */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Sparkles size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            {filterTab === 'danes' ? 'Nema zadataka za danas' : 'Nema zadataka ovde'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(task => {
          const apt          = apartmani.find(a => a.id === task.apartmanId)
          const zavrsenoStvk = task.stavke.filter(s => s.zavrseno).length
          const Ikona        = statusIkona[task.status]
          const procenat     = task.stavke.length
            ? Math.round((zavrsenoStvk / task.stavke.length) * 100)
            : 0
          const isToday      = task.datum === danas

          return (
            <div
              key={task.id}
              className={`
                bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border transition-all duration-200 animate-fade-in
                ${isToday
                  ? 'border-teal-200 dark:border-teal-800'
                  : 'border-slate-100 dark:border-slate-700'
                }
              `}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (apt?.boja || '#94a3b8') + '20' }}>
                    <Home size={17} style={{ color: apt?.boja || '#94a3b8' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 dark:text-white text-sm">{apt?.naziv || '—'}</p>
                      {isToday && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: '#01696f' }}>
                          DANAS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{task.datum} · {task.vreme}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${statusBoje[task.status]}`}>
                    <Ikona size={11} /> {statusNaziv[task.status]}
                  </span>
                  <button
                    onClick={() => { setIzmenaForma({ apartmanId: task.apartmanId, datum: task.datum, vreme: task.vreme }); setIzmena(task) }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setBrisanje(task)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{zavrsenoStvk}/{task.stavke.length} stavki</span>
                  <span className="font-semibold">{procenat}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${procenat}%`, backgroundColor: task.status === 'zavrseno' ? '#10b981' : '#01696f' }} />
                </div>
              </div>

              {/* Checklist (compact) */}
              <div className="space-y-1.5">
                {task.stavke.map(stavka => (
                  <button
                    key={stavka.id}
                    onClick={() => toggleStavka(task.id, stavka.id, stavka.zavrseno)}
                    className="w-full flex items-center gap-3 text-left group py-0.5">
                    <div className={`flex-shrink-0 transition-colors ${
                      stavka.zavrseno
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'
                    }`}>
                      {stavka.zavrseno ? <CheckSquare size={17} /> : <Square size={17} />}
                    </div>
                    <span className={`text-sm flex-1 ${
                      stavka.zavrseno
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {stavka.naziv}
                    </span>
                    {stavka.ts && (
                      <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">{stavka.ts}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Cleaner note (if exists) */}
              {task.napomena && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-0.5">
                        Napomena čistačice
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{task.napomena}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Modals ── */}

      {/* Delete confirm */}
      {brisanje && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-modal z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setBrisanje(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-modal animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Obriši zadatak?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              {apartmani.find(a => a.id === brisanje.apartmanId)?.naziv} · {brisanje.datum}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBrisanje(null)}
                className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Otkaži
              </button>
              <button onClick={() => obrisi(brisanje.id)}
                className="flex-1 py-3 text-sm font-bold text-white rounded-xl bg-red-500 hover:bg-red-600 transition-colors active:scale-95">
                Obriši
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {izmena && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-modal z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setIzmena(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-modal animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 dark:text-white">Izmeni zadatak</h3>
              <button onClick={() => setIzmena(null)} className="text-slate-400 hover:text-slate-600 active:scale-90 transition-all"><X size={20} /></button>
            </div>
            <ModalInputs
              forma={izmenaForma}
              setForma={setIzmenaForma}
              apartmani={apartmani}
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setIzmena(null)}
                className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Otkaži
              </button>
              <button onClick={sacuvajIzmenu}
                className="flex-1 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-all active:scale-95"
                style={{ backgroundColor: '#01696f' }}>
                Sačuvaj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New task modal */}
      {noviTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-modal z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setNoviTask(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-modal animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 dark:text-white">Novi zadatak čišćenja</h3>
              <button onClick={() => setNoviTask(false)} className="text-slate-400 hover:text-slate-600 active:scale-90 transition-all"><X size={20} /></button>
            </div>
            <ModalInputs
              forma={forma}
              setForma={setForma}
              apartmani={apartmani}
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setNoviTask(false)}
                className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Otkaži
              </button>
              <button
                onClick={dodajTask}
                disabled={!forma.apartmanId || !forma.datum}
                className="flex-1 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: '#01696f' }}>
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shared modal inputs ───────────────────────────────────────────────────────
function ModalInputs({ forma, setForma, apartmani }) {
  const inputCls = `
    w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl
    bg-white dark:bg-slate-700 dark:text-white
    focus:ring-2 focus:ring-teal-500 focus:border-transparent
    transition-shadow
  `
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wide">Apartman</label>
        <select
          value={forma.apartmanId}
          onChange={e => setForma({ ...forma, apartmanId: e.target.value })}
          className={inputCls}>
          <option value="">Odaberi apartman</option>
          {apartmani.map(a => <option key={a.id} value={a.id}>{a.naziv}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wide">Datum</label>
        <input
          type="date"
          value={forma.datum}
          onChange={e => setForma({ ...forma, datum: e.target.value })}
          className={inputCls} />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wide">Vreme</label>
        <input
          type="time"
          value={forma.vreme}
          onChange={e => setForma({ ...forma, vreme: e.target.value })}
          className={inputCls} />
      </div>
    </div>
  )
}
