import React, { useState, useEffect } from 'react'
import {
  X, Link, Copy, Check, ExternalLink, Wifi, Car,
  ScrollText, UtensilsCrossed, LogOut, Phone, Eye,
  RefreshCw, Sparkles, AlertTriangle, ShieldOff, Shield
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const SECTIONS = [
  { key: 'welcome_msg',   label: 'Dobrodošlica',      icon: Sparkles,        placeholder: 'Dobrodošli! Drago nam je što ste izabrali naš apartman...', tip: 'Kratka topla poruka dobrodošlice.' },
  { key: 'checkin_info',  label: 'Pristup apartmanu', icon: ExternalLink,    placeholder: 'Ključevi se nalaze...\nKod za bravu je...',                  tip: 'Kako doći do ključeva i ući u apartman.' },
  { key: 'parking_info',  label: 'Parking',            icon: Car,             placeholder: 'Parking ispred zgrade, besplatan za goste.\nBroj mesta: 12', tip: 'Informacije o parkingu.' },
  { key: 'house_rules',   label: 'Pravila kuće',       icon: ScrollText,      placeholder: 'Ne pušiti unutra\nKućni ljubimci su dozvoljeni\nTiho posle 22:00', tip: 'Svaki red = jedno pravilo.' },
  { key: 'restaurants',   label: 'Restorani',          icon: UtensilsCrossed, placeholder: 'Kafana Dva Jelena — srpska kuhinja (3 min)\nPizzeria Vesuvio — pica, pasta (5 min)', tip: 'Format: Naziv — opis (vreme hoda)' },
  { key: 'checkout_info', label: 'Checkout',           icon: LogOut,          placeholder: 'Molimo Vas da do 11:00 ostavite apartman.\nKljučeve ostavite na stolu.', tip: 'Uputstva za odjavu.' },
  { key: 'host_contact',  label: 'Kontakt broj',       icon: Phone,           placeholder: '+381601234567', tip: 'Broj telefona za WhatsApp i pozive.' },
]

// Confirmation overlay for destructive link actions
function ConfirmBox({ action, onConfirm, onCancel, loading }) {
  const cfg = {
    reset: {
      icon: <RefreshCw size={18} className="text-amber-500" />,
      title: 'Promeniti link?',
      body: 'Stari link će prestati da radi odmah. Svaki gost koji ga ima neće moći da pristupi portalu. Novi link ćeš morati da pošalješ ponovo.',
      confirmLabel: 'Da, promeni link',
      confirmColor: '#f59e0b',
    },
    deactivate: {
      icon: <ShieldOff size={18} className="text-red-500" />,
      title: 'Deaktivirati portal?',
      body: 'Portal će biti potpuno ugašen. Stari link vraća grešku "nije pronađen". Možeš ga ponovo aktivirati u bilo kom trenutku.',
      confirmLabel: 'Da, ugasi portal',
      confirmColor: '#ef4444',
    },
  }[action]

  return (
    <div className="mt-3 rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-2">
        {cfg.icon}
        <p className="font-bold text-slate-800 dark:text-white text-sm">{cfg.title}</p>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{cfg.body}</p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Odustani
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-60 transition-opacity"
          style={{ backgroundColor: cfg.confirmColor }}
        >
          {loading ? 'Radim...' : cfg.confirmLabel}
        </button>
      </div>
    </div>
  )
}

export default function GuestPortalModal({ apartman, onClose, onSaved }) {
  const [forma, setForma]         = useState({})
  const [saving, setSaving]       = useState(false)
  const [copied, setCopied]       = useState(false)
  const [tab, setTab]             = useState('edit')
  const [working, setWorking]     = useState(false)
  const [confirm, setConfirm]     = useState(null) // 'reset' | 'deactivate' | null

  const token    = apartman.guest_token || ''
  const portalUrl = token ? `${window.location.origin}/g/${token}` : null

  useEffect(() => {
    setForma({
      welcome_msg:   apartman.welcome_msg   || '',
      checkin_info:  apartman.checkin_info  || '',
      parking_info:  apartman.parking_info  || '',
      house_rules:   apartman.house_rules   || '',
      restaurants:   apartman.restaurants   || '',
      checkout_info: apartman.checkout_info || '',
      host_contact:  apartman.host_contact  || '',
    })
  }, [apartman.id])

  // ── Token actions ────────────────────────────────────────────────────────────

  async function generateToken() {
    // Used for first-time creation (no confirm needed)
    setWorking(true)
    const newToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    await supabase.from('apartmani').update({ guest_token: newToken }).eq('id', apartman.id)
    setWorking(false)
    onSaved?.()
  }

  async function resetToken() {
    // Replaces existing token — confirmed action
    setWorking(true)
    const newToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    await supabase.from('apartmani').update({ guest_token: newToken }).eq('id', apartman.id)
    setWorking(false)
    setConfirm(null)
    onSaved?.()
  }

  async function deactivatePortal() {
    // Kills portal entirely — sets token to null
    setWorking(true)
    await supabase.from('apartmani').update({ guest_token: null }).eq('id', apartman.id)
    setWorking(false)
    setConfirm(null)
    onSaved?.()
  }

  async function save() {
    setSaving(true)
    await supabase.from('apartmani').update({
      welcome_msg:   forma.welcome_msg   || null,
      checkin_info:  forma.checkin_info  || null,
      parking_info:  forma.parking_info  || null,
      house_rules:   forma.house_rules   || null,
      restaurants:   forma.restaurants   || null,
      checkout_info: forma.checkout_info || null,
      host_contact:  forma.host_contact  || null,
    }).eq('id', apartman.id)
    setSaving(false)
    onSaved?.()
  }

  function copyLink() {
    if (!portalUrl) return
    navigator.clipboard?.writeText(portalUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const filledSections  = SECTIONS.filter(s => forma[s.key]?.trim())
  const filledCount     = filledSections.length
  const completionPct   = Math.round(filledCount / SECTIONS.length * 100)

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#01696f18' }}>
                  <Link size={16} style={{ color: '#01696f' }} />
                </div>
                <h2 className="font-black text-slate-800 dark:text-white text-lg">Guest Portal</h2>
                {/* Completion badge */}
                {filledCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: completionPct === 100 ? '#10b981' : '#01696f' }}>
                    {filledCount}/{SECTIONS.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 ml-10">{apartman.naziv}</p>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors active:scale-90">
              <X size={16} />
            </button>
          </div>

          {/* ── Link box ── */}
          {token ? (
            <div className="space-y-2">
              {/* Active link row */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Shield size={10} className="text-teal-500 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Link za goste · aktivan</p>
                  </div>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{portalUrl}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                    style={{ backgroundColor: copied ? '#10b981' : '#01696f' }}
                  >
                    {copied ? <><Check size={12} /> OK</> : <><Copy size={12} /> Kopiraj</>}
                  </button>
                  <a href={portalUrl} target="_blank" rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors">
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Security actions row */}
              {!confirm && (
                <div className="flex gap-2 px-0.5">
                  <button
                    onClick={() => setConfirm('reset')}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline transition-colors"
                  >
                    <RefreshCw size={11} /> Promeni link
                  </button>
                  <span className="text-slate-200 dark:text-slate-600">·</span>
                  <button
                    onClick={() => setConfirm('deactivate')}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 hover:underline transition-colors"
                  >
                    <ShieldOff size={11} /> Deaktiviraj portal
                  </button>
                </div>
              )}

              {/* Confirmation box */}
              {confirm && (
                <ConfirmBox
                  action={confirm}
                  loading={working}
                  onConfirm={confirm === 'reset' ? resetToken : deactivatePortal}
                  onCancel={() => setConfirm(null)}
                />
              )}
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 text-center border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Portal nije aktivan</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">Generiši link i pošalji ga gostu.</p>
              <button
                onClick={generateToken}
                disabled={working}
                className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-60 flex items-center gap-2 mx-auto transition-opacity"
                style={{ backgroundColor: '#01696f' }}
              >
                <RefreshCw size={13} className={working ? 'animate-spin' : ''} />
                {working ? 'Generišem...' : 'Aktiviraj portal'}
              </button>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="flex gap-1 mt-4 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            {[['edit', '✏️ Uredi'], ['preview', '👁️ Preview']].map(([k, v]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tab === k
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── Edit tab ── */}
        {tab === 'edit' && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

            {/* Progress bar */}
            {filledCount > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%`, backgroundColor: completionPct === 100 ? '#10b981' : '#01696f' }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                  {filledCount}/{SECTIONS.length} popunjeno
                </span>
              </div>
            )}

            {SECTIONS.map(({ key, label, icon: Icon, placeholder, tip }) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={13} className="text-slate-400" />
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</label>
                  {forma[key]?.trim() && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white bg-teal-500">✓</span>
                  )}
                </div>
                {key === 'host_contact' ? (
                  <input
                    value={forma[key] || ''}
                    onChange={e => setForma({ ...forma, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <textarea
                    value={forma[key] || ''}
                    onChange={e => setForma({ ...forma, [key]: e.target.value })}
                    placeholder={placeholder}
                    rows={key === 'welcome_msg' ? 2 : 3}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                )}
                <p className="text-[11px] text-slate-400 mt-1 ml-0.5">{tip}</p>
              </div>
            ))}
            <div className="h-2" />
          </div>
        )}

        {/* ── Preview tab ── */}
        {tab === 'preview' && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3 pb-1 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/40 flex items-center gap-2">
              <Eye size={13} className="text-amber-600" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Ovako izgleda gostima na telefonu</p>
            </div>
            <div className="mx-4 my-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
              <div className="px-5 py-6 text-white text-center" style={{ background: 'linear-gradient(160deg, #01696f, #024f53)' }}>
                <div className="inline-flex w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mb-3 text-2xl">🏠</div>
                <h3 className="font-black text-white text-lg">{apartman.naziv}</h3>
                {apartman.lokacija && <p className="text-teal-200 text-xs mt-1">{apartman.lokacija}</p>}
                {forma.welcome_msg && (
                  <div className="mt-3 bg-white/15 rounded-xl p-3 text-left">
                    <p className="text-xs text-white/90 leading-relaxed line-clamp-3">{forma.welcome_msg}</p>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 px-3 py-3 space-y-2">
                {filledSections.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">Popunite polja u "Uredi" tabu</p>
                ) : (
                  filledSections.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={12} style={{ color: '#01696f' }} />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{forma[key]}</p>
                    </div>
                  ))
                )}
                <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 py-2">Powered by HostOS</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Zatvori
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-bold text-white rounded-2xl hover:opacity-90 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#01696f' }}
          >
            {saving ? 'Čuvam...' : 'Sačuvaj'}
          </button>
        </div>
      </div>
    </div>
  )
}
