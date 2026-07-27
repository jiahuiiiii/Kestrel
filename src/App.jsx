import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useWs } from './hooks/useWs'
import { api } from './api/client'
import { pendingProposalCount, adaptAlert } from './api/adapt'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import ThesisDetail from './pages/ThesisDetail'
import Proposals from './pages/Proposals'
import Account from './pages/Account'
import Notification from './pages/Notification'

function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-indigo-500/[0.05] rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-sky-500/[0.04] rounded-full blur-3xl" />
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────

function AlertToast({ alert, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="glass-strong rounded-xl p-4 border border-emerald-400/20 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center flex-shrink-0 text-sm">
            🔔
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              {alert.ticker || 'Alert'} — Signal fired
            </p>
            {alert.reason && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{alert.reason}</p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-600 hover:text-slate-300 transition-colors text-lg leading-none flex-shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shell ──────────────────────────────────────────────────────────────────

function Shell() {
  const { user, updateNotifications } = useAuth()
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [toast, setToast] = useState(null) // alert object | null
  const dismissToast = useCallback(() => setToast(null), [])

  // Initialise unread count from localStorage on sign-in
  useEffect(() => {
    if (!user) { setUnreadAlerts(0); return }
    const lastSeen = parseInt(localStorage.getItem('kestrel_alerts_last_seen') || '0', 10)
    // We don't have a "count since timestamp" endpoint, so start at 0 and let
    // WS events increment it. The badge only needs to count this session's alerts.
    setUnreadAlerts(0)
    void lastSeen // suppress lint — kept for future use with a count endpoint
  }, [user])

  // Clear unread when user navigates to /notification
  useEffect(() => {
    if (location.pathname === '/notification') {
      setUnreadAlerts(0)
      localStorage.setItem('kestrel_alerts_last_seen', Date.now().toString())
    }
  }, [location.pathname])

  useEffect(() => {
    if (!user) { setPendingCount(0); return }
    let active = true
    api.proposals.all()
      .then((data) => active && setPendingCount(pendingProposalCount(data)))
      .catch(() => active && setPendingCount(0))
    return () => { active = false }
  }, [user])

  useWs((event) => {
    if (event.type === 'TELEGRAM_LINKED') {
      updateNotifications({
        telegram: {
          enabled: true,
          linked: true,
          handle: event.payload?.handle ?? '',
        }
      })
    }

    if (event.type === 'TELEGRAM_UNLINKED') {
      updateNotifications({
        telegram: {
          enabled: false,
          linked: false,
          handle: '',
        }
      })
    }

    if (event.type === 'ALERT') {
      const alert = adaptAlert(event.payload || {})
      // Increment badge only when not already on the notifications page
      if (location.pathname !== '/notification') {
        setUnreadAlerts((n) => n + 1)
        setToast(alert)
      }
    }
  }, !!user)

  return (
    <>
      <Background />
      <NavBar pendingCount={pendingCount} unreadAlerts={unreadAlerts} />
      <main className="min-h-screen pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/thesis/:id" element={<ThesisDetail />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </main>
      {toast && <AlertToast alert={toast} onDismiss={dismissToast} />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  )
}
