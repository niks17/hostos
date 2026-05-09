import React, { useState } from 'react'
import { Plus, X, Search, Home, Link } from 'lucide-react'
import { rezervacije as initialRez, apartmani } from '../data/mockData'

const statusBoje = {
  potvrdjeno: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  zavrseno:   'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  cekanje:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  otkazano:   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}
const statusNaziv = { potvrdjeno: 'Potvrđeno', zavrseno: 'Završeno', cekanje: 'Na čekanju', otkazano: 'Otkazano' }

const FILTERI = ['sve', 'potvrdjeno', 'cekanje', 'zavrseno', 'otkazano']
const filterNaziv = { sve: 'Sve', potvrdjeno: 'Potvrđene', cekanje: 'Na čekanju', zavrseno: 'Završene', otkazano: 'Otkazane' }

export default function Rezervacije({ syncedRez = [] }) {
  const [rez, setRez] = useState(initialRez)

  // Merge manual + iCal, deduplicate by id
  const sveRez = [
    ...rez,
    ...syncedRez.filter(s => !rez.some(r => r.id === s.id)),
  ]
  const [filter, setFilter] = useState('sve')
  const [pretraga, setPretraga] = useState('')
  const [novaRez, setNovaRez] = useState(false)
  const [detalj, setDetalj] = useState(null)
  const [forma, setForma] = useState({ gost: '', apartmanId: 1, dolazak: '', odlazak: '', izvor: 'Direktno', napomena: '', kontakt: '' })

  const filtrirane = sveRez.filter(r => {
    const matchFilter = filter === 'sve' || r.status === filter
    const matchSearch = r.gost.toLowerCase().includes(pretraga.toLowerCase()) ||
      apartmani.find(a => a.id === r.apartmanId)?.naziv.toLowerCase().includes(pretraga.toLowerCase())
    return matchFilter && matchSearch
  })

  function dodajRez() {
    if (!forma.gost || !forma.dolazak || !forma.odlazak) return
    const apt = apartmani.find(a => a.id === Number(forma.apartmanId))
    const nights = Math.max(1, Math.round((new Date(forma.odlazak) - new Date(forma.dolazak)) / 86400000))
    const nova = {
      id: Date.now(),
      apartmanId: Number(forma.apartmanId),
      gostId: null,
      gost: forma.gost,
      dolazak: forma.dolazak,
      odlazak: forma.odlazak,
      cena: nights * (apt?.cenaPoNoci || 0),
      status: 'potvrdjeno',
      izvor: forma.izvor,
      kontakt: forma.kontakt,
      napomena: forma.napomena,
    }
    setRez([nova, ...rez])
    setNovaRez(false)
    setForma({ gost: '', apartmanId: 1, dolazak: '', odlazak: '', izvor: 'Direktno', napomena: '', kontakt: '' })
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTERI.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
              style={filter === f ? { backgroundColor: '#01696f' } : {}}
            >
              {filterNaziv[f]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={pretraga}
              onChange={e => setPretraga(e.target.value)}
              placeholder="Pretraži..."
              className="w-full sm:w-48 pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500 dark:text-white transition-colors"
            />
          </div>
          <button
            onClick={() => setNovaRez(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: '#01696f' }}
          >
            <Plus size={16} /> Nova
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Gost', 'Apartman', 'Dolazak', 'Odlazak', 'Iznos', 'Izvor', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtrirane.map(r => {
                const apt = apartmani.find(a => a.id === r.apartmanId)
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => setDetalj(r)}>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{r.gost}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: apt?.boja + '20' }}>
                          <Home size={12} style={{ color: apt?.boja }} />
                        </div>
                        <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{apt?.naziv}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.dolazak}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.odlazak}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">€{r.cena}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-slate-400">{r.izvor}</span>
                        {r.icalImport && <Link size={11} className="text-teal-500" title="Uvezeno iCal" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${statusBoje[r.status]}`}>
                        {statusNaziv[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setDetalj(r) }}
                        className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-xs font-medium"
                      >
                        Detalji
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtrirane.length === 0 && (
            <p className="text-center text-slate-400 py-10 text-sm">Nema rezervacija</p>
          )}
        </div>
      </div>

      {novaRez && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNovaRez(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
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
                  {['Direktno', 'Booking.com', 'Airbnb'].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Kontakt</label>
                <input value={forma.kontakt} onChange={e => setForma({...forma, kontakt: e.target.value})} placeholder="+381 ..." className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Napomena</label>
                <textarea value={forma.napomena} onChange={e => setForma({...forma, napomena: e.target.value})} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setNovaRez(false)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
              <button onClick={dodajRez} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>Sačuvaj</button>
            </div>
          </div>
        </div>
      )}

      {detalj && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetalj(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-white">Detalji rezervacije</h3>
              <button onClick={() => setDetalj(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                ['Gost', detalj.gost],
                ['Apartman', apartmani.find(a => a.id === detalj.apartmanId)?.naziv],
                ['Dolazak', detalj.dolazak],
                ['Odlazak', detalj.odlazak],
                ['Iznos', `€${detalj.cena}`],
                ['Izvor', detalj.izvor],
                ['Kontakt', detalj.kontakt],
                detalj.napomena && ['Napomena', detalj.napomena],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-400 dark:text-slate-500">{k}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 dark:text-slate-500">Status</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBoje[detalj.status]}`}>{statusNaziv[detalj.status]}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
