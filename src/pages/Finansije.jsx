import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Euro, Receipt, Plus, X, Trash2,
  FileText, CheckCircle2, Circle, Settings, Loader2, CalendarCheck
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { supabase, mapTransakcija, mapRezervacija } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { haptic } from '../utils/haptics'
import { generateReport } from '../utils/generateReport'

const KATEGORIJE = ['Čišćenje', 'Komunalije', 'Popravka', 'Provizija', 'Boravišna taksa', 'Ostalo']
const MESECI_NAZIVI = ['Januar','Februar','Mart','April','Maj','Jun','Jul','Avgust','Septembar','Oktobar','Novembar','Decembar']

function noći(dolazak, odlazak) {
  return Math.max(1, Math.round((new Date(odlazak) - new Date(dolazak)) / 86400000))
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: €{p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ── Boravišna Taksa Tab ────────────────────────────────────────────────────────
// SQL za Supabase (pokreni jednom u SQL editoru):
//
// CREATE TABLE IF NOT EXISTS taksa_status (
//   id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id       uuid REFERENCES auth.users NOT NULL,
//   mesec_godina  text NOT NULL,       -- format: "2026-05"
//   placeno       boolean DEFAULT false,
//   placeno_datum timestamptz,
//   UNIQUE(user_id, mesec_godina)
// );
// ALTER TABLE taksa_status ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Korisnik upravlja sopstvenim statusima"
//   ON taksa_status FOR ALL USING (auth.uid() = user_id);

function BtTab({ rezervacije, apartmani, userId }) {
  // stopa: korisnicko podesavanje, cuvamo u localStorage jer je to preference
  // (nije finansijski zapis — samo mnozilac za kalkulaciju)
  const [stopa,      setStopa]      = useState(() => {
    try { return Number(localStorage.getItem(`hostos_taksa_stopa_${userId}`) || 150) }
    catch { return 150 }
  })
  const [editStopa,  setEditStopa]  = useState(false)

  // placeni: mapa { "2026-05": { placeno: true, datum: "2026-05-30T..." } }
  // Ucitava se iz Supabase taksa_status tabele
  const [placeni,    setPlaceni]    = useState({})
  const [loadingBT,  setLoadingBT]  = useState(true)
  const [toggling,   setToggling]   = useState({}) // { "2026-05": true } dok se UPSERT izvrsava

  // ── Ucitaj statuse iz baze ──────────────────────────────────────────────────
  const loadStatuse = useCallback(async () => {
    if (!userId) return
    setLoadingBT(true)
    const { data, error } = await supabase
      .from('taksa_status')
      .select('mesec_godina, placeno, placeno_datum')
      .eq('user_id', userId)

    if (!error && data) {
      const mapa = {}
      for (const row of data) {
        mapa[row.mesec_godina] = {
          placeno: row.placeno,
          datum:   row.placeno_datum,
        }
      }
      setPlaceni(mapa)
    }
    setLoadingBT(false)
  }, [userId])

  useEffect(() => { loadStatuse() }, [loadStatuse])

  // ── Sacuvaj stopu u localStorage ────────────────────────────────────────────
  function promeniStopu(novaStopa) {
    setStopa(novaStopa)
    try { localStorage.setItem(`hostos_taksa_stopa_${userId}`, String(novaStopa)) } catch {}
  }

  // ── Toggle placeno/neplaceno — UPSERT u bazu ────────────────────────────────
  async function togglePlaceno(mesecKljuc) {
    const trenutnoPlaceno = placeni[mesecKljuc]?.placeno || false
    const novoDatum        = !trenutnoPlaceno ? new Date().toISOString() : null

    haptic.tap()

    // Optimisticki update — UI odmah reaguje
    setPlaceni(prev => ({
      ...prev,
      [mesecKljuc]: { placeno: !trenutnoPlaceno, datum: novoDatum },
    }))
    setToggling(prev => ({ ...prev, [mesecKljuc]: true }))

    const { error } = await supabase
      .from('taksa_status')
      .upsert(
        {
          user_id:      userId,
          mesec_godina: mesecKljuc,
          placeno:      !trenutnoPlaceno,
          placeno_datum: novoDatum,
        },
        { onConflict: 'user_id,mesec_godina' }
      )

    if (error) {
      // Rollback ako je UPSERT zakazao
      console.error('taksa_status upsert greška:', error)
      setPlaceni(prev => ({
        ...prev,
        [mesecKljuc]: { placeno: trenutnoPlaceno, datum: placeni[mesecKljuc]?.datum || null },
      }))
    }

    setToggling(prev => ({ ...prev, [mesecKljuc]: false }))
  }

  // ── Kalkulacije ─────────────────────────────────────────────────────────────
  const aktivne    = rezervacije.filter(r => r.status !== 'otkazano')
  const poMesecima = aktivne.reduce((acc, r) => {
    const kljuc = r.dolazak.slice(0, 7)
    if (!acc[kljuc]) acc[kljuc] = []
    acc[kljuc].push(r)
    return acc
  }, {})
  const meseci = Object.keys(poMesecima).sort().reverse()

  const taksaZaMesec = (m) =>
    poMesecima[m].reduce((s, r) => s + noći(r.dolazak, r.odlazak) * (r.brGostiju || 1) * stopa, 0)

  const ukupnoUplaceno  = meseci.filter(m =>  placeni[m]?.placeno).reduce((s, m) => s + taksaZaMesec(m), 0)
  const ukupnoZaUplatu  = meseci.filter(m => !placeni[m]?.placeno).reduce((s, m) => s + taksaZaMesec(m), 0)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Stat kartice */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Za uplatu</p>
          <p className="text-xl font-bold text-red-500">{ukupnoZaUplatu.toLocaleString()} RSD</p>
          <p className="text-[10px] text-slate-400 mt-1">{meseci.filter(m => !placeni[m]?.placeno).length} meseci</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Uplaćeno</p>
          <p className="text-xl font-bold text-emerald-500">{ukupnoUplaceno.toLocaleString()} RSD</p>
          <p className="text-[10px] text-slate-400 mt-1">{meseci.filter(m => placeni[m]?.placeno).length} meseci</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-400 mb-1">Stopa po osobi/noći</p>
          {editStopa ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={stopa}
                onChange={e => promeniStopu(Number(e.target.value))}
                className="w-24 px-2 py-1 text-sm border border-teal-400 rounded-lg outline-none bg-transparent dark:text-white"
                autoFocus
              />
              <span className="text-xs text-slate-400">RSD</span>
              <button onClick={() => setEditStopa(false)} className="text-xs font-semibold" style={{ color: '#01696f' }}>OK</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-slate-800 dark:text-white">{stopa} RSD</p>
              <button onClick={() => setEditStopa(true)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Settings size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading stanje */}
      {loadingBT && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Učitavam statuse...
        </div>
      )}

      {/* Nema rezervacija */}
      {!loadingBT && meseci.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700">
          <p className="text-slate-400 text-sm">Nema rezervacija za prikaz.</p>
        </div>
      )}

      {/* Meseci */}
      {!loadingBT && meseci.map(m => {
        const rezMesec  = poMesecima[m]
        const ukupno    = taksaZaMesec(m)
        const [god, mes] = m.split('-')
        const jeplacen  = placeni[m]?.placeno || false
        const placenDatum = placeni[m]?.datum
        const ucitava   = toggling[m]

        return (
          <div
            key={m}
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border transition-all duration-200 ${
              jeplacen
                ? 'border-emerald-200 dark:border-emerald-800'
                : 'border-slate-100 dark:border-slate-700'
            }`}
          >
            {/* Header reda */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {MESECI_NAZIVI[Number(mes) - 1]} {god}
                </p>
                <p className="text-xs text-slate-400">
                  {rezMesec.length} rezervacija · {rezMesec.reduce((s, r) => s + noći(r.dolazak, r.odlazak) * (r.brGostiju || 1), 0)} osobonoći
                </p>
                {/* Datum kada je oznaceno placenim */}
                {jeplacen && placenDatum && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <CalendarCheck size={10} className="text-emerald-500" />
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      Plaćeno {new Date(placenDatum).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <p className="font-bold text-slate-800 dark:text-white">
                  {ukupno.toLocaleString()} RSD
                </p>
                <button
                  onClick={() => togglePlaceno(m)}
                  disabled={ucitava}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 ${
                    jeplacen
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                >
                  {ucitava
                    ? <Loader2 size={13} className="animate-spin" />
                    : jeplacen
                      ? <CheckCircle2 size={13} />
                      : <Circle size={13} />
                  }
                  {ucitava ? 'Čuvam...' : jeplacen ? 'Plaćeno' : 'Označi plaćeno'}
                </button>
              </div>
            </div>

            {/* Stavke rezervacija */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {rezMesec.map(r => {
                const apt = apartmani.find(a => a.id === r.apartmanId)
                const n   = noći(r.dolazak, r.odlazak)
                const g   = r.brGostiju || 1
                return (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: apt?.boja || '#94a3b8' }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{r.gost}</p>
                      <p className="text-xs text-slate-400">{apt?.naziv} · {r.dolazak} → {r.odlazak}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400 whitespace-nowrap">
                      <p>{n} noći × {g} os. × {stopa}</p>
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap w-24 text-right">
                      {(n * g * stopa).toLocaleString()} RSD
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Finansije (main) ───────────────────────────────────────────────────────────
export default function Finansije({ apartmani = [] }) {
  const { user } = useAuth()
  const [tranz,       setTranz]       = useState([])
  const [rezervacije, setRezervacije] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [noviTrosak,  setNoviTrosak]  = useState(false)
  const [forma,       setForma]       = useState({ opis: '', iznos: '', kategorija: KATEGORIJE[0], apartmanId: '' })
  const [izvestaj,    setIzvestaj]    = useState(false)
  const [repForma,    setRepForma]    = useState({ mesec: new Date().getMonth().toString(), godina: '2026' })
  const [tab,         setTab]         = useState('transakcije')

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const [{ data: t }, { data: r }] = await Promise.all([
      supabase.from('transakcije').select('*').order('datum', { ascending: false }),
      supabase.from('rezervacije').select('*'),
    ])
    setTranz((t || []).map(mapTransakcija))
    setRezervacije((r || []).map(mapRezervacija))
    setLoading(false)
  }

  const prihod   = tranz.filter(t => t.tip === 'prihod').reduce((s, t) => s + t.iznos, 0)
  const troskovi = tranz.filter(t => t.tip === 'trosak').reduce((s, t) => s + Math.abs(t.iznos), 0)
  const neto     = prihod - troskovi

  const mesecniPodaci = (() => {
    const map = {}
    tranz.forEach(t => {
      const m = t.datum?.slice(0, 7) || ''
      if (!map[m]) map[m] = { mesec: m.slice(5), prihod: 0, troskovi: 0 }
      if (t.tip === 'prihod') map[m].prihod += t.iznos
      else map[m].troskovi += Math.abs(t.iznos)
    })
    return Object.values(map).sort((a, b) => a.mesec.localeCompare(b.mesec)).slice(-6)
  })()

  async function dodajTrosak() {
    if (!forma.opis || !forma.iznos) return
    const payload = {
      user_id:     user.id,
      datum:       new Date().toISOString().split('T')[0],
      opis:        forma.opis,
      iznos:       -Math.abs(Number(forma.iznos)),
      tip:         'trosak',
      kategorija:  forma.kategorija,
      apartman_id: forma.apartmanId ? Number(forma.apartmanId) : null,
    }
    await supabase.from('transakcije').insert([payload])
    await load()
    setNoviTrosak(false)
    setForma({ opis: '', iznos: '', kategorija: KATEGORIJE[0], apartmanId: '' })
  }

  async function obrisi(id) {
    await supabase.from('transakcije').delete().eq('id', id)
    setTranz(tranz.filter(t => t.id !== id))
  }

  function generiši() {
    generateReport({ mesec: repForma.mesec, godina: repForma.godina, transakcije: tranz, apartmani, rezervacije })
    setIzvestaj(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

      {/* Tab switcher */}
      <div className="flex gap-2">
        {[['transakcije', 'Pregled'], ['boravisna', 'Boravišna taksa']].map(([k, v]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === k
                ? 'text-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
            style={tab === k ? { backgroundColor: '#01696f' } : {}}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Boravišna taksa tab — userId se prosledi da bi BtTab mogao da radi sa bazom */}
      {tab === 'boravisna' && (
        <BtTab rezervacije={rezervacije} apartmani={apartmani} userId={user?.id} />
      )}

      {tab === 'transakcije' && (
        <>
          {/* Stat kartice */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { naziv: 'Ukupan prihod',   iznos: prihod,   ikona: TrendingUp,  boja: '#01696f', valuta: '€' },
              { naziv: 'Troškovi',         iznos: troskovi, ikona: TrendingDown, boja: '#ef4444', valuta: '€' },
              { naziv: 'Neto zarada',      iznos: neto,     ikona: Euro,         boja: '#8b5cf6', valuta: '€' },
              {
                naziv: 'Boravišna taksa',
                iznos: tranz.filter(t => t.kategorija === 'Boravišna taksa').reduce((s, t) => s + Math.abs(t.iznos), 0),
                ikona: Receipt,
                boja: '#f59e0b',
                valuta: 'RSD',
              },
            ].map(k => {
              const Ik = k.ikona
              const formatIznos = k.valuta === 'RSD'
                ? `${k.iznos.toLocaleString()} RSD`
                : `€${k.iznos.toLocaleString()}`
              return (
                <div key={k.naziv} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: k.boja + '20' }}>
                    <Ik size={18} style={{ color: k.boja }} />
                  </div>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">{formatIznos}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{k.naziv}</p>
                </div>
              )
            })}
          </div>

          {/* Grafikon */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-white">Prihodi vs Troškovi</h2>
              <span className="text-xs text-slate-400">Poslednjih 6 meseci</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mesecniPodaci} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="mesec" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} tickFormatter={v => `€${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span style={{ fontSize: 12, color: '#94a3b8' }}>{v}</span>} />
                <Bar dataKey="prihod"   name="Prihod"   fill="#01696f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="troskovi" name="Troškovi" fill="#ef4444" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista transakcija */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white">Transakcije</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIzvestaj(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <FileText size={14} /> Izveštaj
                </button>
                <button
                  onClick={() => setNoviTrosak(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#01696f' }}
                >
                  <Plus size={14} /> Novi trošak
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {tranz.length === 0 && (
                <p className="text-center text-slate-400 py-10 text-sm">Nema transakcija</p>
              )}
              {tranz.map(t => {
                const pozitivno = t.tip === 'prihod'
                return (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${pozitivno ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      {pozitivno
                        ? <TrendingUp  size={15} className="text-emerald-600 dark:text-emerald-400" />
                        : <TrendingDown size={15} className="text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{t.opis}</p>
                      <p className="text-xs text-slate-400">{t.datum} · {t.kategorija}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold text-sm ${pozitivno ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {t.kategorija === 'Boravišna taksa'
                          ? `${pozitivno ? '+' : ''}${Math.abs(t.iznos).toLocaleString()} RSD`
                          : `${pozitivno ? '+' : ''}€${Math.abs(t.iznos)}`
                        }
                      </span>
                      <button
                        onClick={() => obrisi(t.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Modal: Izveštaj */}
          {izvestaj && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIzvestaj(false)}>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#01696f20' }}>
                      <FileText size={18} style={{ color: '#01696f' }} />
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">Generiši PDF izveštaj</h3>
                  </div>
                  <button onClick={() => setIzvestaj(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Period</label>
                    <select value={repForma.mesec} onChange={e => setRepForma({...repForma, mesec: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                      <option value="sve">Cela godina</option>
                      {MESECI_NAZIVI.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Godina</label>
                    <select value={repForma.godina} onChange={e => setRepForma({...repForma, godina: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                      {['2024','2025','2026','2027'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setIzvestaj(false)}
                    className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    Otkaži
                  </button>
                  <button onClick={generiši}
                    className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#01696f' }}>
                    <FileText size={14} /> Preuzmi PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Novi trošak */}
          {noviTrosak && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNoviTrosak(false)}>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-slate-800 dark:text-white">Novi trošak</h3>
                  <button onClick={() => setNoviTrosak(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Opis</label>
                    <input value={forma.opis} onChange={e => setForma({...forma, opis: e.target.value})}
                      placeholder="Npr. Popravka bojlera"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                      Iznos {forma.kategorija === 'Boravišna taksa' ? '(RSD)' : '(€)'}
                    </label>
                    <input type="number" inputMode="numeric" value={forma.iznos} onChange={e => setForma({...forma, iznos: e.target.value})}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Kategorija</label>
                    <select value={forma.kategorija} onChange={e => setForma({...forma, kategorija: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                      {KATEGORIJE.map(k => <option key={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Apartman (opciono)</label>
                    <select value={forma.apartmanId} onChange={e => setForma({...forma, apartmanId: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-white dark:bg-slate-800 dark:text-white">
                      <option value="">Svi apartmani</option>
                      {apartmani.map(a => <option key={a.id} value={a.id}>{a.naziv}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setNoviTrosak(false)}
                    className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    Otkaži
                  </button>
                  <button onClick={dodajTrosak}
                    className="flex-1 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#01696f' }}>
                    Dodaj
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
