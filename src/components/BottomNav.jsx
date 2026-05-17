import React from 'react'
import { LayoutDashboard, Calendar, BookOpen, Sparkles, Wallet, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const SVE_STAVKE = [
  { id: 'dashboard',   naziv: 'Pregled',     ikona: LayoutDashboard, role: ['vlasnik'] },
  { id: 'rezervacije', naziv: 'Rezervacije', ikona: BookOpen,        role: ['vlasnik', 'kooperant'] },
  { id: 'problemi',    naziv: 'Problemi',    ikona: AlertTriangle,   role: ['vlasnik'], badge: true },
  { id: 'cistacije',   naziv: 'Čistačice',   ikona: Sparkles,        role: ['vlasnik', 'cistacica'] },
  { id: 'finansije',   naziv: 'Finansije',   ikona: Wallet,          role: ['vlasnik'] },
]

export default function BottomNav({ aktivnaStrana, setAktivnaStrana, problemCount = 0 }) {
  const { profile } = useAuth()
  const role   = profile?.role || 'vlasnik'
  const stavke = SVE_STAVKE.filter(s => s.role.includes(role))

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30
      bg-white/90 dark:bg-slate-900/90
      backdrop-blur-modal
      border-t border-slate-200/80 dark:border-slate-700/80
      bottom-nav"
    >
      <div className="flex">
        {stavke.map(s => {
          const Ikona   = s.ikona
          const aktivan = aktivnaStrana === s.id

          return (
            <button
              key={s.id}
              onClick={() => setAktivnaStrana(s.id)}
              className="flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-1 relative
                transition-transform duration-100 active:scale-90"
            >
              {/* Active pill indicator */}
              <div className={`
                absolute top-0 left-1/2 -translate-x-1/2
                h-0.5 w-8 rounded-full transition-all duration-300
                ${aktivan ? 'opacity-100' : 'opacity-0 w-0'}
              `} style={{ backgroundColor: '#01696f' }} />

              {/* Icon container */}
              <div className={`
                relative w-10 h-7 rounded-xl flex items-center justify-center
                transition-all duration-200
                ${aktivan
                  ? 'bg-teal-600/10 dark:bg-teal-600/20'
                  : 'bg-transparent'
                }
              `}>
                <Ikona
                  size={20}
                  strokeWidth={aktivan ? 2.2 : 1.8}
                  style={{ color: aktivan ? '#01696f' : s.badge && problemCount > 0 ? '#ef4444' : undefined }}
                  className={aktivan || (s.badge && problemCount > 0) ? '' : 'text-slate-400 dark:text-slate-500'}
                />
                {/* Red badge */}
                {s.badge && problemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black text-white bg-red-500 flex items-center justify-center">
                    {problemCount > 9 ? '9+' : problemCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-semibold leading-none transition-all duration-200 ${
                  aktivan
                    ? 'opacity-100'
                    : 'opacity-40 dark:opacity-30'
                }`}
                style={{ color: aktivan ? '#01696f' : undefined }}
              >
                {s.naziv}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
