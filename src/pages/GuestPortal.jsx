import React, { useState, useEffect } from 'react'
import { Wifi, Car, ScrollText, UtensilsCrossed, LogOut, Phone, MessageCircle, Copy, Check, MapPin, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function waUrl(tel) { return `https://wa.me/${tel?.replace(/\D/g, '')}` }

// ─── Section Card ──────────────────────────────────────────────────────────────
function Section({ icon: Icon, color, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '18' }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span className="flex-1 font-bold text-slate-800 text-base">{title}</span>
        {open
          ? <ChevronUp size={16} className="text-slate-300 flex-shrink-0" />
          : <ChevronDown size={16} className="text-slate-300 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-50">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── WiFi copy row ─────────────────────────────────────────────────────────────
function WifiRow({ label, value }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-base font-bold text-slate-800 tracking-wide">{value || '—'}</p>
      </div>
      {value && (
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{ backgroundColor: copied ? '#10b981' : '#01696f', color: 'white' }}
        >
          {copied ? <><Check size={12} /> Kopirano</> : <><Copy size={12} /> Kopiraj</>}
        </button>
      )}
    </div>
  )
}

// ─── Text block ────────────────────────────────────────────────────────────────
function TextBlock({ text }) {
  if (!text) return <p className="text-sm text-slate-400 pt-3">Nema informacija</p>
  return (
    <div className="pt-3 space-y-1.5">
      {text.split('\n').filter(Boolean).map((line, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <span className="text-teal-500 mt-0.5 flex-shrink-0">•</span>
          <p className="text-sm text-slate-700 leading-relaxed">{line.replace(/^[-•*]\s*/, '')}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Restaurant list ────────────────────────────────────────────────────────────
function RestaurantList({ text }) {
  if (!text) return <p className="text-sm text-slate-400 pt-3">Nema preporuka</p>
  return (
    <div className="pt-3 space-y-3">
      {text.split('\n').filter(Boolean).map((line, i) => {
        // Format: "Ime — opis (5 min)" or just plain text
        const match = line.match(/^(.+?)\s*[—–-]\s*(.+)$/)
        if (match) {
          return (
            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{match[1].trim()}</p>
                <p className="text-xs text-slate-500">{match[2].trim()}</p>
              </div>
            </div>
          )
        }
        return (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed size={14} className="text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{line.replace(/^[-•*]\s*/, '')}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function GuestPortal({ token }) {
  const [apt, setApt]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    load()
  }, [token])

  async function load() {
    const { data, error } = await supabase
      .from('apartmani')
      .select('*')
      .eq('guest_token', token)
      .single()

    if (!data || error) { setNotFound(true) }
    else { setApt(data) }
    setLoading(false)
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#01696f', borderTopColor: 'transparent' }} />
        <p className="text-sm text-slate-400">Učitavanje...</p>
      </div>
    </div>
  )

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-black text-slate-800 mb-2">Link nije pronađen</h1>
        <p className="text-sm text-slate-400">Ovaj link nije validan ili je istekao. Obratite se domaćinu.</p>
      </div>
    </div>
  )

  const tel         = apt.host_contact || ''
  const wifiNaziv   = apt.wifi_naziv   || ''
  const wifiSifra   = apt.wifi_sifra   || ''
  const welcomeMsg  = apt.welcome_msg  || `Dobrodošli u ${apt.naziv}! Drago nam je što ste izabrali naš apartman. Nadamo se da ćete se odlično provesti.`
  const checkinInfo = apt.checkin_info || ''
  const parkingInfo = apt.parking_info || ''
  const houseRules  = apt.house_rules  || ''
  const restaurants = apt.restaurants  || ''
  const checkoutInfo= apt.checkout_info || 'Molimo Vas da do 11:00 ostavite apartman. Ključeve ostavite na mestu gde ste ih preuzeli.'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>

      {/* ── Hero header ── */}
      <div
        className="relative px-6 pt-12 pb-8 text-white text-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #01696f 0%, #024f53 60%, #013a3d 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

        {/* Icon */}
        <div className="relative inline-flex w-16 h-16 rounded-3xl bg-white/20 backdrop-blur items-center justify-center mb-4 text-3xl shadow-lg">
          🏠
        </div>

        <h1 className="text-2xl font-black text-white relative">{apt.naziv}</h1>
        {apt.lokacija && (
          <div className="flex items-center justify-center gap-1.5 mt-1.5 relative">
            <MapPin size={13} className="text-teal-300" />
            <p className="text-teal-200 text-sm">{apt.lokacija}</p>
          </div>
        )}

        {/* Welcome message */}
        <div className="relative mt-5 bg-white/15 backdrop-blur rounded-2xl p-4 text-left">
          <p className="text-sm text-white/90 leading-relaxed">{welcomeMsg}</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-6 space-y-3 max-w-lg mx-auto pb-16">

        {/* WiFi */}
        {(wifiNaziv || wifiSifra) && (
          <Section icon={Wifi} color="#01696f" title="WiFi">
            <WifiRow label="Mreža" value={wifiNaziv} />
            <WifiRow label="Šifra" value={wifiSifra} />
          </Section>
        )}

        {/* Check-in info */}
        {checkinInfo && (
          <Section icon={LogOut} color="#0d9488" title="Pristup apartmanu" defaultOpen={true}>
            <TextBlock text={checkinInfo} />
          </Section>
        )}

        {/* Parking */}
        {parkingInfo && (
          <Section icon={Car} color="#3b82f6" title="Parking" defaultOpen={false}>
            <TextBlock text={parkingInfo} />
          </Section>
        )}

        {/* House rules */}
        {houseRules && (
          <Section icon={ScrollText} color="#8b5cf6" title="Pravila kuće" defaultOpen={false}>
            <TextBlock text={houseRules} />
          </Section>
        )}

        {/* Restaurants */}
        {restaurants && (
          <Section icon={UtensilsCrossed} color="#f59e0b" title="Preporučeni restorani" defaultOpen={false}>
            <RestaurantList text={restaurants} />
          </Section>
        )}

        {/* Checkout */}
        <Section icon={LogOut} color="#64748b" title="Checkout" defaultOpen={false}>
          <TextBlock text={checkoutInfo} />
          <div className="mt-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-xs font-bold text-amber-700 text-center">⏰ Checkout do 11:00</p>
          </div>
        </Section>

        {/* Contact */}
        {tel && (
          <Section icon={Phone} color="#10b981" title="Kontakt — domaćin" defaultOpen={false}>
            <div className="pt-3 flex gap-3">
              <a
                href={waUrl(tel)}
                target="_blank" rel="noreferrer"
                className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a
                href={`tel:${tel}`}
                className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 bg-slate-100 text-slate-700 active:scale-95 transition-transform"
              >
                <Phone size={16} /> Pozovi
              </a>
            </div>
          </Section>
        )}

        {/* Branding */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-300">Powered by <span className="font-bold text-slate-400">HostOS</span></p>
        </div>
      </div>
    </div>
  )
}
