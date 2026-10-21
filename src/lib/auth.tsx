
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
type User = { id: string; email: string } | null
const AuthContext = createContext<any>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!supabase) {
      const saved = localStorage.getItem('equo_user')
      if (saved) setUser(JSON.parse(saved))
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }: any) => { setUser(data.session?.user ?? null); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, session: any) => { setUser(session?.user ?? null) })
    return () => sub.subscription.unsubscribe()
  }, [])
  const signIn = async (email: string, password: string) => {
    if (!supabase) { const u = { id: 'local', email }; localStorage.setItem('equo_user', JSON.stringify(u)); setUser(u); return { error: null } }
    return await supabase.auth.signInWithPassword({ email, password })
  }
  const signUp = async (email: string, password: string) => {
    if (!supabase) return signIn(email, password)
    return await supabase.auth.signUp({ email, password })
  }
  const signOut = async () => {
    if (!supabase) { localStorage.removeItem('equo_user'); setUser(null); return }
    await supabase.auth.signOut()
  }
  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
