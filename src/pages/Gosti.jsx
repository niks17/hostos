import React, { useState } from 'react'
import { Search, Phone, Mail, Star, X, Plus, MapPin, Pencil, Trash2 } from 'lucide-react'
import { gosti as initialGosti, rezervacije, apartmani } from '../data/mockData'

const PRAZNA_FORMA = { ime: '', email: '', telefon: '', drzava: 'Srbija', napomena: '' }

function GostForma({ forma, setForma, onSacuvaj, onOtkazi, naslov }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onOtkazi}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800 dark:text-white">{naslov}</h3>
          <button onClick={onOtkazi} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Ime i prezime', key: 'ime', placeholder: 'Npr. Marko Petrović' },
            { label: 'Email', key: 'email', placeholder: 'email@gmail.com' },
            { label: 'Telefon', key: 'telefon', placeholder: '+381 ...' },
            { label: 'Država', key: 'drzava', placeholder: 'Srbija' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">{f.label}</label>
              <input value={forma[f.key]} onChange={e => setForma({...forma, [f.key]: e.target.value})} placeholder={f.placeholder}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Napomena</label>
            <textarea value={forma.napomena} onChange={e => setForma({...forma, napomena: e.target.value})} rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onOtkazi} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
          <button onClick={onSacuvaj} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>Sačuvaj</button>
        </div>
      </div>
    </div>
  )
}

export default function Gosti() {
  const [gosti, setGosti] = useState(initialGosti)
  const [pretraga, setPretraga] = useState('')
  const [izabrani, setIzabrani] = useState(null)
  const [modal, setModal] = useState(null) // null | 'novi' | 'izmena'
  const [forma, setForma] = useState(PRAZNA_FORMA)
  const [izmenaId, setIzmenaId] = useState(null)
  const [brisanje, setBrisanje] = useState(null)

  const filtrirani = gosti.filter(g =>
    g.ime.toLowerCase().includes(pretraga.toLowerCase()) ||
    g.email.toLowerCase().includes(pretraga.toLowerCase())
  )

  function otvoriNovog() { setForma(PRAZNA_FORMA); setIzmenaId(null); setModal('novi') }

  function otvoriIzmenu(g, e) {
    e.stopPropagation()
    setForma({ ime: g.ime, email: g.email, telefon: g.telefon, drzava: g.drzava, napomena: g.napomena || '' })
    setIzmenaId(g.id)
    setIzabrani(null)
    setModal('izmena')
  }

  function sacuvaj() {
    if (!forma.ime) return
    if (modal === 'novi') {
      setGosti([{ id: Date.now(), ...forma, brBoravaka: 0, ocena: 5.0 }, ...gosti])
    } else {
      setGosti(gosti.map(g => g.id === izmenaId ? { ...g, ...forma } : g))
    }
    setModal(null)
  }

  function obrisi(id) {
    setGosti(gosti.filter(g => g.id !== id))
    setBrisanje(null)
    setIzabrani(null)
  }

  const gostRez = izabrani ? rezervacije.filter(r => r.gostId === izabrani.id) : []

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={pretraga} onChange={e => setPretraga(e.target.value)} placeholder="Pretraži goste..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 dark:text-white transition-colors" />
        </div>
        <button onClick={otvoriNovog}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#01696f' }}>
          <Plus size={16} /> Novi gost
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtrirani.map(g => (
          <div key={g.id} onClick={() => setIzabrani(g)}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all animate-fade-in group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#01696f' }}>
                {g.ime.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => otvoriIzmenu(g, e)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={e => { e.stopPropagation(); setBrisanje(g) }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm mb-0.5">{g.ime}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mb-3">{g.email}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={12} fill="currentColor" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{g.ocena.toFixed(1)}</span>
              </div>
              <span className="text-xs text-slate-400">{g.brBoravaka} boravaka</span>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin size={11} /> {g.drzava}
              </div>
            </div>
            {g.napomena && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 italic truncate">"{g.napomena}"</p>}
          </div>
        ))}
      </div>

      {filtrirani.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3 opacity-30">👤</p>
          <p>Nema gostiju</p>
        </div>
      )}

      {/* Detalji gosta */}
      {izabrani && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIzabrani(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#01696f' }}>
                    {izabrani.ime.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{izabrani.ime}</h3>
                    <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                      <Star size={13} fill="currentColor" />
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{izabrani.ocena.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => otvoriIzmenu(izabrani, e)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setBrisanje(izabrani)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setIzabrani(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Mail size={14} /> {izabrani.email}</div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Phone size={14} /> {izabrani.telefon}</div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><MapPin size={14} /> {izabrani.drzava} · {izabrani.brBoravaka} boravaka</div>
                {izabrani.napomena && <p className="text-sm text-slate-400 italic">"{izabrani.napomena}"</p>}
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-3">Istorija boravaka</h4>
              {gostRez.length === 0 ? (
                <p className="text-sm text-slate-400">Nema evidentiranih boravaka</p>
              ) : gostRez.map(r => {
                const apt = apartmani.find(a => a.id === r.apartmanId)
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-sm mb-2">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">{apt?.naziv}</p>
                      <p className="text-xs text-slate-400">{r.dolazak} → {r.odlazak}</p>
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">€{r.cena}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {modal && <GostForma forma={forma} setForma={setForma} onSacuvaj={sacuvaj} onOtkazi={() => setModal(null)} naslov={modal === 'novi' ? 'Novi gost' : 'Izmeni gosta'} />}

      {brisanje && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBrisanje(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Obriši gosta?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Ovo će trajno ukloniti <span className="font-medium text-slate-700 dark:text-slate-200">{brisanje.ime}</span> iz liste gostiju.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBrisanje(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
              <button onClick={() => obrisi(brisanje.id)} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 transition-colors">Obriši</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
