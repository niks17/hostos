import React, { useState } from 'react'
import { Bell, X, ChevronRight, CheckCheck } from 'lucide-react'
import { useSmartNotifications } from '../hooks/useSmartNotifications'
import { useAuth } from '../context/AuthContext'

const PRIORITET_CONFIG = {
  critical: { label: 'Kritično', dot: 'bg-red-500',    ring: 'ring-red-200 dark:ring-red-900',    bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-200 dark:border-red-800',    text: 'text-red-700 dark:text-red-300'    },
  high:     { label: 'Važno',    dot: 'bg-amber-500',  ring: 'ring-amber-200 dark:ring-amber-900', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
  medium:   { label: 'Info',     dot: 'bg-blue-400',   ring: 'ring-blue-200 dark:ring-blue-900',   bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-800',   text: 'text-blue-700 dark:text-blue-300'   },
}

const AKCIJA_NAZIV = {
  dashboard:    'Pregled',
  rezervacije:  'Rezervacije',
  cistacije:    'Čistačice',
  podesavanja:  'Podešavanja',
}

export default function NotificationBell({ apartmani = [], onNavigate }) {
  const { user } = useAuth()
  const { notifications, refresh, requestBrowserPermission } = useSmartNotifications({ apartmani, userId: user?.id })
  const [open, setOpen]             = useState(false)
  const [dismissed, setDismissed]   = useState(new Set())
  const [pushEnabled, setPushEnabled] = useState(
    typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )

  const visible   = notifications.filter(n => !dismissed.has(n.id))
  const count     = visible.length
  const hasCrit   = visible.some(n => n.prioritet === 'critical')

  function dismiss(id) {
    setDismissed(prev => new Set([...prev, id]))
  }
  function dismissAll() {
    setDismissed(new Set(notifications.map(n => n.id)))
    setOpen(false)
  }

  async function enablePush() {
    const granted = await requestBrowserPermission()
    setPushEnabled(granted)
  }

  function handleAkcija(n) {
    if (n.akcija && onNavigate) onNavigate(n.akcija)
    setOpen(false)
  }

  return (
    <div className="relative">
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          relative p-2 rounded-xl transition-all duration-150 active:scale-90
          ${open
            ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
          }
        `}
      >
        <Bell size={19} className={count > 0 ? (hasCrit ? 'text-red-500' : 'text-amber-500') : ''} />

        {/* Badge */}
        {count > 0 && (
          <span className={`
            absolute -top-0.5 -right-0.5
            min-w-[18px] h-[18px] px-1
            rounded-full text-[10px] font-black text-white
            flex items-center justify-center
            ${hasCrit ? 'bg-red-500 animate-bounce' : 'bg-amber-500'}
          `}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="
            absolute right-0 top-full mt-2 z-50
            w-[340px] max-w-[calc(100vw-24px)]
            bg-white dark:bg-slate-800
            rounded-2xl border border-slate-200 dark:border-slate-700
            shadow-modal animate-slide-up overflow-hidden
          ">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-slate-500 dark:text-slate-400" />
                <span className="font-bold text-sm text-slate-800 dark:text-white">Obaveštenja</span>
                {count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full text-white ${hasCrit ? 'bg-red-500' : 'bg-amber-500'}`}>
                    {count}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button
                    onClick={dismissAll}
                    className="text-xs font-semibold text-slate-400 hover:text-teal-600 transition-colors flex items-center gap-1"
                  >
                    <CheckCheck size={13} /> Sve pročitano
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[420px] overflow-y-auto">
              {visible.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sve je u redu!</p>
                  <p className="text-xs text-slate-400 mt-1">Nema aktivnih upozorenja</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {visible.map(n => {
                    const pc = PRIORITET_CONFIG[n.prioritet]
                    return (
                      <div
                        key={n.id}
                        className={`px-4 py-3 ${pc.bg} border-l-2 ${pc.border} animate-fade-in group`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Emoji icon */}
                          <span className="text-lg leading-none mt-0.5 flex-shrink-0">{n.ikona}</span>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-black uppercase tracking-wide ${pc.text}`}>
                                {pc.label}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">
                              {n.naslov}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {n.poruka}
                            </p>

                            {/* Action button */}
                            {n.akcija && onNavigate && (
                              <button
                                onClick={() => handleAkcija(n)}
                                className={`mt-2 text-xs font-bold flex items-center gap-1 ${pc.text} hover:underline`}
                              >
                                Idi na {AKCIJA_NAZIV[n.akcija] || n.akcija}
                                <ChevronRight size={11} />
                              </button>
                            )}
                          </div>

                          {/* Dismiss */}
                          <button
                            onClick={() => dismiss(n.id)}
                            className="flex-shrink-0 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer — push notification opt-in */}
            {!pushEnabled && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Browser obaveštenja</p>
                    <p className="text-[11px] text-slate-400">Primaj notifikacije čak i kada app nije otvorena</p>
                  </div>
                  <button
                    onClick={enablePush}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-white rounded-lg active:scale-95 transition-all"
                    style={{ backgroundColor: '#01696f' }}
                  >
                    Uključi
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
