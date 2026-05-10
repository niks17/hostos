import React, { useState, useEffect } from 'react'
import { CheckSquare, Square, Clock, CheckCheck, AlertCircle, Home, Plus, X, Trash2, Pencil, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STAVKE_DEFAULT = ['Posteljina i peškiri', 'Kupatilo', 'Kuhinja i sudovi', 'Usisavanje i brisanje', 'Terasa']
const statusBoje = {
  zavrseno: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  u_toku:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ceka:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}
const statusNaziv = { zavrseno: 'Završeno', u_toku: 'U toku', ceka: 'Čeka' }
const statusIkona = { zavrseno: CheckCheck, u_toku: Clock, ceka: AlertCircle }

// ─── CLEANER VIEW (mobile-first) ───────────────────────────────────────────
function CleanerView({ taskovi, apartmani, toggleStavka }) {
  const danas = new Date().toISOString().split('T')[0]
  const [aktivniIdx, setAktivniIdx] = useState(0)
  const [zavrsioId, setZavrsioId] = useState(null)

  const aktivni = taskovi.filter(t => t.status !== 'zavrseno' && t.datum <= danas)
  const task = aktivni[aktivniIdx] || null
  const apt = task ? apartmani.find(a => a.id === task.apartmanId) : null

  // Reset index if tasks change
  useEffect(() => {
    if (aktivniIdx >= aktivni.length && aktivni.length > 0) setAktivniIdx(0)
  }, [aktivni.length])

  if (zavrsioId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-teal-50 dark:bg-slate-900">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl"
          style={{ backgroundColor: '#01696f' }}>
          <Check size={48} className="text-white" strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Odlično! 🎉</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">Apartman je očišćen i spreman za goste.</p>
        {aktivni.filter(t => t.id !== zavrsioId).length > 0 ? (
          <button onClick={() => setZavrsioId(null)}
            className="px-8 py-3 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#01696f' }}>
            Sledeći zadatak →
          </button>
        ) : (
          <div className="mt-2 text-slate-400 text-sm">Nema više zadataka za danas 🏖️</div>
        )}
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900">
        <div className="text-6xl mb-4">🧹</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Nema zadataka</h2>
        <p className="text-slate-400 text-base">Nema zadataka čišćenja za danas.</p>
        <p className="text-slate-300 dark:text-slate-600 text-sm mt-2">Proveri ponovo kasnije.</p>
      </div>
    )
  }

  const zavrsenoCount = task.stavke.filter(s => s.zavrseno).length
  const procenat = task.stavke.length ? Math.round((zavrsenoCount / task.stavke.length) * 100) : 0
  const sveZavrseno = task.stavke.length > 0 && zavrsenoCount === task.stavke.length

  async function handleZavrseno() {
    await supabase.from('cistacke_tasks').update({ status: 'zavrseno' }).eq('id', task.id)
    setZavrsioId(task.id)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-5 pt-6 pb-5 shadow-sm">
        {/* Task switcher dots */}
        {aktivni.length > 1 && (
          <div className="flex gap-2 mb-4">
            {aktivni.map((t, i) => (
              <button key={t.id} onClick={() => setAktivniIdx(i)}
                className={`flex-1 h-2 rounded-full transition-all ${i === aktivniIdx ? 'opacity-100' : 'opacity-25'}`}
                style={{ backgroundColor: '#01696f' }} />
            ))}
          </div>
        )}

        {aktivni.length > 1 && (
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Zadatak {aktivniIdx + 1} od {aktivni.length}
          </p>
        )}

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: (apt?.boja || '#01696f') + '20' }}>
            🏠
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate">{apt?.naziv || 'Apartman'}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {task.datum === danas ? 'Danas' : task.datum} · {task.vreme}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {zavrsenoCount} od {task.stavke.length} završeno
            </span>
            <span className="text-sm font-bold" style={{ color: '#01696f' }}>{procenat}%</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${procenat}%`, backgroundColor: '#01696f' }} />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-36">
        {task.stavke.map(stavka => (
          <button
            key={stavka.id}
            onClick={() => toggleStavka(task.id, stavka.id, stavka.zavrseno)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 ${
              stavka.zavrseno
                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            {/* Big checkbox */}
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              stavka.zavrseno
                ? 'border-teal-600 text-white'
                : 'border-slate-300 dark:border-slate-600'
            }`} style={stavka.zavrseno ? { backgroundColor: '#01696f', borderColor: '#01696f' } : {}}>
              {stavka.zavrseno && <Check size={16} className="text-white" strokeWidth={3} />}
            </div>

            <span className={`text-base font-medium flex-1 text-left leading-snug ${
              stavka.zavrseno
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-white'
            }`}>
              {stavka.naziv}
            </span>

            {stavka.ts && (
              <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#01696f' }}>
                {stavka.ts}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom button — fixed */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-2xl">
        <button
          onClick={sveZavrseno ? handleZavrseno : undefined}
          className={`w-full py-5 text-lg font-bold rounded-2xl transition-all ${
            sveZavrseno
              ? 'text-white shadow-lg active:scale-95'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
          style={sveZavrseno ? { backgroundColor: '#01696f' } : {}}
        >
          {sveZavrseno
            ? '✓  ZAVRŠENO'
            : `Još ${task.stavke.length - zavrsenoCount} ${task.stavke.length - zavrsenoCount === 1 ? 'stavka' : 'stavke'}`
          }
        </button>
      </div>

    </div>
  )
}

// ─── OWNER VIEW (full dashboard) ──────────────────────────────────────────
export default function CistacijeHub({ apartmani = [] }) {
  const { user, profile } = useAuth()
  const [taskovi, setTaskovi] = useState([])
  const [loading, setLoading] = useState(true)
  const [noviTask, setNoviTask] = useState(false)
  const [forma, setForma] = useState({ apartmanId: '', datum: '', vreme: '10:00' })
  const [brisanje, setBrisanje] = useState(null)
  const [izmena, setIzmena] = useState(null)
  const [izmenaForma, setIzmenaForma] = useState({ apartmanId: '', datum: '', vreme: '' })

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase
      .from('cistacke_tasks')
      .select('*, cistacke_stavke(*)')
      .order('datum', { ascending: false })

    setTaskovi((data || []).map(t => ({
      ...t,
      apartmanId: t.apartman_id,
      stavke: (t.cistacke_stavke || []).sort((a, b) => a.id - b.id),
    })))
    setLoading(false)
  }

  async function toggleStavka(taskId, stavkaId, trenutnoZavrseno) {
    const novoZavrseno = !trenutnoZavrseno
    const ts = novoZavrseno ? new Date().toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' }) : null
    await supabase.from('cistacke_stavke').update({ zavrseno: novoZavrseno, ts }).eq('id', stavkaId)

    const task = taskovi.find(t => t.id === taskId)
    const novaStavke = task.stavke.map(s => s.id === stavkaId ? { ...s, zavrseno: novoZavrseno, ts } : s)
    const sveZavrseno = novaStavke.every(s => s.zavrseno)
    const imaZavrsenih = novaStavke.some(s => s.zavrseno)
    const noviStatus = sveZavrseno ? 'zavrseno' : imaZavrsenih ? 'u_toku' : 'ceka'
    await supabase.from('cistacke_tasks').update({ status: noviStatus }).eq('id', taskId)

    setTaskovi(taskovi.map(t => t.id !== taskId ? t : { ...t, status: noviStatus, stavke: novaStavke }))
  }

  function otvoriIzmenu(task) {
    setIzmenaForma({ apartmanId: task.apartmanId, datum: task.datum, vreme: task.vreme })
    setIzmena(task)
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

  async function dodajTask() {
    if (!forma.datum || !forma.apartmanId) return
    const { data: task, error } = await supabase
      .from('cistacke_tasks')
      .insert([{ user_id: user.id, apartman_id: Number(forma.apartmanId), datum: forma.datum, vreme: forma.vreme, status: 'ceka' }])
      .select()
      .single()

    if (!error && task) {
      await supabase.from('cistacke_stavke').insert(
        STAVKE_DEFAULT.map(naziv => ({ task_id: task.id, naziv, zavrseno: false }))
      )
    }
    await load()
    setNoviTask(false)
    setForma({ apartmanId: '', datum: '', vreme: '10:00' })
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

  // ── Čistačica vidi mobile view ──
  if (profile?.role === 'cistacica') {
    return <CleanerView taskovi={taskovi} apartmani={apartmani} toggleStavka={toggleStavka} />
  }

  // ── Vlasnik/kooperant vidi puni dashboard ──
  const zavrseno = taskovi.filter(t => t.status === 'zavrseno').length
  const uToku = taskovi.filter(t => t.status === 'u_toku').length
  const ceka = taskovi.filter(t => t.status === 'ceka').length

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { naziv: 'Završeno', broj: zavrseno, boja: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { naziv: 'U toku', broj: uToku, boja: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { naziv: 'Čeka', broj: ceka, boja: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(s => (
          <div key={s.naziv} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold" style={{ color: s.boja }}>{s.broj}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{s.naziv}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 dark:text-white">Zadaci čišćenja</h2>
        <button onClick={() => setNoviTask(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#01696f' }}>
          <Plus size={15} /> Novi zadatak
        </button>
      </div>

      {taskovi.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3 opacity-30">🧹</p>
          <p>Nema zadataka — dodaj prvi</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {taskovi.map(task => {
          const apt = apartmani.find(a => a.id === task.apartmanId)
          const zavrsenoStavki = task.stavke.filter(s => s.zavrseno).length
          const Ikona = statusIkona[task.status]
          const procenat = task.stavke.length ? Math.round((zavrsenoStavki / task.stavke.length) * 100) : 0
          return (
            <div key={task.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (apt?.boja || '#94a3b8') + '20' }}>
                    <Home size={16} style={{ color: apt?.boja || '#94a3b8' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{apt?.naziv || '—'}</p>
                    <p className="text-xs text-slate-400">{task.datum} · {task.vreme}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${statusBoje[task.status]}`}>
                    <Ikona size={11} /> {statusNaziv[task.status]}
                  </span>
                  <button onClick={() => otvoriIzmenu(task)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setBrisanje(task)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{zavrsenoStavki}/{task.stavke.length} stavki</span>
                  <span>{procenat}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${procenat}%`, backgroundColor: '#01696f' }} />
                </div>
              </div>

              <div className="space-y-2">
                {task.stavke.map(stavka => (
                  <button key={stavka.id} onClick={() => toggleStavka(task.id, stavka.id, stavka.zavrseno)}
                    className="w-full flex items-center gap-3 text-left group">
                    <div className={`flex-shrink-0 transition-colors ${stavka.zavrseno ? 'text-teal-600 dark:text-teal-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`}>
                      {stavka.zavrseno ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                    <span className={`text-sm flex-1 ${stavka.zavrseno ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                      {stavka.naziv}
                    </span>
                    {stavka.ts && <span className="text-xs text-slate-400 flex-shrink-0">{stavka.ts}</span>}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {brisanje && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBrisanje(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Obriši zadatak?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              {apartmani.find(a => a.id === brisanje.apartmanId)?.naziv} · {brisanje.datum}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBrisanje(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
              <button onClick={() => obrisi(brisanje.id)} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 transition-colors">Obriši</button>
            </div>
          </div>
        </div>
      )}

      {izmena && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIzmena(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800 dark:text-white">Izmeni zadatak</h3>
              <button onClick={() => setIzmena(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Apartman</label>
                <select value={izmenaForma.apartmanId} onChange={e => setIzmenaForma({...izmenaForma, apartmanId: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                  {apartmani.map(a => <option key={a.id} value={a.id}>{a.naziv}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Datum</label>
                <input type="date" value={izmenaForma.datum} onChange={e => setIzmenaForma({...izmenaForma, datum: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Vreme</label>
                <input type="time" value={izmenaForma.vreme} onChange={e => setIzmenaForma({...izmenaForma, vreme: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setIzmena(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
              <button onClick={sacuvajIzmenu} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>Sačuvaj</button>
            </div>
          </div>
        </div>
      )}

      {noviTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNoviTask(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800 dark:text-white">Novi zadatak čišćenja</h3>
              <button onClick={() => setNoviTask(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Apartman</label>
                <select value={forma.apartmanId} onChange={e => setForma({...forma, apartmanId: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                  <option value="">Odaberi apartman</option>
                  {apartmani.map(a => <option key={a.id} value={a.id}>{a.naziv}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Datum</label>
                <input type="date" value={forma.datum} onChange={e => setForma({...forma, datum: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Vreme</label>
                <input type="time" value={forma.vreme} onChange={e => setForma({...forma, vreme: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setNoviTask(false)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
              <button onClick={dodajTask} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>Dodaj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
