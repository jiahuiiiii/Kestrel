import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/GlassCard'
import NotificationChannels, { channelsValid } from '../components/NotificationChannels'
import SignedOut from '../components/SignedOut'
import { Skeleton } from '../components/Skeleton'

const EMPTY_PREFS = { telegram: { enabled: false, linked: false, handle: '' } }

function initials(name = '', email = '') {
  const src = name.trim() || email
  const parts = src.split(/[\s@._]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

export default function Account() {
  const { user, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()

  // Hooks run before the auth gates below, so they can't be conditional — seed
  // from EMPTY_PREFS and let the effect fill in once the profile resolves.
  const [prefs, setPrefs] = useState(() => user?.notifications ?? EMPTY_PREFS)

  // Sync when user.notifications changes (e.g. after getTelegramStatus resolves on load)
  useEffect(() => {
    setPrefs(user?.notifications ?? EMPTY_PREFS)
  }, [user?.notifications])

  const valid = channelsValid(prefs)

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Account</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your profile and how Kestrel reaches you.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Profile</h2>
          <GlassCard className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </GlassCard>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Alert channels</h2>
          <GlassCard className="p-4 sm:p-5">
            <Skeleton className="h-20 w-full rounded-xl" />
          </GlassCard>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Session</h2>
          <GlassCard className="p-4 sm:p-5">
            <Skeleton className="h-12 w-full rounded-lg" />
          </GlassCard>
        </section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <SignedOut
          icon="◔"
          title="Sign in to manage your account"
          body="Use the account menu (top right) to sign in or create an account. Your profile and alert channels appear here."
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Account</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and how Kestrel reaches you.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs text-slate-500 uppercase tracking-widest">Profile</h2>
        <GlassCard className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-base sm:text-lg font-bold flex items-center justify-center flex-shrink-0">
            {initials(user.name, user.email)}
          </div>
          <div className="min-w-0">
            <p className="text-base font-medium text-white capitalize truncate">{user.name}</p>
            <p className="text-sm text-slate-500 truncate">{user.email}</p>
          </div>
        </GlassCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs text-slate-500 uppercase tracking-widest">Alert channels</h2>
        <GlassCard className="p-4 sm:p-5">
          <NotificationChannels prefs={prefs} onChange={setPrefs} />

          {!valid && (
            <p className="text-xs text-amber-400 px-1 mt-3">Enable at least one valid channel to receive alerts.</p>
          )}
          
        </GlassCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs text-slate-500 uppercase tracking-widest">Session</h2>
        <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-white">Sign out of Kestrel</p>
            <p className="text-xs text-slate-500 mt-0.5">You&apos;ll need to sign in again to manage theses.</p>
          </div>
          <button
            onClick={() => { signOut(); navigate('/') }}
            className="w-full sm:w-auto flex-shrink-0 px-4 py-2 rounded-lg border border-rose-400/25 text-rose-300 text-sm hover:bg-rose-400/10 transition-colors"
          >
            Sign out
          </button>
        </GlassCard>
      </section>
    </div>
  )
}
