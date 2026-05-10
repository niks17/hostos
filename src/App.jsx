import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginScreen from './components/LoginScreen'
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
import { supabase, mapApartman } from './lib/supabase'

function defaultPage(role) {
  if (role === 'cistacica') return 'cistacije'
  if (role === 'kooperant') return 'kalendar'
  return 'dashboard'
}

function AppInner() {
  const { user, profile, loading } = useAuth()
  const [aktivnaStrana, setAktivnaStrana] = useState('dashboard')
  const [tamniRezim, setTamniRezim] = useState(false)
  const [apartmani, setApartmani] = useState([])
  const icalSync = useIcalSync()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tamniRezim)
  }, [tamniRezim])

  useEffect(() => {
    if (user) loadApartmani()
  }, [user])

  useEffect(() => {
    if (profile?.role) setAktivnaStrana(defaultPage(profile.role))
  }, [profile?.role])

  async function loadApartmani() {
    const { data } = await supabase.from('apartmani').select('*').order('created_at')
    if (data) setApartmani(data.map(mapApartman))
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <LoginScreen />

  const stranice = {
    dashboard:   <Dashboard syncedRez={icalSync.syncedRez} apartmani={apartmani} onApartmaniChange={loadApartmani} onNavigate={setAktivnaStrana} />,
    kalendar:    <Kalendar syncedRez={icalSync.syncedRez} apartmani={apartmani} />,
    rezervacije: <Rezervacije syncedRez={icalSync.syncedRez} apartmani={apartmani} />,
    gosti:       <Gosti />,
    cistacije:   <CistacijeHub apartmani={apartmani} />,
    finansije:   <Finansije apartmani={apartmani} />,
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
          apartmani={apartmani}
          onApartmaniChange={loadApartmani}
        />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div key={aktivnaStrana} className="animate-slide-up min-h-full">
            {stranice[aktivnaStrana]}
          </div>
        </main>
      </div>
      <BottomNav aktivnaStrana={aktivnaStrana} setAktivnaStrana={setAktivnaStrana} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
