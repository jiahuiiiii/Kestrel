import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setUnauthenticatedHandler, setAccessToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const applyProfile = useCallback(async (profile, token = null) => {
    if (!profile) {
      setUser(null)
      return
    }

    if (token) setAccessToken(token)

    let telegram = { enabled: false, linked: false, handle: '' }
    try {
      const status = await api.telegram.getTelegramStatus()
      telegram = {
        enabled: status.linked,
        linked: status.linked,
        handle: status.handle ?? '',
      }
    } catch { /* non-fatal */ }

    setUser({
      userId: profile.user_id,
      name: profile.username,
      email: profile.email,
      notifications: { telegram },
    })
  }, [])

  useEffect(() => {
    let active = true
    setUnauthenticatedHandler(() => {
      if (active) {
        setAccessToken(null)
        setUser(null)
      }
    })
    ;(async () => {
      try {
        // On page load we don't have the token — try refresh to get a fresh one
        const refreshed = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (refreshed.ok) {
          const data = await refreshed.json()
          const token = data?.result?.access_token ?? data?.access_token
          if (token && active) setAccessToken(token)
        }
        const me = await api.auth.me()
        if (active) await applyProfile(me)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [applyProfile])

  const signIn = useCallback(async (email, password) => {
    const auth = await api.auth.login(email, password)
    await applyProfile(await api.auth.me(), auth.access_token)
  }, [applyProfile])

  const register = useCallback(async (email, username, password) => {
    const auth = await api.auth.register(email, username, password)
    await applyProfile(await api.auth.me(), auth.access_token)
  }, [applyProfile])

  const signOut = useCallback(async () => {
    try { await api.auth.logout() } catch { }
    setAccessToken(null)
    setUser(null)
  }, [])

  const updateNotifications = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        notifications: { ...prev.notifications, ...patch }
      }
    })
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