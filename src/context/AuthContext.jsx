import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'kestrel_user'

// Demo-grade auth: persisted to localStorage, no backend.
// Swap signIn/updateNotifications for real API calls when the backend lands.
const DEFAULT_NOTIFICATIONS = {
  email:    { enabled: true,  address: '' },
  telegram: { enabled: false, linked: false, handle: '' },
}

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const signIn = useCallback(({ name, email }) => {
    setUser((prev) => ({
      name,
      email,
      notifications: prev?.notifications ?? {
        ...DEFAULT_NOTIFICATIONS,
        email: { enabled: true, address: email },
      },
    }))
  }, [])

  const signOut = useCallback(() => setUser(null), [])

  const updateNotifications = useCallback((notifications) => {
    setUser((prev) => (prev ? { ...prev, notifications } : prev))
  }, [])

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateNotifications }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
