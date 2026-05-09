import React from 'react'
import { LayoutDashboard, Calendar, BookOpen, Users, Sparkles, Wallet } from 'lucide-react'

const stavke = [
  { id: 'dashboard',   naziv: 'Pregled',     ikona: LayoutDashboard },
  { id: 'kalendar',    naziv: 'Kalendar',    ikona: Calendar },
  { id: 'rezervacije', naziv: 'Rezervacije', ikona: BookOpen },
  { id: 'gosti',       naziv: 'Gosti',       ikona: Users },
  { id: 'cistacije',   naziv: 'Čistačice',   ikona: Sparkles },
  { id: 'finansije',   naziv: 'Finansije',   ikona: Wallet },
]

export default function BottomNav({ aktivnaStrana, setAktivnaStrana }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex z-30 transition-colors">
      {stavke.map(s => {
        const Ikona = s.ikona
        const aktivan = aktivnaStrana === s.id
        return (
          <button
            key={s.id}
            onClick={() => setAktivnaStrana(s.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
          >
            <Ikona
              size={20}
              style={{ color: aktivan ? '#01696f' : undefined }}
              className={aktivan ? '' : 'text-slate-400 dark:text-slate-500'}
            />
            <span
              className="text-[9px] font-medium leading-tight"
              style={{ color: aktivan ? '#01696f' : undefined, opacity: aktivan ? 1 : 0.5 }}
            >
              {s.naziv}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
