import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user.email)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user.email)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId, email) {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single()

    // Check if this user is a team member (linked by email)
    const { data: member } = await supabase
      .from('team_members')
      .select('vlasnik_id, role')
      .eq('email', email)
      .single()

    if (member) {
      setProfile({ ...prof, role: member.role, ownerId: member.vlasnik_id })
    } else {
      setProfile({ ...prof, role: prof?.role || 'vlasnik', ownerId: userId })
    }
    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password, ime) {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { ime } } })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(data) {
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id)
    if (!error) setProfile(p => ({ ...p, ...data }))
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
