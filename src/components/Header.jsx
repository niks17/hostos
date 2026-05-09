import React, { useState } from 'react'
import {
  Bell, Sun, Moon, X, Calendar, CheckSquare, Star,
  User, Home, Mail, Phone, Save, Globe,
  RefreshCw, Link, CheckCircle, AlertCircle, Loader,
} from 'lucide-react'
import { notifikacije as initialNotif, apartmani } from '../data/mockData'

const nazivStrane = {
  dashboard: 'Pregled', kalendar: 'Kalendar', rezervacije: 'Rezervacije',
  gosti: 'Gosti', cistacije: 'Čistačice Hub', finansije: 'Finansije',
}

const tipIkona = { rezervacija: Star, checkout: Calendar, cistenje: CheckSquare }
const JEZICI = ['Srpski', 'English', 'Deutsch']
const VALUTE = ['EUR (€)', 'RSD (din)', 'USD ($)']
const TABOVI = [
  { id: 'profil', naziv: 'Profil' },
  { id: 'apartmani', naziv: 'Apartmani' },
  { id: 'ical', naziv: 'iCal Sync' },
  { id: 'podesavanja', naziv: 'Podešavanja' },
]

export default function Header({ aktivnaStrana, tamniRezim, setTamniRezim, icalSync }) {
  const [notif, setNotif] = useState(initialNotif)
  const [otvorenoNotif, setOtvorenoNotif] = useState(false)
  const [otvorenoProf, setOtvorenoProf] = useState(false)
  const [aktivniTab, setAktivniTab] = useState('profil')
  const [profil, setProfil] = useState({ ime: 'Moj Smeštaj', email: 'vlasnik@gmail.com', telefon: '+381 60 123 4567', jezik: 'Srpski', valuta: 'EUR (€)' })
  const [sacuvano, setSacuvano] = useState(false)

  const { getUrl, setUrl, sync, syncing, lastSync, syncError, syncedRez } = icalSync || {}

  const neprocitane = notif.filter(n => !n.procitano).length

  function sacuvajProfil() {
    setSacuvano(true)
    setTimeout(() => setSacuvano(false), 2000)
  }

  function oznаciSve() {
    setNotif(notif.map(n => ({ ...n, procitano: true })))
  }

  function formatLastSync(ts) {
    if (!ts) return null
    const d = new Date(ts)
    return d.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0 transition-colors">
      <div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">{nazivStrane[aktivnaStrana]}</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 hidden md:block capitalize">
          {new Date().toLocaleDateString('sr-RS', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode (mobile only) */}
        <button
          onClick={() => setTamniRezim(!tamniRezim)}
          className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {tamniRezim ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Sync status indicator */}
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

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setOtvorenoNotif(!otvorenoNotif); setOtvorenoProf(false) }}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Bell size={20} />
            {neprocitane > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />}
          </button>

          {otvorenoNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOtvorenoNotif(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-slide-up overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="font-semibold text-slate-800 dark:text-white text-sm">Obaveštenja</span>
                  {neprocitane > 0 && (
                    <button onClick={oznаciSve} className="text-xs text-teal-600 dark:text-teal-400 hover:underline">Označi sve</button>
                  )}
                </div>
                {notif.length === 0 ? (
                  <p className="text-center text-slate-400 py-6 text-sm">Nema obaveštenja</p>
                ) : notif.map(n => {
                  const Ikona = tipIkona[n.tip] || Bell
                  return (
                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!n.procitano ? 'bg-teal-50/60 dark:bg-teal-900/10' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.procitano ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                        <Ikona size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.procitano ? 'font-medium text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{n.tekst}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Pre {n.vreme}</p>
                      </div>
                      <button onClick={() => setNotif(notif.filter(x => x.id !== n.id))} className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 flex-shrink-0 mt-0.5">
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setOtvorenoProf(!otvorenoProf); setOtvorenoNotif(false) }}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-transparent hover:ring-teal-500 transition-all"
            style={{ backgroundColor: '#01696f' }}
          >
            <span className="text-white text-xs font-bold">MS</span>
          </button>

          {otvorenoProf && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOtvorenoProf(false)} />
              <div className="absolute right-0 top-full mt-2 w-84 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-slide-up overflow-hidden" style={{ width: '340px' }}>

                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: '#01696f' }}>MS</div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{profil.ime}</p>
                      <p className="text-xs text-slate-400">{profil.email}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
                  {TABOVI.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setAktivniTab(t.id)}
                      className={`flex-shrink-0 px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${aktivniTab === t.id ? 'border-b-2 text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      style={aktivniTab === t.id ? { borderBottomColor: '#01696f' } : {}}
                    >
                      {t.naziv}
                    </button>
                  ))}
                </div>

                <div className="p-4 max-h-96 overflow-y-auto">

                  {/* PROFIL */}
                  {aktivniTab === 'profil' && (
                    <div className="space-y-3">
                      {[
                        { label: 'Ime', key: 'ime', ikona: User },
                        { label: 'Email', key: 'email', ikona: Mail },
                        { label: 'Telefon', key: 'telefon', ikona: Phone },
                      ].map(f => {
                        const Ik = f.ikona
                        return (
                          <div key={f.key}>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">{f.label}</label>
                            <div className="relative">
                              <Ik size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input value={profil[f.key]} onChange={e => setProfil({...profil, [f.key]: e.target.value})}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white transition-colors" />
                            </div>
                          </div>
                        )
                      })}
                      <button onClick={sacuvajProfil} className="w-full py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 transition-all"
                        style={{ backgroundColor: sacuvano ? '#10b981' : '#01696f' }}>
                        <Save size={14} /> {sacuvano ? 'Sačuvano!' : 'Sačuvaj'}
                      </button>
                    </div>
                  )}

                  {/* APARTMANI */}
                  {aktivniTab === 'apartmani' && (
                    <div className="space-y-2">
                      {apartmani.map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.boja + '20' }}>
                            <Home size={15} style={{ color: a.boja }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{a.naziv}</p>
                            <p className="text-xs text-slate-400 truncate">{a.lokacija} · {a.kapacitet} osobe</p>
                          </div>
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">€{a.cenaPoNoci}/noć</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ICAL SYNC */}
                  {aktivniTab === 'ical' && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                        Nalepi iCal URL iz podešavanja svakog apartmana na Booking.com i Airbnb. App će automatski uvoziti rezervacije svakog sata.
                      </p>

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
                                <input
                                  value={getUrl?.(a.id, platform) || ''}
                                  onChange={e => setUrl?.(a.id, platform, e.target.value)}
                                  placeholder={`https://${platform === 'booking' ? 'admin.booking.com' : 'www.airbnb.com'}/...ical...`}
                                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white font-mono transition-colors"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}

                      <div className="pt-1 space-y-2">
                        <button
                          onClick={sync}
                          disabled={syncing}
                          className="w-full py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                          style={{ backgroundColor: '#01696f' }}
                        >
                          {syncing
                            ? <><Loader size={14} className="animate-spin" /> Sinhronizujem...</>
                            : <><RefreshCw size={14} /> Sinhronizuj sada</>
                          }
                        </button>
                        {lastSync && !syncing && (
                          <p className="text-center text-[10px] text-slate-400">
                            Poslednja sinhronizacija: {formatLastSync(lastSync)} · {syncedRez?.length || 0} rezervacija uvezeno
                          </p>
                        )}
                      </div>

                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        <strong>Napomena:</strong> Booking.com i Airbnb ne otkrivaju ime gosta u iCal feedu iz razloga privatnosti. Uvezene rezervacije prikazuju datum dolaska/odlaska i izvor.
                      </div>
                    </div>
                  )}

                  {/* PODEŠAVANJA */}
                  {aktivniTab === 'podesavanja' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Jezik</label>
                        <select value={profil.jezik} onChange={e => setProfil({...profil, jezik: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                          {JEZICI.map(j => <option key={j}>{j}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Valuta</label>
                        <select value={profil.valuta} onChange={e => setProfil({...profil, valuta: e.target.value})}
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
                      <button onClick={sacuvajProfil} className="w-full py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 transition-all"
                        style={{ backgroundColor: sacuvano ? '#10b981' : '#01696f' }}>
                        <Save size={14} /> {sacuvano ? 'Sačuvano!' : 'Sačuvaj podešavanja'}
                      </button>
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
