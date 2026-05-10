import React, { useState, useEffect } from 'react'
import { Plus, X, Search, Home, Link, Pencil, Trash2, Phone, Mail, MessageCircle, PhoneCall, Send, Wifi, LogOut, ChevronRight } from 'lucide-react'
import { supabase, mapRezervacija, logActivity } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const statusBoje = {
  potvrdjeno: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  zavrseno:   'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  cekanje:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  otkazano:   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}
const statusNaziv = { potvrdjeno: 'Potvrđeno', zavrseno: 'Završeno', cekanje: 'Na čekanju', otkazano: 'Otkazano' }
const FILTERI = ['sve', 'potvrdjeno', 'cekanje', 'zavrseno', 'otkazano']
const filterNaziv = { sve: 'Sve', potvrdjeno: 'Potvrđene', cekanje: 'Na čekanju', zavrseno: 'Završene', otkazano: 'Otkazane' }
const PRAZNA_FORMA = { gost: '', apartmanId: '', dolazak: '', odlazak: '', izvor: 'Direktno', napomena: '', kontakt: '', status: 'potvrdjeno', brGostiju: 2 }

function waUrl(tel) { return `https://wa.me/${tel.replace(/\D/g, '')}` }
function viberUrl(tel) { return `viber://chat?number=${encodeURIComponent(tel.replace(/[\s\-()]/g, ''))}` }

function waUrlTekst(tel, tekst) { return `https://wa.me/${tel.replace(/\D/g, '')}?text=${encodeURIComponent(tekst)}` }

function templateCheckin(r, apt) {
  return `Pozdrav ${r.gost}! 👋\n\nVaša rezervacija za *${apt?.naziv || 'apartman'}* je potvrđena.\n\n📅 Check-in: ${r.dolazak} od 14:00\n📅 Check-out: ${r.odlazak} do 11:00\n📍 Adresa: ${apt?.lokacija || ''}\n\n${apt?.checkinInfo || 'Ključevi su na dogovorenom mestu.'}\n\nSrdačan pozdrav! 🏠`
}

function templateWifi(r, apt) {
  return `Pozdrav ${r.gost}! 📶\n\nWiFi podaci za *${apt?.naziv || 'apartman'}*:\n\n🌐 Mreža: ${apt?.wifiNaziv || '—'}\n🔑 Šifra: ${apt?.wifiSifra || '—'}\n\nPrijatan boravak! 😊`
}

function templateCheckout(r, apt) {
  return `Pozdrav ${r.gost}! 🙏\n\nPodsetnik — checkout je *${r.odlazak}* do 11:00.\n\nMolimo ostavite ključeve na ${apt?.checkinInfo ? 'istom mestu gde ste ih preuzeli' : 'dogovorenom mestu'}.\n\nHvala što ste boravili kod nas u *${apt?.naziv || 'apartmanu'}*! Nadam se da se vidimo opet. ⭐`
}

function RezModal({ forma, setForma, onSacuvaj, onOtkazi, naslov, apartmani }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onOtkazi}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800 dark:text-white">{naslov}</h3>
          <button onClick={onOtkazi} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Ime gosta</label>
            <input value={forma.gost} onChange={e => setForma({...forma, gost: e.target.value})} placeholder="Ime i prezime" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Apartman</label>
            <select value={forma.apartmanId} onChange={e => setForma({...forma, apartmanId: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
              <option value="">Odaberi apartman</option>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Broj gostiju</label>
              <input type="number" min="1" max="20" value={forma.brGostiju} onChange={e => setForma({...forma, brGostiju: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Izvor</label>
              <select value={forma.izvor} onChange={e => setForma({...forma, izvor: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                {['Direktno', 'Booking.com', 'Airbnb'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
              <select value={forma.status} onChange={e => setForma({...forma, status: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                {Object.entries(statusNaziv).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
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
          <button onClick={onOtkazi} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Otkaži</button>
          <button onClick={onSacuvaj} className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>Sačuvaj</button>
        </div>
      </div>
    </div>
  )
}

export default function Rezervacije({ syncedRez = [], apartmani = [] }) {
  const { user } = useAuth()
  const [rez, setRez] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('sve')
  const [pretraga, setPretraga] = useState('')
  const [modal, setModal] = useState(null)
  const [forma, setForma] = useState({ ...PRAZNA_FORMA, apartmanId: apartmani[0]?.id || '' })
  const [izmenaId, setIzmenaId] = useState(null)
  const [brisanje, setBrisanje] = useState(null)
  const [detalji, setDetalji] = useState(null)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('rezervacije').select('*').order('dolazak', { ascending: false })
    setRez((data || []).map(mapRezervacija))
    setLoading(false)
  }

  const sveRez = [...rez, ...syncedRez.filter(s => !rez.some(r => r.id === s.id))]
  const filtrirane = sveRez.filter(r => {
    const matchFilter = filter === 'sve' || r.status === filter
    const matchSearch = r.gost.toLowerCase().includes(pretraga.toLowerCase()) ||
      apartmani.find(a => a.id === r.apartmanId)?.naziv.toLowerCase().includes(pretraga.toLowerCase())
    return matchFilter && matchSearch
  })

  function otvoriNovu() {
    setForma({ ...PRAZNA_FORMA, apartmanId: apartmani[0]?.id || '' })
    setModal('nova')
  }

  function otvoriIzmenu(r, e) {
    e.stopPropagation()
    setForma({ gost: r.gost, apartmanId: r.apartmanId, dolazak: r.dolazak, odlazak: r.odlazak, izvor: r.izvor, napomena: r.napomena || '', kontakt: r.kontakt || '', status: r.status, brGostiju: r.brGostiju || 2 })
    setIzmenaId(r.id)
    setModal('izmena')
  }

  async function nadjiIliKreirajGosta(ime, kontakt) {
    // Pokušaj da pronađeš gosta po imenu (case-insensitive)
    const { data: postojeci } = await supabase
      .from('gosti')
      .select('id, br_boravaka')
      .eq('user_id', user.id)
      .ilike('ime', ime.trim())
      .single()

    if (postojeci) {
      // Gost postoji — povećaj broj boravaka
      await supabase.from('gosti').update({ br_boravaka: (postojeci.br_boravaka || 0) + 1 }).eq('id', postojeci.id)
      return postojeci.id
    }

    // Gost ne postoji — kreiraj novog
    const { data: novi, error } = await supabase
      .from('gosti')
      .insert([{ user_id: user.id, ime: ime.trim(), telefon: kontakt || '', br_boravaka: 1 }])
      .select('id')
      .single()
    if (error) console.error('Greška pri kreiranju gosta:', error.message)
    return novi?.id || null
  }

  async function sacuvaj() {
    if (!forma.gost || !forma.dolazak || !forma.odlazak) return
    const apt = apartmani.find(a => a.id === Number(forma.apartmanId))
    const nights = Math.max(1, Math.round((new Date(forma.odlazak) - new Date(forma.dolazak)) / 86400000))
    const cena = nights * (apt?.cenaPoNoci || 0)
    const payload = {
      gost: forma.gost, apartman_id: Number(forma.apartmanId), dolazak: forma.dolazak,
      odlazak: forma.odlazak, cena, status: forma.status, izvor: forma.izvor,
      kontakt: forma.kontakt, napomena: forma.napomena, br_gostiju: forma.brGostiju,
    }
    if (modal === 'nova') {
      const gostId = await nadjiIliKreirajGosta(forma.gost, forma.kontakt)
      await supabase.from('rezervacije').insert([{ ...payload, user_id: user.id, gost_id: gostId }])
      const apt = apartmani.find(a => a.id === Number(forma.apartmanId))
      await logActivity(user.id, 'rezervacija',
        `Nova rezervacija — ${forma.gost}`,
        { izvor: forma.izvor, apt_naziv: apt?.naziv, dolazak: forma.dolazak }
      )
    } else {
      await supabase.from('rezervacije').update(payload).eq('id', izmenaId)
    }
    await load()
    setModal(null)
  }

  async function obrisi(id) {
    await supabase.from('rezervacije').delete().eq('id', id)
    setRez(rez.filter(r => r.id !== id))
    setBrisanje(null)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTERI.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
              style={filter === f ? { backgroundColor: '#01696f' } : {}}>
              {filterNaziv[f]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={pretraga} onChange={e => setPretraga(e.target.value)} placeholder="Pretraži..."
              className="w-full sm:w-48 pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500 dark:text-white transition-colors" />
          </div>
          <button onClick={otvoriNovu}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{ backgroundColor: '#01696f' }}>
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
                  <tr key={r.id} onClick={() => setDetalji(r)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{r.gost}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (apt?.boja || '#94a3b8') + '20' }}>
                          <Home size={12} style={{ color: apt?.boja || '#94a3b8' }} />
                        </div>
                        <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{apt?.naziv || '—'}</span>
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
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.kontakt && (
                          <>
                            <a href={waUrl(r.kontakt)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-green-500 transition-colors" title="WhatsApp"><MessageCircle size={14} /></a>
                            <a href={viberUrl(r.kontakt)} onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-purple-500 transition-colors" title="Viber"><PhoneCall size={14} /></a>
                            <a href={`tel:${r.kontakt}`} onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-blue-500 transition-colors" title="Pozovi"><Phone size={14} /></a>
                          </>
                        )}
                        <button onClick={e => otvoriIzmenu(r, e)} className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"><Pencil size={14} /></button>
                        <button onClick={e => { e.stopPropagation(); setBrisanje(r) }} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtrirane.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">Nema rezervacija</p>}
        </div>
      </div>

      {modal && <RezModal forma={forma} setForma={setForma} onSacuvaj={sacuvaj} onOtkazi={() => setModal(null)} naslov={modal === 'nova' ? 'Nova rezervacija' : 'Izmeni rezervaciju'} apartmani={apartmani} />}

      {detalji && (() => {
        const apt = apartmani.find(a => a.id === detalji.apartmanId)
        const tel = detalji.kontakt
        const poruke = [
          { label: 'Check-in info', ikona: ChevronRight, boja: 'teal', tekst: templateCheckin(detalji, apt) },
          { label: 'WiFi šifra', ikona: Wifi, boja: 'blue', tekst: templateWifi(detalji, apt) },
          { label: 'Checkout reminder', ikona: LogOut, boja: 'amber', tekst: templateCheckout(detalji, apt) },
        ]
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDetalji(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{detalji.gost}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{apt?.naziv} · {detalji.dolazak} → {detalji.odlazak}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { otvoriIzmenu(detalji, e); setDetalji(null) }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => setDetalji(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"><X size={15} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusBoje[detalji.status]}`}>{statusNaziv[detalji.status]}</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">€{detalji.cena}</span>
                  <span className="text-xs text-slate-400">{detalji.brGostiju} gosta</span>
                </div>
              </div>

              {tel ? (
                <div className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Pošalji poruku</p>
                  {poruke.map(p => {
                    const boje = {
                      teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
                      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
                      amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
                    }
                    return (
                      <div key={p.label} className={`rounded-xl border p-3 ${boje[p.boja]}`}>
                        <p className="text-xs font-semibold mb-2">{p.label}</p>
                        <div className="flex gap-2">
                          <a href={waUrlTekst(tel, p.tekst)} target="_blank" rel="noreferrer"
                            onClick={() => logActivity(user.id, 'poruka', `${p.label} poslat — ${detalji.gost}`, { gost: detalji.gost, tip: p.label })}
                            className="flex-1 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-current/20 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity">
                            <MessageCircle size={13} /> WhatsApp
                          </a>
                          <a href={viberUrl(tel)}
                            onClick={() => logActivity(user.id, 'poruka', `${p.label} poslat (Viber) — ${detalji.gost}`, { gost: detalji.gost, tip: p.label })}
                            className="flex-1 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-current/20 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity">
                            <PhoneCall size={13} /> Viber
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-5 text-center">
                  <p className="text-sm text-slate-400">Dodaj kontakt broj da bi slao poruke</p>
                  <button onClick={e => { otvoriIzmenu(detalji, e); setDetalji(null) }}
                    className="mt-3 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90"
                    style={{ backgroundColor: '#01696f' }}>
                    Dodaj kontakt
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {brisanje && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBrisanje(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Obriši rezervaciju?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              <span className="font-medium text-slate-700 dark:text-slate-200">{brisanje.gost}</span> · {brisanje.dolazak} → {brisanje.odlazak}
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
