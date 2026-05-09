import React, { useState } from 'react'
import { CheckSquare, Square, Clock, CheckCheck, AlertCircle, Home, Plus, X } from 'lucide-react'
import { cistaceTasks as initialTasks, apartmani } from '../data/mockData'

const statusBoje = {
  zavrseno: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  u_toku:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ceka:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}
const statusNaziv = { zavrseno: 'Završeno', u_toku: 'U toku', ceka: 'Čeka' }
const statusIkona = { zavrseno: CheckCheck, u_toku: Clock, ceka: AlertCircle }

export default function CistacijeHub() {
  const [taskovi, setTaskovi] = useState(initialTasks)
  const [noviTask, setNoviTask] = useState(false)
  const [forma, setForma] = useState({ apartmanId: 1, datum: '', vreme: '10:00' })

  function toggleStavka(taskId, stavkaId) {
    setTaskovi(taskovi.map(t => {
      if (t.id !== taskId) return t
      const stavke = t.stavke.map(s => s.id === stavkaId ? { ...s, zavrseno: !s.zavrseno, ts: !s.zavrseno ? new Date().toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' }) : null } : s)
      const sveZavrseno = stavke.every(s => s.zavrseno)
      return { ...t, stavke, status: sveZavrseno ? 'zavrseno' : t.status === 'ceka' ? 'u_toku' : t.status }
    }))
  }

  function dodajTask() {
    if (!forma.datum) return
    const apt = apartmani.find(a => a.id === Number(forma.apartmanId))
    const novi = {
      id: Date.now(),
      apartmanId: Number(forma.apartmanId),
      datum: forma.datum,
      vreme: forma.vreme,
      status: 'ceka',
      stavke: [
        { id: 1, naziv: 'Posteljina i peškiri', zavrseno: false, ts: null },
        { id: 2, naziv: 'Kupatilo', zavrseno: false, ts: null },
        { id: 3, naziv: 'Kuhinja i sudovi', zavrseno: false, ts: null },
        { id: 4, naziv: 'Usisavanje i brisanje', zavrseno: false, ts: null },
        { id: 5, naziv: 'Terasa', zavrseno: false, ts: null },
      ],
    }
    setTaskovi([novi, ...taskovi])
    setNoviTask(false)
    setForma({ apartmanId: 1, datum: '', vreme: '10:00' })
  }

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
        <button
          onClick={() => setNoviTask(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#01696f' }}
        >
          <Plus size={15} /> Novi zadatak
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {taskovi.map(task => {
          const apt = apartmani.find(a => a.id === task.apartmanId)
          const zavrsenoStavki = task.stavke.filter(s => s.zavrseno).length
          const Ikona = statusIkona[task.status]
          const procenat = Math.round((zavrsenoStavki / task.stavke.length) * 100)
          return (
            <div key={task.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: apt?.boja + '20' }}>
                    <Home size={16} style={{ color: apt?.boja }} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{apt?.naziv}</p>
                    <p className="text-xs text-slate-400">{task.datum} · {task.vreme}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${statusBoje[task.status]}`}>
                  <Ikona size={11} /> {statusNaziv[task.status]}
                </span>
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
                  <button
                    key={stavka.id}
                    onClick={() => toggleStavka(task.id, stavka.id)}
                    className="w-full flex items-center gap-3 text-left group"
                  >
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
              <button onClick={dodajTask} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>Sačuvaj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
