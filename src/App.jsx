import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Kalendar from './pages/Kalendar'
import Rezervacije from './pages/Rezervacije'
import Gosti from './pages/Gosti'
import CistacijeHub from './pages/CistacijeHub'
import Finansije from './pages/Finansije'
import { useIcalSync } from './hooks/useIcalSync'

export default function App() {
  const [aktivnaStrana, setAktivnaStrana] = useState('dashboard')
  const [tamniRezim, setTamniRezim] = useState(false)
  const icalSync = useIcalSync()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tamniRezim)
  }, [tamniRezim])

  const stranice = {
    dashboard:   <Dashboard syncedRez={icalSync.syncedRez} />,
    kalendar:    <Kalendar syncedRez={icalSync.syncedRez} />,
    rezervacije: <Rezervacije syncedRez={icalSync.syncedRez} />,
    gosti:       <Gosti />,
    cistacije:   <CistacijeHub />,
    finansije:   <Finansije />,
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar
        aktivnaStrana={aktivnaStrana}
        setAktivnaStrana={setAktivnaStrana}
        tamniRezim={tamniRezim}
        setTamniRezim={setTamniRezim}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          aktivnaStrana={aktivnaStrana}
          tamniRezim={tamniRezim}
          setTamniRezim={setTamniRezim}
          icalSync={icalSync}
        />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {stranice[aktivnaStrana]}
        </main>
      </div>
      <BottomNav aktivnaStrana={aktivnaStrana} setAktivnaStrana={setAktivnaStrana} />
    </div>
  )
}
