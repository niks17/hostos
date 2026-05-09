import React from 'react'
import {
  LayoutDashboard, Calendar, BookOpen, Users, Sparkles, Wallet,
  Building2, LogOut, ChevronRight, Sun, Moon,
} from 'lucide-react'

const navigacija = [
  { id: 'dashboard',   naziv: 'Pregled',       ikona: LayoutDashboard },
  { id: 'kalendar',    naziv: 'Kalendar',      ikona: Calendar },
  { id: 'rezervacije', naziv: 'Rezervacije',   ikona: BookOpen },
  { id: 'gosti',       naziv: 'Gosti',         ikona: Users },
  { id: 'cistacije',   naziv: 'Čistačice Hub', ikona: Sparkles },
  { id: 'finansije',   naziv: 'Finansije',     ikona: Wallet },
]

export default function Sidebar({ aktivnaStrana, setAktivnaStrana, tamniRezim, setTamniRezim }) {
  return (
    <aside className="hidden md:flex w-64 min-h-screen flex-col flex-shrink-0" style={{ backgroundColor: '#0f172a' }}>
      <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#01696f' }}>
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">HostOS</span>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Upravljanje apartmanima</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navigacija.map((stavka) => {
          const Ikona = stavka.ikona
          const aktivan = aktivnaStrana === stavka.id
          return (
            <button
              key={stavka.id}
              onClick={() => setAktivnaStrana(stavka.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={aktivan
                ? { backgroundColor: '#01696f', color: '#fff' }
                : { color: 'rgba(255,255,255,0.5)' }
              }
              onMouseEnter={e => { if (!aktivan) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' } }}
              onMouseLeave={e => { if (!aktivan) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}
            >
              <Ikona size={18} />
              <span className="flex-1 text-left">{stavka.naziv}</span>
              {aktivan && <ChevronRight size={14} className="opacity-60" />}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => setTamniRezim(!tamniRezim)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-1 transition-all"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          {tamniRezim ? <Sun size={18} /> : <Moon size={18} />}
          <span>{tamniRezim ? 'Svetli režim' : 'Tamni režim'}</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2 mt-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#01696f' }}>
            <span className="text-white text-xs font-bold">MS</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Moj Smeštaj</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>vlasnik@gmail.com</p>
          </div>
          <button
            className="text-slate-500 hover:text-white transition-colors"
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
