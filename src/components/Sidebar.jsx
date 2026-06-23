import React from 'react'
import {
  LayoutDashboard, Calendar, BookOpen, Users, Sparkles, Wallet,
  Building2, LogOut, Sun, Moon, FileText, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const SVE_STAVKE = [
  { id: 'dashboard',   naziv: 'Pregled',       ikona: LayoutDashboard, role: ['vlasnik'] },
  { id: 'problemi',    naziv: 'Problemi',       ikona: AlertTriangle,   role: ['vlasnik'], badge: true },
  { id: 'kalendar',    naziv: 'Kalendar',      ikona: Calendar,        role: ['vlasnik', 'kooperant'] },
  { id: 'rezervacije', naziv: 'Rezervacije',   ikona: BookOpen,        role: ['vlasnik', 'kooperant'] },
  { id: 'gosti',       naziv: 'Gosti',         ikona: Users,           role: ['vlasnik', 'kooperant'] },
  { id: 'cistacije',   naziv: 'Čistačice Hub', ikona: Sparkles,        role: ['vlasnik', 'cistacica'] },
  { id: 'finansije',   naziv: 'Finansije',     ikona: Wallet,          role: ['vlasnik'] },
  { id: 'izvestaji',   naziv: 'Izveštaji',     ikona: FileText,        role: ['vlasnik'] },
]

function initials(ime) {
  if (!ime) return '?'
  return ime.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function Sidebar({ aktivnaStrana, setAktivnaStrana, tamniRezim, setTamniRezim, problemCount = 0 }) {
  const { user, profile, signOut } = useAuth()
  const role      = profile?.role || 'vlasnik'
  const navigacija = SVE_STAVKE.filter(s => s.role.includes(role))

  return (
    <aside className="hidden md:flex w-60 min-h-screen flex-col flex-shrink-0 animate-fade-in"
      style={{ backgroundColor: '#0f172a' }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-600">
            <Building2 size={19} className="text-white" />
          </div>
          <div>
            <span className="text-white font-black text-base tracking-tight">HostOS</span>
            <p className="text-[11px] leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Upravljanje apartmanima
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navigacija.map((stavka) => {
          const Ikona   = stavka.ikona
          const aktivan = aktivnaStrana === stavka.id

          return (
            <button
              key={stavka.id}
              onClick={() => setAktivnaStrana(stavka.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 active:scale-95
                ${aktivan
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }
              `}
              style={aktivan ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              <Ikona size={17} strokeWidth={aktivan ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{stavka.naziv}</span>
              {stavka.badge && problemCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black text-white bg-red-500">
                  {problemCount > 9 ? '9+' : problemCount}
                </span>
              )}
              {aktivan && !stavka.badge && (
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Dark mode toggle */}
        <button
          onClick={() => setTamniRezim(!tamniRezim)}
          aria-label={tamniRezim ? 'Prebaci na svetli režim' : 'Prebaci na tamni režim'}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
            text-white/40 hover:text-white/80 hover:bg-white/5
            transition-all duration-150 active:scale-95"
        >
          {tamniRezim
            ? <Sun size={17} strokeWidth={1.8} aria-hidden="true" />
            : <Moon size={17} strokeWidth={1.8} aria-hidden="true" />
          }
          <span>{tamniRezim ? 'Svetli režim' : 'Tamni režim'}</span>
        </button>

        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            text-white text-xs font-black bg-teal-600">
            {initials(profile?.ime)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">
              {profile?.ime || 'Korisnik'}
            </p>
            <p className="text-[11px] truncate leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            title="Odjavi se"
            className="flex-shrink-0 p-1.5 rounded-lg
              text-white/30 hover:text-white/70 hover:bg-white/10
              transition-all duration-150 active:scale-90 opacity-0 group-hover:opacity-100">
            <LogOut size={15} />
          </button>
        </div>

      </div>
    </aside>
  )
}
