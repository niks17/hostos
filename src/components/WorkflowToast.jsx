import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, SkipForward, Zap, X } from 'lucide-react'

const AUTO_CLOSE_MS = 7000

export default function WorkflowToast({ results, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, AUTO_CLOSE_MS)
    return () => clearTimeout(t)
  }, [])

  if (!results?.length) return null

  const ok      = results.filter(r => r.success && !r.skipped).length
  const failed  = results.filter(r => !r.success).length

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-[70] w-[300px] animate-slide-up">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-modal border border-slate-100 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700"
          style={{ background: 'linear-gradient(135deg, #01696f14, #01696f06)' }}
        >
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: '#01696f' }} />
            <span className="text-sm font-bold text-slate-800 dark:text-white">Auto workflow</span>
            {ok > 0 && (
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: '#01696f' }}
              >
                {ok}
              </span>
            )}
            {failed > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white bg-red-500">
                {failed} greška
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors active:scale-90"
          >
            <X size={14} />
          </button>
        </div>

        {/* Result rows */}
        <div className="px-4 py-3 space-y-2.5">
          {results.map((r, i) => (
            <div
              key={r.id}
              className="flex items-start gap-2.5 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Status icon */}
              <div className="flex-shrink-0 mt-0.5">
                {r.skipped ? (
                  <SkipForward size={13} className="text-slate-300 dark:text-slate-600" />
                ) : r.success ? (
                  <CheckCircle2 size={13} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={13} className="text-red-400" />
                )}
              </div>

              {/* Emoji */}
              <span className="text-base leading-none flex-shrink-0">{r.ikona}</span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-tight ${
                  r.skipped   ? 'text-slate-400 dark:text-slate-500'  :
                  r.success   ? 'text-slate-700 dark:text-slate-200'  :
                                'text-red-500'
                }`}>
                  {r.naziv}
                </p>
                {(r.info || r.error) && (
                  <p className={`text-[11px] mt-0.5 leading-tight ${r.error ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {r.error || r.info}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-[3px] bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full workflow-toast-progress"
            style={{ backgroundColor: '#01696f' }}
          />
        </div>
      </div>
    </div>
  )
}
