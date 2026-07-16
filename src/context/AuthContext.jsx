import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setUnauthenticatedHandler } from '../api/client'

const AuthContext = createContext(null)

// Notification prefs aren't part of the backend user profile yet, so we keep
// them client-side (localStorage) layered on top of the real account.
const NOTIF_KEY = 'kestrel_notifications'

const defaultNotifications = (email) => ({
  email: { enabled: true, address: email || '' },
  telegram: { enabled: false, linked: false, handle: '' },
})

function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while bootstrapping the session

  const applyProfile = useCallback((profile) => {
    if (!profile) {
      setUser(null)
      return
    }
    setUser({
      userId: profile.user_id,
      name: profile.username,
      email: profile.email,
      notifications: loadNotifications() || defaultNotifications(profile.email),
    })
  }, [])

  // On load, try to restore the session from the cookie (client auto-refreshes).
  useEffect(() => {
    let active = true
    setUnauthenticatedHandler(() => active && setUser(null))
    ;(async () => {
      try {
        const me = await api.auth.me()
        if (active) applyProfile(me)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [applyProfile])

  const signIn = useCallback(async (email, password) => {
    await api.auth.login(email, password)
    applyProfile(await api.auth.me())
  }, [applyProfile])

  const register = useCallback(async (email, username, password) => {
    await api.auth.register(email, username, password)
    applyProfile(await api.auth.me())
  }, [applyProfile])

  const signOut = useCallback(async () => {
    try { await api.auth.logout() } catch { /* clear locally regardless */ }
    setUser(null)
  }, [])

  const updateNotifications = useCallback((notifications) => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications))
    setUser((prev) => (prev ? { ...prev, notifications } : prev))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut, updateNotifications }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
