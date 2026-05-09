import React from 'react'
import { TrendingUp, Home, Users, CalendarCheck, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { apartmani, rezervacije, mesecniPodaci } from '../data/mockData'

function KpiKartica({ naziv, vrednost, promena, ikona: Ikona, boja }) {
  const pozitivna = promena >= 0
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: boja + '20' }}>
          <Ikona size={20} style={{ color: boja }} />
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-medium ${pozitivna ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
          {pozitivna ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(promena)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{vrednost}</p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{naziv}</p>
    </div>
  )
}

const statusBoje = {
  potvrdjeno: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  zavrseno:   'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  cekanje:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  otkazano:   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}
const statusNaziv = { potvrdjeno: 'Potvrđeno', zavrseno: 'Završeno', cekanje: 'Na čekanju', otkazano: 'Otkazano' }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: €{p.value.toLocaleString()}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const aktivneRez = rezervacije.filter(r => r.status === 'potvrdjeno').length
  const zadnjiMesec = mesecniPodaci[mesecniPodaci.length - 1]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiKartica naziv="Mesečni prihod" vrednost={`€${zadnjiMesec.prihod.toLocaleString()}`} promena={12} ikona={TrendingUp} boja="#01696f" />
        <KpiKartica naziv="Aktivne rezervacije" vrednost={aktivneRez} promena={5} ikona={CalendarCheck} boja="#8b5cf6" />
        <KpiKartica naziv="Apartmani" vrednost={apartmani.length} promena={0} ikona={Home} boja="#f59e0b" />
        <KpiKartica naziv="Popunjenost" vrednost="74%" promena={-3} ikona={Users} boja="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-white">Prihodi vs Troškovi</h2>
            <span className="text-xs text-slate-400">Poslednjih 6 meseci</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mesecniPodaci} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="mesec" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} tickFormatter={v => `€${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="prihod" name="Prihod" fill="#01696f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="troskovi" name="Troškovi" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Moji apartmani</h2>
          <div className="space-y-3">
            {apartmani.map(a => {
              const zauzet = rezervacije.some(r => r.apartmanId === a.id && r.status === 'potvrdjeno')
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.boja + '20' }}>
                    <Home size={16} style={{ color: a.boja }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{a.naziv}</p>
                    <p className="text-xs text-slate-400 truncate">{a.lokacija}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${zauzet ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {zauzet ? 'Zauzeto' : 'Slobodno'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Nadolazeće rezervacije</h2>
          <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#01696f' }}>
            <Plus size={14} /> Nova
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {rezervacije.filter(r => r.status === 'potvrdjeno').slice(0, 5).map(r => {
            const apt = apartmani.find(a => a.id === r.apartmanId)
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: apt?.boja + '20' }}>
                  <Home size={16} style={{ color: apt?.boja }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{r.gost}</p>
                  <p className="text-xs text-slate-400">{apt?.naziv} · {r.dolazak} → {r.odlazak}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">€{r.cena}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBoje[r.status]}`}>
                    {statusNaziv[r.status]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
