import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ naziv, vrednost, promena, ikona: Ikona, boja, prefix = '', suffix = '' }) {
  const pozitivno = promena >= 0

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: boja + '18' }}
        >
          <Ikona size={22} style={{ color: boja }} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${pozitivno ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {pozitivno ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(promena)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-1">
        {prefix}{vrednost}{suffix}
      </p>
      <p className="text-sm text-slate-500">{naziv}</p>
    </div>
  )
}
