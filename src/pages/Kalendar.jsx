import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { supabase, mapRezervacija } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const DANI = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']
const MESECI = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']

function dateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function getDayOfWeek(y, m, d) {
  const day = new Date(y, m, d).getDay()
  return day === 0 ? 6 : day - 1
}

function getDaysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate()
}

// Build week rows: each row is array of {day, date} or null for padding
function buildWeeks(godina, mesec) {
  const total = getDaysInMonth(godina, mesec)
  const firstDow = getDayOfWeek(godina, mesec, 1)
  const weeks = []
  let week = Array(firstDow).fill(null)

  for (let d = 1; d <= total; d++) {
    week.push({ day: d, date: dateStr(godina, mesec, d) })
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

// For a given week row, find reservations and their column span
function getRezForWeek(weekDays, rez) {
  const validDays = weekDays.filter(Boolean)
  if (!validDays.length) return []

  const weekStart = validDays[0].date
  const weekEnd = validDays[validDays.length - 1].date

  return rez
    .filter(r => r.status !== 'otkazano' && r.dolazak <= weekEnd && r.odlazak > weekStart)
    .map(r => {
      const startCol = weekDays.findIndex(d => d && d.date >= r.dolazak)
      const lastCol = weekDays.findLastIndex(d => d && d.date < r.odlazak)
      const col = startCol === -1 ? 0 : startCol
      const end = lastCol === -1 ? 6 : lastCol
      return { ...r, col, span: end - col + 1 }
    })
}

const statusBadge = {
  potvrdjeno: 'Potvrđeno',
  zavrseno: 'Završeno',
  cekanje: 'Na čekanju',
  otkazano: 'Otkazano',
}

export default function Kalendar({ syncedRez = [], apartmani = [] }) {
  const { user } = useAuth()
  const today = new Date()
  const [godina, setGodina] = useState(today.getFullYear())
  const [mesec, setMesec] = useState(today.getMonth())
  const [rez, setRez] = useState([])
  const [odabranaRez, setOdabranaRez] = useState(null)
  const [novaRez, setNovaRez] = useState(false)
  const [izmenaRez, setIzmenaRez] = useState(null)
  const [brisanjeRez, setBrisanjeRez] = useState(null)
  const [forma, setForma] = useState({ gost: '', apartmanId: '', dolazak: '', odlazak: '', izvor: 'Direktno', kontakt: '' })
  const [izmenaForma, setIzmenaForma] = useState({})

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('rezervacije').select('*')
    setRez((data || []).map(mapRezervacija))
  }

  const sveRez = [...rez, ...syncedRez.filter(s => !rez.some(r => r.id === s.id))]

  const weeks = buildWeeks(godina, mesec)

  function prethodniMesec() {
    if (mesec === 0) { setGodina(g => g - 1); setMesec(11) } else setMesec(m => m - 1)
  }
  function sledecMesec() {
    if (mesec === 11) { setGodina(g => g + 1); setMesec(0) } else setMesec(m => m + 1)
  }

  function otvoriIzmenu(r) {
    setIzmenaForma({ gost: r.gost, apartmanId: r.apartmanId, dolazak: r.dolazak, odlazak: r.odlazak, izvor: r.izvor || 'Direktno', kontakt: r.kontakt || '', napomena: r.napomena || '', status: r.status })
    setIzmenaRez(r)
    setOdabranaRez(null)
  }

  async function sacuvajIzmenu() {
    if (!izmenaForma.gost || !izmenaForma.dolazak || !izmenaForma.odlazak) return
    const apt = apartmani.find(a => a.id === Number(izmenaForma.apartmanId))
    const nights = Math.max(1, Math.round((new Date(izmenaForma.odlazak) - new Date(izmenaForma.dolazak)) / 86400000))
    await supabase.from('rezervacije').update({
      gost: izmenaForma.gost, apartman_id: Number(izmenaForma.apartmanId),
      dolazak: izmenaForma.dolazak, odlazak: izmenaForma.odlazak,
      izvor: izmenaForma.izvor, kontakt: izmenaForma.kontakt,
      status: izmenaForma.status, cena: nights * (apt?.cenaPoNoci || 0),
    }).eq('id', izmenaRez.id)
    await load()
    setIzmenaRez(null)
  }

  async function obrisiRez(id) {
    await supabase.from('rezervacije').delete().eq('id', id)
    setRez(rez.filter(r => r.id !== id))
    setBrisanjeRez(null)
    setOdabranaRez(null)
  }

  async function dodajRez() {
    if (!forma.gost || !forma.dolazak || !forma.odlazak) return
    const apt = apartmani.find(a => a.id === Number(forma.apartmanId))
    const nights = Math.max(1, Math.round((new Date(forma.odlazak) - new Date(forma.dolazak)) / 86400000))
    await supabase.from('rezervacije').insert([{
      user_id: user.id, apartman_id: Number(forma.apartmanId),
      gost: forma.gost, dolazak: forma.dolazak, odlazak: forma.odlazak,
      cena: nights * (apt?.cenaPoNoci || 0), status: 'potvrdjeno',
      izvor: forma.izvor, kontakt: forma.kontakt, napomena: '',
    }])
    await load()
    setNovaRez(false)
    setForma({ gost: '', apartmanId: '', dolazak: '', odlazak: '', izvor: 'Direktno', kontakt: '' })
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <button onClick={prethodniMesec} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-slate-800 dark:text-white">{MESECI[mesec]} {godina}</h2>
            <button
              onClick={() => setNovaRez(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#01696f' }}
            >
              <Plus size={13} /> Nova rezervacija
            </button>
          </div>
          <button onClick={sledecMesec} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dan headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
          {DANI.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-2">{d}</div>
          ))}
        </div>

        {/* Weeks */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {weeks.map((week, wi) => {
            const weekRez = getRezForWeek(week, sveRez)
            // Group by apartment for stacking
            const aptRows = apartmani.map(a => ({
              apt: a,
              items: weekRez.filter(r => r.apartmanId === a.id),
            })).filter(row => row.items.length > 0)

            return (
              <div key={wi} className="relative">
                {/* Day numbers row */}
                <div className="grid grid-cols-7">
                  {week.map((cell, ci) => {
                    if (!cell) return <div key={ci} className="h-10 bg-slate-50/50 dark:bg-slate-900/20" />
                    const isToday = cell.day === today.getDate() && mesec === today.getMonth() && godina === today.getFullYear()
                    const hasRez = weekRez.some(r => r.col <= ci && r.col + r.span > ci)
                    return (
                      <div key={ci}
                        className={`h-10 flex items-start justify-start pt-1.5 pl-2 border-r border-slate-100 dark:border-slate-700 last:border-r-0 ${hasRez ? 'bg-slate-50 dark:bg-slate-700/20' : ''}`}
                      >
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                          ${isToday ? 'text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}
                          style={isToday ? { backgroundColor: '#01696f' } : {}}
                        >
                          {cell.day}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Reservation bars */}
                {aptRows.length > 0 && (
                  <div className="px-0.5 pb-1.5 space-y-1">
                    {aptRows.map(({ apt, items }) =>
                      items.map(r => (
                        <div
                          key={r.id}
                          onClick={() => setOdabranaRez(r)}
                          className="relative grid grid-cols-7 cursor-pointer"
                        >
                          {/* Invisible spacer cells */}
                          {Array.from({ length: 7 }).map((_, ci) => (
                            <div key={ci} className="h-6" />
                          ))}
                          {/* The bar itself */}
                          <div
                            className="absolute top-0 h-6 flex items-center px-2 rounded-md text-white text-[10px] font-semibold truncate hover:brightness-110 transition-all shadow-sm"
                            style={{
                              left: `calc(${r.col / 7 * 100}% + 2px)`,
                              width: `calc(${r.span / 7 * 100}% - 4px)`,
                              backgroundColor: apt.boja,
                            }}
                          >
                            {r.span > 1 ? r.gost : '•'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {aptRows.length === 0 && <div className="h-2" />}
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-4 flex-wrap">
          {apartmani.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: a.boja }} />
              {a.naziv}
            </div>
          ))}
        </div>
      </div>

      {/* Detalji rezervacije */}
      {odabranaRez && (() => {
        const apt = apartmani.find(a => a.id === odabranaRez.apartmanId)
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOdabranaRez(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-10 rounded-full" style={{ backgroundColor: apt?.boja }} />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{odabranaRez.gost}</p>
                    <p className="text-xs text-slate-400">{apt?.naziv}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => otvoriIzmenu(odabranaRez)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"><Pencil size={15} /></button>
                  <button onClick={() => { setBrisanjeRez(odabranaRez); setOdabranaRez(null) }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  <button onClick={() => setOdabranaRez(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"><X size={15} /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  ['Dolazak', odabranaRez.dolazak],
                  ['Odlazak', odabranaRez.odlazak],
                  ['Iznos', `€${odabranaRez.cena}`],
                  ['Izvor', odabranaRez.izvor],
                  odabranaRez.kontakt && ['Kontakt', odabranaRez.kontakt],
                  odabranaRez.napomena && ['Napomena', odabranaRez.napomena],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500">{k}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500">Status</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {statusBadge[odabranaRez.status]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Nova rezervacija modal */}
      {novaRez && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNovaRez(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800 dark:text-white">Nova rezervacija</h3>
              <button onClick={() => setNovaRez(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Ime gosta', key: 'gost', placeholder: 'Ime i prezime' },
                { label: 'Kontakt', key: 'kontakt', placeholder: '+381 ...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">{f.label}</label>
                  <input value={forma[f.key]} onChange={e => setForma({...forma, [f.key]: e.target.value})} placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Apartman</label>
                <select value={forma.apartmanId} onChange={e => setForma({...forma, apartmanId: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                  {apartmani.map(a => <option key={a.id} value={a.id}>{a.naziv}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Dolazak</label>
                  <input type="date" value={forma.dolazak} onChange={e => setForma({...forma, dolazak: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Odlazak</label>
                  <input type="date" value={forma.odlazak} onChange={e => setForma({...forma, odlazak: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Izvor</label>
                <select value={forma.izvor} onChange={e => setForma({...forma, izvor: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                  {['Direktno', 'Booking.com', 'Airbnb'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setNovaRez(false)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
              <button onClick={dodajRez} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>Sačuvaj</button>
            </div>
          </div>
        </div>
      )}
      {/* Izmeni rezervaciju modal */}
      {izmenaRez && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIzmenaRez(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800 dark:text-white">Izmeni rezervaciju</h3>
              <button onClick={() => setIzmenaRez(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Ime gosta', key: 'gost', placeholder: 'Ime i prezime' },
                { label: 'Kontakt', key: 'kontakt', placeholder: '+381 ...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">{f.label}</label>
                  <input value={izmenaForma[f.key] || ''} onChange={e => setIzmenaForma({...izmenaForma, [f.key]: e.target.value})} placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Apartman</label>
                <select value={izmenaForma.apartmanId} onChange={e => setIzmenaForma({...izmenaForma, apartmanId: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                  {apartmani.map(a => <option key={a.id} value={a.id}>{a.naziv}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Dolazak</label>
                  <input type="date" value={izmenaForma.dolazak} onChange={e => setIzmenaForma({...izmenaForma, dolazak: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Odlazak</label>
                  <input type="date" value={izmenaForma.odlazak} onChange={e => setIzmenaForma({...izmenaForma, odlazak: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Izvor</label>
                <select value={izmenaForma.izvor} onChange={e => setIzmenaForma({...izmenaForma, izvor: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                  {['Direktno', 'Booking.com', 'Airbnb'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
                <select value={izmenaForma.status} onChange={e => setIzmenaForma({...izmenaForma, status: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                  {[['potvrdjeno','Potvrđeno'],['cekanje','Na čekanju'],['zavrseno','Završeno'],['otkazano','Otkazano']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setIzmenaRez(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
              <button onClick={sacuvajIzmenu} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>Sačuvaj</button>
            </div>
          </div>
        </div>
      )}

      {/* Brisanje rezervacije */}
      {brisanjeRez && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBrisanjeRez(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Obriši rezervaciju?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Ovo će trajno ukloniti rezervaciju za <span className="font-medium text-slate-700 dark:text-slate-200">{brisanjeRez.gost}</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBrisanjeRez(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
              <button onClick={() => obrisiRez(brisanjeRez.id)} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 transition-colors">Obriši</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
