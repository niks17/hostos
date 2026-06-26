import React, { useState } from 'react'
import { ExternalLink } from 'lucide-react'

// Vodič „odakle da uzmem iCal link" — Booking i Airbnb.
// Čisto edukativna komponenta (bez logike snimanja) → koristi se i u
// onboarding-u i u Podešavanja → iCal.
const VODICI = {
  booking: {
    naziv:  'Booking.com',
    url:    'https://admin.booking.com',
    primer: 'https://ical.booking.com/v1/export?t=...',
    koraci: [
      'Uloguj se na Extranet (admin.booking.com)',
      'Otvori „Rates & Availability" → „Sync calendars"',
      'Pod „Export calendar" klikni da kopiraš link',
      'Nalepi link u polje ispod',
    ],
  },
  airbnb: {
    naziv:  'Airbnb',
    url:    'https://www.airbnb.com/hosting/listings',
    primer: 'https://www.airbnb.com/calendar/ical/12345.ics?s=...',
    koraci: [
      'Airbnb → „Listings" → izaberi apartman',
      'Otvori karticu „Availability" (Dostupnost)',
      '„Connect to another website" → „Export calendar"',
      'Kopiraj link i nalepi u polje ispod',
    ],
  },
}

export default function IcalGuide() {
  const [tab, setTab] = useState('booking')
  const v = VODICI[tab]

  return (
    <div>
      {/* Tabovi */}
      <div className="flex gap-2 mb-3">
        {Object.entries(VODICI).map(([key, val]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === key
                ? 'text-white bg-teal-600'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {val.naziv}
          </button>
        ))}
      </div>

      {/* Koraci */}
      <ol className="space-y-2 mb-3">
        {v.koraci.map((k, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black text-[10px]">
              {i + 1}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{k}</span>
          </li>
        ))}
      </ol>

      {/* Kako link izgleda */}
      <p className="text-[10px] text-slate-400 mb-1">Link izgleda ovako:</p>
      <code className="block text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2.5 py-1.5 break-all mb-3">
        {v.primer}
      </code>

      <a
        href={v.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:underline"
      >
        Otvori {v.naziv} <ExternalLink size={12} aria-hidden="true" />
      </a>
    </div>
  )
}
