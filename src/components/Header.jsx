import React, { useState, useEffect } from 'react'
import {
  Sun, Moon, X, Home, Mail, Phone, Save, Globe,
  RefreshCw, Link, CheckCircle, AlertCircle, Loader,
  LogOut, Plus, Trash2, User, Shield,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const JEZICI = ['Srpski', 'English', 'Deutsch']
const VALUTE = ['EUR (€)', 'RSD (din)', 'USD ($)']
const BOJE = ['#01696f', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#ec4899']

const nazivStrane = {
  dashboard: 'Pregled', kalendar: 'Kalendar', rezervacije: 'Rezervacije',
  gosti: 'Gosti', cistacije: 'Čistačice Hub', finansije: 'Finansije',
}

function roleBadge(role) {
  if (role === 'cistacica') return { label: 'Čistačica', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
  if (role === 'kooperant') return { label: 'Kooperant', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
  return { label: 'Vlasnik', cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' }
}

function initials(ime) {
  if (!ime) return '?'
  return ime.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const PRAZNA_APT = { naziv: '', lokacija: '', kapacitet: 2, cenaPoNoci: 50, boja: '#01696f' }
const PRAZNA_CLAN = { email: '', role: 'cistacica' }

export default function Header({ aktivnaStrana, tamniRezim, setTamniRezim, icalSync, apartmani, onApartmaniChange }) {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [otvorenoProf, setOtvorenoProf] = useState(false)
  const [aktivniTab, setAktivniTab] = useState('profil')
  const [editForma, setEditForma] = useState({ ime: '', telefon: '' })
  const [sacuvano, setSacuvano] = useState(false)
  const [jezik, setJezik] = useState('Srpski')
  const [valuta, setValuta] = useState('EUR (€)')
  const [showAptForma, setShowAptForma] = useState(false)
  const [aptForma, setAptForma] = useState(PRAZNA_APT)
  const [clanovi, setClanovi] = useState([])
  const [loadingClanovi, setLoadingClanovi] = useState(false)
  const [showClanForma, setShowClanForma] = useState(false)
  const [clanForma, setClanForma] = useState(PRAZNA_CLAN)

  const { getUrl, setUrl, sync, syncing, lastSync, syncError, syncedRez } = icalSync || {}
  const role = profile?.role || 'vlasnik'
  const isVlasnik = role === 'vlasnik'

  const tabovi = [
    { id: 'profil', naziv: 'Profil' },
    ...(isVlasnik ? [
      { id: 'apartmani', naziv: 'Apartmani' },
      { id: 'korisnici', naziv: 'Korisnici' },
      { id: 'ical', naziv: 'iCal' },
    ] : []),
    { id: 'podesavanja', naziv: 'Podešavanja' },
  ]

  useEffect(() => {
    if (profile) setEditForma({ ime: profile.ime || '', telefon: profile.telefon || '' })
  }, [profile])

  useEffect(() => {
    if (otvorenoProf && aktivniTab === 'korisnici' && isVlasnik) loadClanovi()
  }, [otvorenoProf, aktivniTab])

  async function loadClanovi() {
    setLoadingClanovi(true)
    const { data } = await supabase.from('team_members').select('*').eq('vlasnik_id', user.id).order('created_at')
    setClanovi(data || [])
    setLoadingClanovi(false)
  }

  async function sacuvajProfil() {
    const { error } = await updateProfile({ ime: editForma.ime, telefon: editForma.telefon })
    if (!error) { setSacuvano(true); setTimeout(() => setSacuvano(false), 2000) }
  }

  async function dodajApartman() {
    if (!aptForma.naziv) return
    await supabase.from('apartmani').insert([{
      user_id: user.id,
      naziv: aptForma.naziv,
      lokacija: aptForma.lokacija,
      kapacitet: Number(aptForma.kapacitet),
      cena_po_noci: Number(aptForma.cenaPoNoci),
      boja: aptForma.boja,
    }])
    await onApartmaniChange?.()
    setAptForma(PRAZNA_APT)
    setShowAptForma(false)
  }

  async function obrisiApartman(id, e) {
    e.stopPropagation()
    await supabase.from('apartmani').delete().eq('id', id)
    await onApartmaniChange?.()
  }

  async function dodajClana() {
    if (!clanForma.email) return
    await supabase.from('team_members').insert([{
      vlasnik_id: user.id,
      email: clanForma.email.toLowerCase().trim(),
      role: clanForma.role,
    }])
    setClanForma(PRAZNA_CLAN)
    setShowClanForma(false)
    await loadClanovi()
  }

  async function obrisiClana(id) {
    await supabase.from('team_members').delete().eq('id', id)
    await loadClanovi()
  }

  function formatLastSync(ts) {
    if (!ts) return null
    return new Date(ts).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
  }

  const badge = roleBadge(role)

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0 transition-colors">
      <div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">{nazivStrane[aktivnaStrana]}</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 hidden md:block capitalize">
          {new Date().toLocaleDateString('sr-RS', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setTamniRezim(!tamniRezim)}
          className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          {tamniRezim ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {syncing && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2.5 py-1.5 rounded-lg">
            <Loader size={12} className="animate-spin" /> Sinhronizujem...
          </div>
        )}
        {!syncing && syncedRez?.length > 0 && lastSync && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded-lg">
            <CheckCircle size={12} /> {syncedRez.length} uvezeno · {formatLastSync(lastSync)}
          </div>
        )}

        <div className="relative">
          <button onClick={() => setOtvorenoProf(!otvorenoProf)}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-transparent hover:ring-teal-500 transition-all"
            style={{ backgroundColor: '#01696f' }}>
            <span className="text-white text-xs font-bold">{initials(profile?.ime)}</span>
          </button>

          {otvorenoProf && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOtvorenoProf(false)} />
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-slide-up overflow-hidden" style={{ width: '340px' }}>

                <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: '#01696f' }}>
                      {initials(profile?.ime)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white truncate">{profile?.ime || 'Korisnik'}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
                  {tabovi.map(t => (
                    <button key={t.id} onClick={() => setAktivniTab(t.id)}
                      className={`flex-shrink-0 px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${aktivniTab === t.id ? 'border-b-2 text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      style={aktivniTab === t.id ? { borderBottomColor: '#01696f' } : {}}>
                      {t.naziv}
                    </button>
                  ))}
                </div>

                <div className="p-4 max-h-96 overflow-y-auto">

                  {aktivniTab === 'profil' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Ime i prezime</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={editForma.ime} onChange={e => setEditForma({ ...editForma, ime: e.target.value })}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={user?.email || ''} readOnly
                            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Telefon</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={editForma.telefon} onChange={e => setEditForma({ ...editForma, telefon: e.target.value })}
                            placeholder="+381 ..."
                            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                        </div>
                      </div>
                      <button onClick={sacuvajProfil} className="w-full py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 transition-all"
                        style={{ backgroundColor: sacuvano ? '#10b981' : '#01696f' }}>
                        <Save size={14} /> {sacuvano ? 'Sačuvano!' : 'Sačuvaj'}
                      </button>
                      <button onClick={signOut} className="w-full py-2 text-sm font-medium text-red-500 border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 transition-colors">
                        <LogOut size={14} /> Odjavi se
                      </button>
                    </div>
                  )}

                  {aktivniTab === 'apartmani' && (
                    <div className="space-y-2">
                      {apartmani.map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 group">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.boja + '20' }}>
                            <Home size={15} style={{ color: a.boja }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{a.naziv}</p>
                            <p className="text-xs text-slate-400 truncate">{a.lokacija} · {a.kapacitet} osoba</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">€{a.cenaPoNoci}/noć</p>
                            <button onClick={e => obrisiApartman(a.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {showAptForma ? (
                        <div className="border border-teal-200 dark:border-teal-800 rounded-xl p-3 space-y-2.5 bg-teal-50/30 dark:bg-teal-900/10">
                          {[
                            { label: 'Naziv', key: 'naziv', placeholder: 'Apartman Beograd' },
                            { label: 'Lokacija', key: 'lokacija', placeholder: 'Beograd, Srbija' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">{f.label}</label>
                              <input value={aptForma[f.key]} onChange={e => setAptForma({ ...aptForma, [f.key]: e.target.value })}
                                placeholder={f.placeholder}
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white" />
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">Kapacitet</label>
                              <input type="number" min={1} value={aptForma.kapacitet} onChange={e => setAptForma({ ...aptForma, kapacitet: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white" />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">Cena/noć (€)</label>
                              <input type="number" min={1} value={aptForma.cenaPoNoci} onChange={e => setAptForma({ ...aptForma, cenaPoNoci: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">Boja</label>
                            <div className="flex gap-1.5 flex-wrap">
                              {BOJE.map(b => (
                                <button key={b} onClick={() => setAptForma({ ...aptForma, boja: b })}
                                  className="w-6 h-6 rounded-full transition-all"
                                  style={{ backgroundColor: b, outline: aptForma.boja === b ? `2px solid ${b}` : 'none', outlineOffset: '2px' }} />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowAptForma(false)}
                              className="flex-1 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                              Otkaži
                            </button>
                            <button onClick={dodajApartman}
                              className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: '#01696f' }}>
                              Dodaj
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowAptForma(true)}
                          className="w-full py-2 text-sm font-medium text-teal-600 dark:text-teal-400 border border-dashed border-teal-300 dark:border-teal-700 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20 flex items-center justify-center gap-2 transition-colors">
                          <Plus size={14} /> Dodaj apartman
                        </button>
                      )}
                    </div>
                  )}

                  {aktivniTab === 'korisnici' && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-3">
                        Dodaj čistačicu ili kooperanta. Kada se registruju s tom email adresom, automatski vide tvoje podatke.
                      </p>

                      {loadingClanovi ? (
                        <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        clanovi.map(c => (
                          <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-200 dark:bg-slate-600">
                              <User size={14} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{c.email}</p>
                              <span className={`text-[10px] font-semibold ${c.role === 'cistacica' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                {c.role === 'cistacica' ? 'Čistačica' : 'Kooperant'}
                              </span>
                            </div>
                            <button onClick={() => obrisiClana(c.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}

                      {clanovi.length === 0 && !loadingClanovi && !showClanForma && (
                        <p className="text-xs text-slate-400 text-center py-2">Nema članova tima</p>
                      )}

                      {showClanForma ? (
                        <div className="border border-teal-200 dark:border-teal-800 rounded-xl p-3 space-y-2.5 bg-teal-50/30 dark:bg-teal-900/10">
                          <div>
                            <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">Email adresa</label>
                            <input value={clanForma.email} onChange={e => setClanForma({ ...clanForma, email: e.target.value })}
                              placeholder="email@primer.com" type="email"
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white" />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">Uloga</label>
                            <select value={clanForma.role} onChange={e => setClanForma({ ...clanForma, role: e.target.value })}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                              <option value="cistacica">Čistačica — vidi zadatke čišćenja</option>
                              <option value="kooperant">Kooperant — vidi kalendar i rezervacije</option>
                            </select>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowClanForma(false)}
                              className="flex-1 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                              Otkaži
                            </button>
                            <button onClick={dodajClana}
                              className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: '#01696f' }}>
                              Dodaj
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowClanForma(true)}
                          className="w-full py-2 text-sm font-medium text-teal-600 dark:text-teal-400 border border-dashed border-teal-300 dark:border-teal-700 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20 flex items-center justify-center gap-2 transition-colors">
                          <Plus size={14} /> Dodaj člana tima
                        </button>
                      )}
                    </div>
                  )}

                  {aktivniTab === 'ical' && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                        Nalepi iCal URL iz podešavanja svakog apartmana na Booking.com i Airbnb.
                      </p>
                      {apartmani.length === 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs text-slate-400 text-center">
                          Najpre dodaj apartman u tabu <strong className="text-teal-600 dark:text-teal-400">Apartmani</strong>, pa će se ovde pojaviti polja za iCal URL.
                        </div>
                      )}
                      {syncError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {syncError}
                        </div>
                      )}
                      {apartmani.map(a => (
                        <div key={a.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.boja + '20' }}>
                              <Home size={11} style={{ color: a.boja }} />
                            </div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{a.naziv}</p>
                          </div>
                          {['booking', 'airbnb'].map(platform => (
                            <div key={platform}>
                              <label className="text-[10px] font-medium text-slate-400 mb-1 block uppercase tracking-wide">
                                {platform === 'booking' ? 'Booking.com iCal URL' : 'Airbnb iCal URL'}
                              </label>
                              <div className="relative">
                                <Link size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={getUrl?.(a.id, platform) || ''} onChange={e => setUrl?.(a.id, platform, e.target.value)}
                                  placeholder={`https://${platform === 'booking' ? 'admin.booking.com' : 'www.airbnb.com'}/...ical...`}
                                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white font-mono transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div className="pt-1 space-y-2">
                        <button onClick={sync} disabled={syncing}
                          className="w-full py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                          style={{ backgroundColor: '#01696f' }}>
                          {syncing ? <><Loader size={14} className="animate-spin" /> Sinhronizujem...</> : <><RefreshCw size={14} /> Sinhronizuj sada</>}
                        </button>
                        {lastSync && !syncing && (
                          <p className="text-center text-[10px] text-slate-400">
                            Poslednja: {formatLastSync(lastSync)} · {syncedRez?.length || 0} uvezeno
                          </p>
                        )}
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        <strong>Napomena:</strong> Booking.com i Airbnb ne otkrivaju ime gosta iz razloga privatnosti.
                      </div>
                    </div>
                  )}

                  {aktivniTab === 'podesavanja' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Jezik</label>
                        <select value={jezik} onChange={e => setJezik(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                          {JEZICI.map(j => <option key={j}>{j}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Valuta</label>
                        <select value={valuta} onChange={e => setValuta(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                          {VALUTE.map(v => <option key={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Tamni režim</p>
                          <p className="text-xs text-slate-400">Promeni izgled aplikacije</p>
                        </div>
                        <button onClick={() => setTamniRezim(!tamniRezim)}
                          className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${tamniRezim ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tamniRezim ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
