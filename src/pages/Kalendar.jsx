import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Home } from 'lucide-react'
import { rezervacije as initialRez, apartmani } from '../data/mockData'

const DANI = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']
const MESECI = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export default function Kalendar() {
  const today = new Date()
  const [godina, setGodina] = useState(today.getFullYear())
  const [mesec, setMesec] = useState(today.getMonth())
  const [rez, setRez] = useState(initialRez)
  const [izabranDan, setIzabranDan] = useState(null)
  const [novaRez, setNovaRez] = useState(false)
  const [forma, setForma] = useState({ gost: '', apartmanId: 1, dolazak: '', odlazak: '', izvor: 'Direktno', kontakt: '' })

  const danaUMesecu = getDaysInMonth(godina, mesec)
  const prviDan = getFirstDayOfMonth(godina, mesec)

  function prethodniMesec() {
    if (mesec === 0) { setGodina(g => g - 1); setMesec(11) } else setMesec(m => m - 1)
  }
  function sledecMesec() {
    if (mesec === 11) { setGodina(g => g + 1); setMesec(0) } else setMesec(m => m + 1)
  }

  function getRezForDay(day) {
    const date = `${godina}-${String(mesec + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return rez.filter(r => r.dolazak <= date && r.odlazak > date && r.status !== 'otkazano')
  }

  function getDayColor(r) {
    if (!r) return null
    const apt = apartmani.find(a => a.id === r.apartmanId)
    return apt?.boja || '#01696f'
  }

  function dodajRez() {
    if (!forma.gost || !forma.dolazak || !forma.odlazak) return
    const apt = apartmani.find(a => a.id === Number(forma.apartmanId))
    const nights = Math.max(1, Math.round((new Date(forma.odlazak) - new Date(forma.dolazak)) / 86400000))
    setRez([{ id: Date.now(), apartmanId: Number(forma.apartmanId), gostId: null, gost: forma.gost, dolazak: forma.dolazak, odlazak: forma.odlazak, cena: nights * (apt?.cenaPoNoci || 0), status: 'potvrdjeno', izvor: forma.izvor, kontakt: forma.kontakt, napomena: '' }, ...rez])
    setNovaRez(false)
    setForma({ gost: '', apartmanId: 1, dolazak: '', odlazak: '', izvor: 'Direktno', kontakt: '' })
  }

  const izabranDatum = izabranDan ? `${godina}-${String(mesec + 1).padStart(2, '0')}-${String(izabranDan).padStart(2, '0')}` : null
  const rezZaDan = izabranDan ? getRezForDay(izabranDan) : []

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <button onClick={prethodniMesec} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-slate-800 dark:text-white">{MESECI[mesec]} {godina}</h2>
          <button onClick={sledecMesec} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {DANI.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: prviDan }).map((_, i) => <div key={`p${i}`} />)}
            {Array.from({ length: danaUMesecu }).map((_, i) => {
              const day = i + 1
              const rezDana = getRezForDay(day)
              const isToday = day === today.getDate() && mesec === today.getMonth() && godina === today.getFullYear()
              const isSelected = day === izabranDan
              return (
                <button
                  key={day}
                  onClick={() => setIzabranDan(isSelected ? null : day)}
                  className={`relative aspect-square flex flex-col items-center justify-start pt-1 rounded-xl text-xs transition-all
                    ${isSelected ? 'ring-2 ring-teal-500 ring-offset-1 dark:ring-offset-slate-800' : ''}
                    ${rezDana.length > 0 ? 'bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                  `}
                >
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full font-medium
                    ${isToday ? 'text-white font-bold' : 'text-slate-600 dark:text-slate-300'}
                  `} style={isToday ? { backgroundColor: '#01696f' } : {}}>
                    {day}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-0.5">
                    {rezDana.slice(0, 3).map(r => (
                      <div key={r.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getDayColor(r) }} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-4">
          {apartmani.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.boja }} />
              {a.naziv}
            </div>
          ))}
        </div>
      </div>

      {izabranDan && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 transition-colors animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              {izabranDan}. {MESECI[mesec]} {godina}
            </h3>
            <button
              onClick={() => { setForma({...forma, dolazak: izabranDatum, odlazak: ''}); setNovaRez(true) }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#01696f' }}
            >
              <Plus size={13} /> Rezerviši
            </button>
          </div>
          {rezZaDan.length === 0 ? (
            <p className="text-sm text-slate-400">Slobodan dan — nema rezervacija</p>
          ) : (
            <div className="space-y-3">
              {rezZaDan.map(r => {
                const apt = apartmani.find(a => a.id === r.apartmanId)
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: apt?.boja + '20' }}>
                      <Home size={15} style={{ color: apt?.boja }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{r.gost}</p>
                      <p className="text-xs text-slate-400">{apt?.naziv} · {r.dolazak} → {r.odlazak}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">€{r.cena}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {novaRez && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNovaRez(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800 dark:text-white">Nova rezervacija</h3>
              <button onClick={() => setNovaRez(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Ime gosta</label>
                <input value={forma.gost} onChange={e => setForma({...forma, gost: e.target.value})} placeholder="Ime i prezime" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Apartman</label>
                <select value={forma.apartmanId} onChange={e => setForma({...forma, apartmanId: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                  {apartmani.map(a => <option key={a.id} value={a.id}>{a.naziv}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Dolazak</label>
                  <input type="date" value={forma.dolazak} onChange={e => setForma({...forma, dolazak: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Odlazak</label>
                  <input type="date" value={forma.odlazak} onChange={e => setForma({...forma, odlazak: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Izvor</label>
                <select value={forma.izvor} onChange={e => setForma({...forma, izvor: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
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
    </div>
  )
}
