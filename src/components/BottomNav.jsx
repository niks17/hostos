import React from 'react'
import { LayoutDashboard, Calendar, BookOpen, Users, Sparkles, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const SVE_STAVKE = [
  { id: 'dashboard',   naziv: 'Pregled',     ikona: LayoutDashboard, role: ['vlasnik'] },
  { id: 'kalendar',    naziv: 'Kalendar',    ikona: Calendar,        role: ['vlasnik', 'kooperant'] },
  { id: 'rezervacije', naziv: 'Rezervacije', ikona: BookOpen,        role: ['vlasnik', 'kooperant'] },
  { id: 'gosti',       naziv: 'Gosti',       ikona: Users,           role: ['vlasnik', 'kooperant'] },
  { id: 'cistacije',   naziv: 'Čistačice',   ikona: Sparkles,        role: ['vlasnik', 'cistacica'] },
  { id: 'finansije',   naziv: 'Finansije',   ikona: Wallet,          role: ['vlasnik'] },
]

export default function BottomNav({ aktivnaStrana, setAktivnaStrana }) {
  const { profile } = useAuth()
  const role = profile?.role || 'vlasnik'
  const stavke = SVE_STAVKE.filter(s => s.role.includes(role))

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
            <Ikona size={20} style={{ color: aktivan ? '#01696f' : undefined }} className={aktivan ? '' : 'text-slate-400 dark:text-slate-500'} />
            <span className="text-[9px] font-medium leading-tight"
              style={{ color: aktivan ? '#01696f' : undefined, opacity: aktivan ? 1 : 0.5 }}>
              {s.naziv}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
