import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [mod, setMod] = useState('login')
  const [forma, setForma] = useState({ email: '', password: '', ime: '' })
  const [greska, setGreska] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [uspeh, setUspeh] = useState(false)

  async function submit() {
    setGreska('')
    if (!forma.email || !forma.password) { setGreska('Popuni sva polja'); return }
    if (mod === 'register' && !forma.ime) { setGreska('Unesi ime'); return }
    setLoading(true)
    const { error } = mod === 'login'
      ? await signIn(forma.email, forma.password)
      : await signUp(forma.email, forma.password, forma.ime)
    if (error) {
      const poruke = {
        'Invalid login credentials': 'Pogrešan email ili lozinka',
        'Email not confirmed': 'Potvrdi email adresu',
        'User already registered': 'Nalog sa ovim emailom već postoji',
      }
      setGreska(poruke[error.message] || error.message)
    } else if (mod === 'register') {
      setUspeh(true)
    }
    setLoading(false)
  }

  if (uspeh) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-xl text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="font-bold text-slate-800 dark:text-white mb-2">Proveri email</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Poslali smo ti link za potvrdu na <strong>{forma.email}</strong>. Klikni na link pa se prijavi.
        </p>
        <button onClick={() => { setUspeh(false); setMod('login') }}
          className="text-sm font-semibold" style={{ color: '#01696f' }}>
          Nazad na prijavu
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#01696f' }}>
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">HostOS</h1>
          <p className="text-sm text-slate-400 mt-1">{mod === 'login' ? 'Prijavi se na nalog' : 'Napravi novi nalog'}</p>
        </div>

        <div className="space-y-3">
          {mod === 'register' && (
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Ime</label>
              <input value={forma.ime} onChange={e => setForma({ ...forma, ime: e.target.value })} placeholder="Npr. Nikola"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-teal-500 bg-transparent dark:text-white" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
            <input type="email" value={forma.email} onChange={e => setForma({ ...forma, email: e.target.value })} placeholder="email@gmail.com"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-teal-500 bg-transparent dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Lozinka</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={forma.password}
                onChange={e => setForma({ ...forma, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-teal-500 bg-transparent dark:text-white" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {greska && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{greska}</p>}
        </div>

        <button onClick={submit} disabled={loading}
          className="w-full mt-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#01696f' }}>
          {loading ? 'Učitavanje...' : mod === 'login' ? 'Prijavi se' : 'Napravi nalog'}
        </button>

        <p className="text-center text-xs text-slate-400 mt-4">
          {mod === 'login' ? 'Nemaš nalog?' : 'Već imaš nalog?'}
          <button onClick={() => { setMod(mod === 'login' ? 'register' : 'login'); setGreska('') }}
            className="font-semibold ml-1" style={{ color: '#01696f' }}>
            {mod === 'login' ? 'Registruj se' : 'Prijavi se'}
          </button>
        </p>
      </div>
    </div>
  )
}
