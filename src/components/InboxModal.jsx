import React, { useState, useEffect, useRef } from 'react'
import {
  X, Pencil, MessageCircle, PhoneCall, Send, Plus,
  LogOut, Wifi, ChevronRight, ExternalLink, ArrowDownLeft,
  ArrowUpRight, StickyNote, Clock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/supabase'

// ── Platform config ────────────────────────────────────────────────────────────
const KANALI = {
  whatsapp: { label: 'WhatsApp', emoji: '💬', boja: '#25D366', bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-200 dark:border-green-800',   text: 'text-green-700 dark:text-green-300'   },
  viber:    { label: 'Viber',    emoji: '📱', boja: '#7360f2', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' },
  booking:  { label: 'Booking', emoji: '🏨', boja: '#003580', bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-800',     text: 'text-blue-700 dark:text-blue-300'     },
  airbnb:   { label: 'Airbnb',  emoji: '🏠', boja: '#FF5A5F', bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-800',       text: 'text-red-700 dark:text-red-300'       },
  direktno: { label: 'Direktno',emoji: '📞', boja: '#64748b', bg: 'bg-slate-50 dark:bg-slate-700/50',   border: 'border-slate-200 dark:border-slate-600',   text: 'text-slate-600 dark:text-slate-400'   },
  napomena: { label: 'Napomena',emoji: '📝', boja: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800',   text: 'text-amber-700 dark:text-amber-300'   },
}

const SMER = {
  out:     { label: 'Poslato', Ikona: ArrowUpRight,   cls: 'text-teal-600 dark:text-teal-400'   },
  in:      { label: 'Primljeno', Ikona: ArrowDownLeft, cls: 'text-blue-600 dark:text-blue-400'    },
  napomena:{ label: 'Napomena',  Ikona: StickyNote,    cls: 'text-amber-600 dark:text-amber-400'  },
}

function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'sada'
  if (m < 60) return `pre ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `pre ${h}h`
  if (h < 48) return 'juče'
  return new Date(ts).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short' })
}

function waUrl(tel, tekst)  { return `https://wa.me/${tel?.replace(/\D/g, '')}?text=${encodeURIComponent(tekst || '')}` }
function viberUrl(tel)       { return `viber://chat?number=${encodeURIComponent(tel?.replace(/[\s\-()]/g, '') || '')}` }

function templateCheckin(r, apt) {
  return `Pozdrav ${r.gost}! 👋\n\nVaša rezervacija za *${apt?.naziv || 'apartman'}* je potvrđena.\n\n📅 Check-in: ${r.dolazak} od 14:00\n📅 Check-out: ${r.odlazak} do 11:00\n📍 ${apt?.lokacija || ''}\n\n${apt?.checkinInfo || 'Ključevi su na dogovorenom mestu.'}\n\nSrdačan pozdrav! 🏠`
}
function templateWifi(r, apt) {
  return `Pozdrav ${r.gost}! 📶\n\nWiFi podaci za *${apt?.naziv || 'apartman'}*:\n\n🌐 Mreža: ${apt?.wifiNaziv || '—'}\n🔑 Šifra: ${apt?.wifiSifra || '—'}\n\nPrijatan boravak! 😊`
}
function templateCheckout(r, apt) {
  return `Pozdrav ${r.gost}! 🙏\n\nPodsetnik — checkout je *${r.odlazak}* do 11:00.\n\nHvala što ste boravili u *${apt?.naziv || 'apartmanu'}*! Nadam se da se vidimo opet. ⭐`
}

const statusBoje = {
  potvrdjeno: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  zavrseno:   'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  cekanje:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  otkazano:   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}
const statusNaziv = { potvrdjeno: 'Potvrđeno', zavrseno: 'Završeno', cekanje: 'Na čekanju', otkazano: 'Otkazano' }

// ── Main component ─────────────────────────────────────────────────────────────
export default function InboxModal({ detalji, apt, user, onClose, onEdit }) {
  const [tab,       setTab]       = useState('poruke')
  const [messages,  setMessages]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [sending,   setSending]   = useState(false)
  const [form,      setForm]      = useState({ kanal: 'whatsapp', smer: 'in', tekst: '' })
  const bottomRef = useRef(null)

  const tel = detalji.kontakt

  useEffect(() => {
    loadMessages()
  }, [detalji.id])

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('rezervacija_id', detalji.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }

  async function saveMsg(kanal, smer, tekst) {
    await supabase.from('messages').insert({
      user_id:       user.id,
      rezervacija_id: detalji.id,
      kanal,
      smer,
      tekst: tekst || '',
    })
    await loadMessages()
  }

  async function submitForm() {
    if (!form.tekst.trim() && form.smer !== 'napomena') return
    setSending(true)
    await saveMsg(form.kanal, form.smer, form.tekst.trim())
    setForm({ kanal: 'whatsapp', smer: 'in', tekst: '' })
    setShowForm(false)
    setSending(false)
  }

  async function onTemplateSend(templateLabel, kanal) {
    await Promise.all([
      saveMsg(kanal, 'out', templateLabel),
      logActivity(user.id, 'poruka', `${templateLabel} poslat — ${detalji.gost}`, { gost: detalji.gost, tip: templateLabel }),
    ])
  }

  // Platform deep-link openers
  const platformLinks = [
    { kanal: 'whatsapp', url: tel ? `https://wa.me/${tel.replace(/\D/g, '')}` : null, label: 'WhatsApp' },
    { kanal: 'viber',    url: tel ? viberUrl(tel) : null,                              label: 'Viber'    },
    { kanal: 'booking',  url: 'https://admin.booking.com',                             label: 'Booking'  },
    { kanal: 'airbnb',   url: 'https://www.airbnb.com/hosting/inbox',                  label: 'Airbnb'   },
  ]

  const templates = [
    { label: 'Check-in info',    emoji: '🏠', tekst: templateCheckin(detalji, apt)  },
    { label: 'WiFi šifra',       emoji: '📶', tekst: templateWifi(detalji, apt)     },
    { label: 'Checkout reminder',emoji: '🚪', tekst: templateCheckout(detalji, apt) },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-modal z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-modal animate-slide-up flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight">{detalji.gost}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{apt?.naziv} · {detalji.dolazak} → {detalji.odlazak}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={onEdit} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 transition-colors active:scale-90">
                <Pencil size={15} />
              </button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors active:scale-90">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusBoje[detalji.status]}`}>
              {statusNaziv[detalji.status]}
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">€{detalji.cena}</span>
            <span className="text-xs text-slate-400">{detalji.brGostiju} gosta</span>
            {detalji.izvor && detalji.izvor !== 'Direktno' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {detalji.izvor}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            {[
              { id: 'poruke',   label: `Poruke ${messages.length > 0 ? `(${messages.length})` : ''}` },
              { id: 'sabloni',  label: 'Šabloni' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`
                  flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-150
                  ${tab === t.id
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }
                `}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Poruke ── */}
        {tab === 'poruke' && (
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Platform quick-open row */}
            <div className="px-4 py-3 flex gap-2 border-b border-slate-50 dark:border-slate-700/50 flex-shrink-0">
              {platformLinks.map(p => {
                const k = KANALI[p.kanal]
                return (
                  <a
                    key={p.kanal}
                    href={p.url || '#'}
                    target={p.url ? '_blank' : undefined}
                    rel="noreferrer"
                    onClick={() => p.url && saveMsg(p.kanal, 'out', 'Otvoreno')}
                    className={`
                      flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border
                      transition-all duration-150 active:scale-95
                      ${p.url ? `${k.bg} ${k.border} hover:opacity-80` : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 opacity-40 cursor-not-allowed'}
                    `}
                  >
                    <span className="text-lg">{k.emoji}</span>
                    <span className={`text-[10px] font-bold ${p.url ? k.text : 'text-slate-400'}`}>{k.label}</span>
                  </a>
                )
              })}
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loading ? (
                <div className="space-y-2 py-4">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nema logiranih poruka</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Šalji šablone ili ručno zabeležavaj komunikaciju
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const k = KANALI[msg.kanal] || KANALI.direktno
                  const s = SMER[msg.smer] || SMER.out
                  const SmerIkona = s.Ikona
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border animate-fade-in ${k.bg} ${k.border}`}
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5">{k.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <SmerIkona size={11} className={s.cls} />
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${s.cls}`}>{s.label}</span>
                          <span className={`text-[10px] font-semibold ${k.text}`}>{k.label}</span>
                        </div>
                        {msg.tekst && (
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{msg.tekst}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums mt-0.5">
                        {relTime(msg.created_at)}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Log message form */}
            {showForm ? (
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 space-y-2 animate-slide-up">
                {/* Channel + direction row */}
                <div className="flex gap-2">
                  <select
                    value={form.kanal}
                    onChange={e => setForm({...form, kanal: e.target.value})}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white"
                  >
                    {Object.entries(KANALI).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                  <select
                    value={form.smer}
                    onChange={e => setForm({...form, smer: e.target.value})}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white"
                  >
                    <option value="in">↙ Primljeno</option>
                    <option value="out">↗ Poslato</option>
                    <option value="napomena">📝 Napomena</option>
                  </select>
                </div>

                {/* Text input */}
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={form.tekst}
                    onChange={e => setForm({...form, tekst: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && submitForm()}
                    placeholder="Kratak opis poruke (opciono)..."
                    className="flex-1 px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={submitForm}
                    disabled={sending}
                    className="px-4 py-2.5 rounded-xl text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#01696f' }}
                  >
                    <Send size={15} />
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 border border-slate-200 dark:border-slate-600 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4 pt-2 border-t border-slate-50 dark:border-slate-700/50 flex-shrink-0">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-teal-400 hover:text-teal-600 transition-all active:scale-98"
                >
                  + Zabeleži poruku
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Šabloni ── */}
        {tab === 'sabloni' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {!tel ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 mb-3">Dodaj kontakt broj da bi slao poruke</p>
                <button
                  onClick={onEdit}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-xl"
                  style={{ backgroundColor: '#01696f' }}
                >
                  Dodaj kontakt
                </button>
              </div>
            ) : (
              templates.map(tmpl => (
                <div key={tmpl.label} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span>{tmpl.emoji}</span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{tmpl.label}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={waUrl(tel, tmpl.tekst)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onTemplateSend(tmpl.label, 'whatsapp')}
                      className="flex-1 py-2 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                    <a
                      href={viberUrl(tel)}
                      onClick={() => onTemplateSend(tmpl.label, 'viber')}
                      className="flex-1 py-2 text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    >
                      <PhoneCall size={13} /> Viber
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
