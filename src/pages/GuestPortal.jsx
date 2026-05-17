import React, { useState, useEffect } from 'react'
import {
  Wifi, Car, ScrollText, UtensilsCrossed, LogOut, Phone,
  MessageCircle, Copy, Check, MapPin, ChevronDown, ChevronUp,
  Navigation
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function waUrl(tel) { return `https://wa.me/${tel?.replace(/\D/g, '')}` }

function mapsNavUrl(origin, destination) {
  const base = 'https://www.google.com/maps/dir/?api=1'
  const o = encodeURIComponent(origin || '')
  const d = encodeURIComponent(destination || '')
  return `${base}&origin=${o}&destination=${d}`
}

// ─── Skeleton Screens ─────────────────────────────────────────────────────────
function SkeletonLine({ w = 'w-full', h = 'h-4' }) {
  return <div className={`skeleton rounded-xl ${w} ${h}`} />
}

function GuestPortalSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Hero skeleton */}
      <div className="relative px-6 pt-12 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #01696f 0%, #024f53 60%, #013a3d 100%)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

        <div className="relative flex flex-col items-center gap-3">
          {/* Fake icon */}
          <div className="w-16 h-16 rounded-3xl bg-white/20 animate-pulse" />
          {/* Name */}
          <div className="skeleton rounded-xl w-40 h-6 opacity-60" />
          {/* Location */}
          <div className="skeleton rounded-xl w-28 h-4 opacity-40" />
          {/* Welcome box */}
          <div className="w-full mt-2 bg-white/10 rounded-2xl p-4 space-y-2">
            <SkeletonLine w="w-full" h="h-3" />
            <SkeletonLine w="w-5/6" h="h-3" />
            <SkeletonLine w="w-4/6" h="h-3" />
          </div>
        </div>
      </div>

      {/* Section card skeletons */}
      <div className="px-4 py-6 space-y-3 max-w-lg mx-auto">
        {[
          { w1: 'w-16', w2: 'w-32', lines: 2 },
          { w1: 'w-24', w2: 'w-40', lines: 3 },
          { w1: 'w-20', w2: 'w-28', lines: 2 },
          { w1: 'w-28', w2: 'w-36', lines: 3 },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-4">
              <div className="skeleton w-11 h-11 rounded-2xl flex-shrink-0" />
              <SkeletonLine w={card.w2} h="h-5" />
              <div className="ml-auto skeleton w-4 h-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section Card ──────────────────────────────────────────────────────────────
function Section({ icon: Icon, color, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '18' }}>
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
    <button
      onClick={copy}
      className={`
        w-full flex items-center justify-between py-3 border-b border-slate-50 last:border-0
        text-left transition-colors active:bg-slate-50 rounded-xl -mx-1 px-1
      `}
    >
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-base font-bold tracking-wide transition-all duration-300 ${
          copied ? 'text-emerald-600' : 'text-slate-800'
        }`}>
          {copied ? '✓ Kopirano!' : (value || '—')}
        </p>
      </div>
      {value && (
        <div
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
            transition-all duration-300 flex-shrink-0
          `}
          style={{ backgroundColor: copied ? '#10b981' : '#01696f', color: 'white' }}
        >
          {copied ? <><Check size={12} /> Kopirano</> : <><Copy size={12} /> Kopiraj</>}
        </div>
      )}
    </button>
  )
}

// ─── Text block ────────────────────────────────────────────────────────────────
function TextBlock({ text, mapsOrigin, mapsLabel }) {
  if (!text) return <p className="text-sm text-slate-400 pt-3">Nema informacija</p>
  return (
    <div className="pt-3 space-y-1.5">
      {text.split('\n').filter(Boolean).map((line, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <span className="text-teal-500 mt-0.5 flex-shrink-0">•</span>
          <p className="text-sm text-slate-700 leading-relaxed flex-1">{line.replace(/^[-•*]\s*/, '')}</p>
        </div>
      ))}
      {/* Navigacija dugme za parking/sekcije sa lokacijom */}
      {mapsOrigin && mapsLabel && (
        <a
          href={mapsNavUrl(mapsOrigin, mapsLabel)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center gap-2 px-4 py-3 rounded-2xl text-white text-sm font-bold active:scale-95 transition-transform w-full justify-center"
          style={{ backgroundColor: '#4285F4' }}
        >
          <Navigation size={15} />
          Navigacija do parkinga
        </a>
      )}
    </div>
  )
}

// ─── Restaurant list ────────────────────────────────────────────────────────────
function RestaurantList({ text, aptLokacija }) {
  if (!text) return <p className="text-sm text-slate-400 pt-3">Nema preporuka</p>
  return (
    <div className="pt-3 space-y-3">
      {text.split('\n').filter(Boolean).map((line, i) => {
        const raw = line.replace(/^[-•*]\s*/, '')
        const match = raw.match(/^(.+?)\s*[—–-]\s*(.+)$/)
        const name = match ? match[1].trim() : raw
        const desc = match ? match[2].trim() : null

        return (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed size={14} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
              {desc && <p className="text-xs text-slate-500 truncate">{desc}</p>}
            </div>
            {/* Google Maps navigacija do restorana */}
            <a
              href={mapsNavUrl(aptLokacija, name)}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
              title={`Navigacija do ${name}`}
            >
              <Navigation size={15} className="text-blue-600" />
            </a>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function GuestPortal({ token }) {
  const [apt,      setApt]      = useState(null)
  const [loading,  setLoading]  = useState(true)
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

  // ── Loading — Skeleton screens ─────────────────────────────────────────────
  if (loading) return <GuestPortalSkeleton />

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

  const tel          = apt.host_contact  || ''
  const wifiNaziv    = apt.wifi_naziv    || ''
  const wifiSifra    = apt.wifi_sifra    || ''
  const welcomeMsg   = apt.welcome_msg   || `Dobrodošli u ${apt.naziv}! Drago nam je što ste izabrali naš apartman. Nadamo se da ćete se odlično provesti.`
  const checkinInfo  = apt.checkin_info  || ''
  const parkingInfo  = apt.parking_info  || ''
  const houseRules   = apt.house_rules   || ''
  const restaurants  = apt.restaurants   || ''
  const checkoutInfo = apt.checkout_info || 'Molimo Vas da do 11:00 ostavite apartman. Ključeve ostavite na mestu gde ste ih preuzeli.'
  const lokacija     = apt.lokacija      || ''

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>

      {/* ── Hero header ── */}
      <div
        className="relative px-6 pt-12 pb-8 text-white text-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #01696f 0%, #024f53 60%, #013a3d 100%)' }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

        <div className="relative inline-flex w-16 h-16 rounded-3xl bg-white/20 backdrop-blur items-center justify-center mb-4 text-3xl shadow-lg">
          🏠
        </div>

        <h1 className="text-2xl font-black text-white relative">{apt.naziv}</h1>
        {lokacija && (
          <div className="flex items-center justify-center gap-1.5 mt-1.5 relative">
            <MapPin size={13} className="text-teal-300" />
            <p className="text-teal-200 text-sm">{lokacija}</p>
          </div>
        )}

        <div className="relative mt-5 bg-white/15 backdrop-blur rounded-2xl p-4 text-left">
          <p className="text-sm text-white/90 leading-relaxed">{welcomeMsg}</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-6 space-y-3 max-w-lg mx-auto pb-16">

        {/* WiFi — ceo red je klikabilan, tekst se menja u ✓ Kopirano! */}
        {(wifiNaziv || wifiSifra) && (
          <Section icon={Wifi} color="#01696f" title="WiFi">
            {wifiNaziv && <WifiRow label="Mreža"  value={wifiNaziv} />}
            {wifiSifra && <WifiRow label="Šifra" value={wifiSifra} />}
            {wifiSifra && (
              <p className="text-xs text-slate-300 text-center pt-2">
                Tapni na šifru da kopiraš
              </p>
            )}
          </Section>
        )}

        {/* Check-in */}
        {checkinInfo && (
          <Section icon={LogOut} color="#0d9488" title="Pristup apartmanu" defaultOpen={true}>
            <TextBlock text={checkinInfo} />
          </Section>
        )}

        {/* Parking — sa navigacijom */}
        {parkingInfo && (
          <Section icon={Car} color="#3b82f6" title="Parking" defaultOpen={false}>
            <TextBlock
              text={parkingInfo}
              mapsOrigin={lokacija}
              mapsLabel={`Parking ${apt.naziv} ${lokacija}`}
            />
          </Section>
        )}

        {/* House rules */}
        {houseRules && (
          <Section icon={ScrollText} color="#8b5cf6" title="Pravila kuće" defaultOpen={false}>
            <TextBlock text={houseRules} />
          </Section>
        )}

        {/* Restaurants — svaki sa Maps ikonom */}
        {restaurants && (
          <Section icon={UtensilsCrossed} color="#f59e0b" title="Preporučeni restorani" defaultOpen={false}>
            <RestaurantList text={restaurants} aptLokacija={lokacija} />
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

        {/* HostOS marketing footer */}
        <a
          href="https://hostos-app.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="block mt-8 mx-auto max-w-sm active:scale-95 transition-transform"
        >
          <div className="rounded-2xl overflow-hidden shadow-sm group">
            <div
              className="px-5 py-4 text-white"
              style={{ background: 'linear-gradient(135deg, #01696f 0%, #024f53 100%)' }}
            >
              <p className="text-sm font-black leading-snug mb-0.5">
                Izdajete apartman?
              </p>
              <p className="text-xs text-teal-200 leading-relaxed">
                Upravljajte pametnije uz HostOS — rezervacije, gosti, čišćenja i finansije na jednom mestu.
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: 'linear-gradient(135deg, #01696f, #024f53)' }}>
                  🏠
                </div>
                <span className="text-xs font-black text-slate-600 tracking-tight">HostOS</span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-400">besplatno probajte</span>
              </div>
              <svg className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}
