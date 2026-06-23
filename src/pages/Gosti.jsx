import React, { useState, useEffect } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Search, Phone, Mail, Star, X, Plus, MapPin, Pencil, Trash2, MessageCircle, PhoneCall, ShieldCheck, ShieldAlert } from 'lucide-react'
import { supabase, mapGost, mapRezervacija, punoIme, eturistaKompletan } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const PRAZNA_FORMA = {
  ime: '', prezime: '', email: '', telefon: '', drzava: 'Srbija', napomena: '',
  // eTurista polja
  datum_rodjenja: '', pol: '', tip_dokumenta: 'Pasoš', broj_dokumenta: '',
}

const TIP_DOK_OPCIJE = ['Pasoš', 'Lična karta', 'JMBG']

function waUrl(tel) { return `https://wa.me/${tel.replace(/\D/g, '')}` }
function viberUrl(tel) { return `viber://chat?number=${encodeURIComponent(tel.replace(/[\s\-()]/g, ''))}` }

// ── Forma za kreiranje/izmenu gosta ───────────────────────────────────────────
function GostForma({ forma, setForma, onSacuvaj, onOtkazi, naslov }) {
  function field(label, key, placeholder, type = 'text') {
    return (
      <div key={key}>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">{label}</label>
        <input
          type={type}
          value={forma[key]}
          onChange={e => setForma({ ...forma, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white"
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onOtkazi}>
      <div
        className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
        </div>

        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h3 className="font-bold text-slate-800 dark:text-white">{naslov}</h3>
          <button onClick={onOtkazi} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Osnovno */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Osnovno</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Ime', 'ime', 'Marko')}
              {field('Prezime', 'prezime', 'Petrović')}
            </div>
            {field('Email', 'email', 'email@gmail.com', 'email')}
            {field('Telefon', 'telefon', '+381 ...')}
          </div>

          {/* eTurista */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">eTurista podaci</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                Potrebno za prijavu
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field('Datum rođenja', 'datum_rodjenja', '', 'date')}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Pol</label>
                <select
                  value={forma.pol}
                  onChange={e => setForma({ ...forma, pol: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white dark:bg-slate-800"
                >
                  <option value="">— izaberi —</option>
                  <option value="M">Muški</option>
                  <option value="Ž">Ženski</option>
                </select>
              </div>
            </div>

            {field('Državljanstvo', 'drzava', 'Srbija')}

            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Tip dokumenta</label>
              <select
                value={forma.tip_dokumenta}
                onChange={e => setForma({ ...forma, tip_dokumenta: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white dark:bg-slate-800"
              >
                {TIP_DOK_OPCIJE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {field('Broj dokumenta', 'broj_dokumenta', 'Broj pasoša / lične / JMBG')}
          </div>

          {/* Napomena */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Napomena</p>
            <textarea
              value={forma.napomena}
              onChange={e => setForma({ ...forma, napomena: e.target.value })}
              rows={2}
              placeholder="Posebni zahtevi, beleška..."
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-teal-500 bg-transparent dark:text-white resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onOtkazi}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Otkaži
            </button>
            <button
              onClick={onSacuvaj}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity bg-teal-600"
            >
              Sačuvaj
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Gosti() {
  const { user } = useAuth()
  const [gosti, setGosti] = useState([])
  const [rezervacije, setRezervacije] = useState([])
  const [loading, setLoading] = useState(true)
  const [pretraga, setPretraga] = useState('')
  const [izabrani, setIzabrani] = useState(null)
  const [modal, setModal] = useState(null)
  const [forma, setForma] = useState(PRAZNA_FORMA)
  const [izmenaId, setIzmenaId] = useState(null)
  const [brisanje, setBrisanje] = useState(null)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const [{ data: g }, { data: r }] = await Promise.all([
      supabase.from('gosti').select('*').order('created_at', { ascending: false }),
      supabase.from('rezervacije').select('*'),
    ])
    setGosti((g || []).map(mapGost))
    setRezervacije((r || []).map(mapRezervacija))
    setLoading(false)
  }

  const filtrirani = gosti.filter(g =>
    punoIme(g).toLowerCase().includes(pretraga.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(pretraga.toLowerCase())
  )

  const [gostiGridRef] = useAutoAnimate({ duration: 220 })

  function otvoriNovog() { setForma(PRAZNA_FORMA); setIzmenaId(null); setModal('novi') }

  function otvoriIzmenu(g, e) {
    e?.stopPropagation()
    setForma({
      ime:             g.ime || '',
      prezime:         g.prezime || '',
      email:           g.email || '',
      telefon:         g.telefon || '',
      drzava:          g.drzava || 'Srbija',
      napomena:        g.napomena || '',
      datum_rodjenja:  g.datumRodjenja || '',
      pol:             g.pol || '',
      tip_dokumenta:   g.tipDokumenta || 'Pasoš',
      broj_dokumenta:  g.brojDokumenta || '',
    })
    setIzmenaId(g.id)
    setIzabrani(null)
    setModal('izmena')
  }

  async function sacuvaj() {
    if (!forma.ime) return
    const payload = {
      ime:            forma.ime,
      prezime:        forma.prezime,
      email:          forma.email,
      telefon:        forma.telefon,
      drzava:         forma.drzava,
      napomena:       forma.napomena,
      datum_rodjenja: forma.datum_rodjenja || null,
      pol:            forma.pol || null,
      tip_dokumenta:  forma.tip_dokumenta,
      broj_dokumenta: forma.broj_dokumenta || null,
    }
    if (modal === 'novi') {
      await supabase.from('gosti').insert([{ ...payload, user_id: user.id }])
    } else {
      await supabase.from('gosti').update(payload).eq('id', izmenaId)
    }
    await load()
    setModal(null)
  }

  async function obrisi(id) {
    await supabase.from('gosti').delete().eq('id', id)
    setGosti(gosti.filter(g => g.id !== id))
    setBrisanje(null)
    setIzabrani(null)
  }

  const gostRez = izabrani ? rezervacije.filter(r => r.gostId === izabrani.id) : []

  // Statistike
  const kompletan = gosti.filter(eturistaKompletan).length
  const nekompletan = gosti.length - kompletan

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">

      {/* eTurista status bar */}
      {gosti.length > 0 && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{kompletan} kompletan</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-600" />
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">{nekompletan} bez eTurista podataka</span>
          </div>
          <div className="flex-1" />
          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: gosti.length > 0 ? `${kompletan / gosti.length * 100}%` : '0%', backgroundColor: '#10b981' }}
            />
          </div>
        </div>
      )}

      {/* Pretraga + novi */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={pretraga}
            onChange={e => setPretraga(e.target.value)}
            placeholder="Pretraži goste..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 dark:text-white transition-colors"
          />
        </div>
        <button
          onClick={otvoriNovog}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity bg-teal-600"
        >
          <Plus size={16} /> Novi gost
        </button>
      </div>

      {/* Kartice */}
      <div ref={gostiGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtrirani.map(g => {
          const ok = eturistaKompletan(g)
          return (
            <div
              key={g.id}
              onClick={() => setIzabrani(g)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all animate-fade-in group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-teal-600">
                  {punoIme(g).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex items-center gap-1.5">
                  {/* eTurista badge */}
                  <div
                    title={ok ? 'eTurista podaci kompletni' : 'Nedostaju eTurista podaci'}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}
                  >
                    {ok ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                    <span className="hidden sm:inline">{ok ? 'eT' : '!eT'}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => otvoriIzmenu(g, e)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setBrisanje(g) }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <p className="font-semibold text-slate-800 dark:text-white text-sm mb-0.5">{punoIme(g)}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mb-3">{g.email || '—'}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={12} fill="currentColor" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{Number(g.ocena || 0).toFixed(1)}</span>
                </div>
                <span className="text-xs text-slate-400">{g.brBoravaka} boravaka</span>
                <div className="flex items-center gap-1 text-xs text-slate-400"><MapPin size={11} /> {g.drzava || '—'}</div>
              </div>

              {g.napomena && (
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 italic truncate">"{g.napomena}"</p>
              )}
            </div>
          )
        })}
      </div>

      {filtrirani.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3 opacity-30">👤</p>
          <p>{pretraga ? 'Nema rezultata' : 'Nema gostiju — dodaj prvog'}</p>
        </div>
      )}

      {/* ── Detalj gosta ── */}
      {izabrani && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIzabrani(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg bg-teal-600">
                    {punoIme(izabrani).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{punoIme(izabrani)}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={13} fill="currentColor" />
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{Number(izabrani.ocena || 0).toFixed(1)}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${eturistaKompletan(izabrani) ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {eturistaKompletan(izabrani) ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                        {eturistaKompletan(izabrani) ? 'eTurista OK' : 'Dopuni eTurista'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => otvoriIzmenu(izabrani, e)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => setBrisanje(izabrani)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  <button onClick={() => setIzabrani(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"><X size={16} /></button>
                </div>
              </div>

              <div className="space-y-2">
                {izabrani.email && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Mail size={14} /> {izabrani.email}</div>
                    <a href={`mailto:${izabrani.email}`} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center flex-shrink-0"><Mail size={16} /></a>
                  </div>
                )}
                {izabrani.telefon && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Phone size={14} /> {izabrani.telefon}</div>
                    <div className="flex gap-2">
                      <a href={`tel:${izabrani.telefon}`} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center flex-shrink-0"><Phone size={16} /></a>
                      <a href={waUrl(izabrani.telefon)} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center justify-center flex-shrink-0"><MessageCircle size={16} /></a>
                      <a href={viberUrl(izabrani.telefon)} className="w-12 h-12 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-colors flex items-center justify-center flex-shrink-0"><PhoneCall size={16} /></a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin size={14} /> {izabrani.drzava || '—'} · {izabrani.brBoravaka} boravaka
                </div>

                {/* eTurista podaci */}
                {(izabrani.datumRodjenja || izabrani.pol || izabrani.brojDokumenta) && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">eTurista</p>
                    {izabrani.datumRodjenja && <p className="text-xs text-slate-600 dark:text-slate-300">Datum roj.: {izabrani.datumRodjenja}</p>}
                    {izabrani.pol && <p className="text-xs text-slate-600 dark:text-slate-300">Pol: {izabrani.pol === 'M' ? 'Muški' : 'Ženski'}</p>}
                    {izabrani.tipDokumenta && izabrani.brojDokumenta && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">{izabrani.tipDokumenta}: {izabrani.brojDokumenta}</p>
                    )}
                  </div>
                )}

                {izabrani.napomena && <p className="text-sm text-slate-400 italic">"{izabrani.napomena}"</p>}
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-3">Istorija boravaka</h4>
              {gostRez.length === 0
                ? <p className="text-sm text-slate-400">Nema evidentiranih boravaka</p>
                : gostRez.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-sm mb-2">
                    <p className="text-xs text-slate-400">{r.dolazak} → {r.odlazak}</p>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">€{r.cena}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {modal && (
        <GostForma
          forma={forma}
          setForma={setForma}
          onSacuvaj={sacuvaj}
          onOtkazi={() => setModal(null)}
          naslov={modal === 'novi' ? 'Novi gost' : 'Izmeni gosta'}
        />
      )}

      {brisanje && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBrisanje(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Obriši gosta?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Ovo će trajno ukloniti <span className="font-medium text-slate-700 dark:text-slate-200">{punoIme(brisanje)}</span>.
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
