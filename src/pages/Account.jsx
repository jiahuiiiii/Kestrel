import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/GlassCard'
import NotificationChannels, { channelsValid } from '../components/NotificationChannels'

function initials(name = '', email = '') {
  const src = name.trim() || email
  const parts = src.split(/[\s@._]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

// Placeholder shown when signed out, so the layout is visible without an account.
const DEMO_USER = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  notifications: {
    email: { enabled: true, address: 'john.doe@example.com' },
    telegram: { enabled: true, linked: true, handle: 'johndoe' },
  },
}

export default function Account() {
  const { user, signOut, updateNotifications } = useAuth()
  const navigate = useNavigate()

  const isDemo = !user
  const displayUser = user ?? DEMO_USER

  const [prefs, setPrefs] = useState(() => displayUser.notifications)
  const [saved, setSaved] = useState(false)

  const dirty = JSON.stringify(prefs) !== JSON.stringify(displayUser.notifications)
  const valid = channelsValid(prefs)

  const save = () => {
    if (!valid) return
    if (!isDemo) updateNotifications(prefs)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Account</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and how Kestrel reaches you.</p>
      </div>

      {/* Preview banner (signed out) */}
      {isDemo && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 flex items-start gap-3">
          <span className="text-amber-400 text-sm mt-0.5">◔</span>
          <div className="text-sm">
            <span className="text-amber-300 font-medium">Preview — demo data.</span>{' '}
            <span className="text-amber-200/70">
              You&apos;re signed out, so this shows a sample account. Sign in from the top-right to
              manage your own profile and alert channels.
            </span>
          </div>
        </div>
      )}

      {/* Profile */}
      <section className="space-y-3">
        <h2 className="text-xs text-slate-500 uppercase tracking-widest">Profile</h2>
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-lg font-bold flex items-center justify-center flex-shrink-0">
            {initials(displayUser.name, displayUser.email)}
          </div>
          <div className="min-w-0">
            <p className="text-base font-medium text-white capitalize truncate">{displayUser.name}</p>
            <p className="text-sm text-slate-500 truncate">{displayUser.email}</p>
          </div>
        </GlassCard>
      </section>

      {/* Notifications */}
      <section className="space-y-3">
        <h2 className="text-xs text-slate-500 uppercase tracking-widest">Alert channels</h2>
        <GlassCard className="p-5">
          <NotificationChannels prefs={prefs} onChange={setPrefs} startCodeSeed={displayUser.email} />

          {!valid && (
            <p className="text-xs text-amber-400 px-1 mt-3">Enable at least one valid channel to receive alerts.</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-white/[0.06]">
            {saved && <span className="text-xs text-emerald-400">Saved ✓{isDemo ? ' (preview)' : ''}</span>}
            <button
              onClick={save}
              disabled={!dirty || !valid}
              className="px-4 py-2 rounded-lg bg-emerald-400 text-slate-900 text-sm font-semibold hover:bg-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save changes
            </button>
          </div>
        </GlassCard>
      </section>

      {/* Session */}
      <section className="space-y-3">
        <h2 className="text-xs text-slate-500 uppercase tracking-widest">Session</h2>
        {isDemo ? (
          <GlassCard className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Not signed in</p>
              <p className="text-xs text-slate-500 mt-0.5">Sign in to save changes to a real account.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-emerald-400 text-slate-900 text-sm font-semibold hover:bg-emerald-300 transition-colors"
            >
              Go to dashboard
            </button>
          </GlassCard>
        ) : (
          <GlassCard className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Sign out of Kestrel</p>
              <p className="text-xs text-slate-500 mt-0.5">You&apos;ll need to sign in again to manage theses.</p>
            </div>
            <button
              onClick={() => { signOut(); navigate('/') }}
              className="px-4 py-2 rounded-lg border border-rose-400/25 text-rose-300 text-sm hover:bg-rose-400/10 transition-colors"
            >
              Sign out
            </button>
          </GlassCard>
        )}
      </section>
    </div>
  )
}
