import React, { useState, useEffect } from 'react'
import { CheckSquare, Square, Clock, CheckCheck, AlertCircle, Home, Plus, X, Trash2, Pencil } from 'lucide-react'
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

export default function CistacijeHub({ apartmani = [] }) {
  const { user } = useAuth()
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

  async function toggleStavka(taskId, stavkaId, trenutnoZavrseno) {
    const novoZavrseno = !trenutnoZavrseno
    const ts = novoZavrseno ? new Date().toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' }) : null
    await supabase.from('cistacke_stavke').update({ zavrseno: novoZavrseno, ts }).eq('id', stavkaId)

    // Update task status
    const task = taskovi.find(t => t.id === taskId)
    const novaStavke = task.stavke.map(s => s.id === stavkaId ? { ...s, zavrseno: novoZavrseno, ts } : s)
    const sveZavrseno = novaStavke.every(s => s.zavrseno)
    const imaZavrsenih = novaStavke.some(s => s.zavrseno)
    const noviStatus = sveZavrseno ? 'zavrseno' : imaZavrsenih ? 'u_toku' : 'ceka'
    await supabase.from('cistacke_tasks').update({ status: noviStatus }).eq('id', taskId)

    setTaskovi(taskovi.map(t => t.id !== taskId ? t : { ...t, status: noviStatus, stavke: novaStavke }))
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

  const zavrseno = taskovi.filter(t => t.status === 'zavrseno').length
  const uToku = taskovi.filter(t => t.status === 'u_toku').length
  const ceka = taskovi.filter(t => t.status === 'ceka').length

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>

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
        <button onClick={() => setNoviTask(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>
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
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (apt?.boja || '#94a3b8') + '20' }}>
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
                  <button onClick={() => otvoriIzmenu(task)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => setBrisanje(task)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{zavrsenoStavki}/{task.stavke.length} stavki</span>
                  <span>{procenat}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${procenat}%`, backgroundColor: '#01696f' }} />
                </div>
              </div>

              <div className="space-y-2">
                {task.stavke.map(stavka => (
                  <button key={stavka.id} onClick={() => toggleStavka(task.id, stavka.id, stavka.zavrseno)} className="w-full flex items-center gap-3 text-left group">
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
