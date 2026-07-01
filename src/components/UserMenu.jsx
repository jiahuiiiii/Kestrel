import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SignInModal from './SignInModal'
import NotificationSettingsModal from './NotificationSettingsModal'
import SettingsRoundedIcon from '@iconify-react/material-symbols/settings-rounded';
import BellBoldIcon from '@iconify-react/solar/bell-bold';
import ExitFillIcon from '@iconify-react/mingcute/exit-fill';

function initials(name = '', email = '') {
  const src = name.trim() || email
  const parts = src.split(/[\s@._]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

function channelSummary(n) {
  if (!n) return 'No alerts configured'
  const on = []
  if (n.email?.enabled) on.push('Email')
  if (n.telegram?.enabled) on.push('Telegram')
  return on.length ? `Alerts via ${on.join(' + ')}` : 'No channels enabled'
}

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signInOpen, setSignInOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) {
    return (
      <>
        <button
          onClick={() => setSignInOpen(true)}
          className="px-4 py-1.5 rounded-lg bg-emerald-400 text-slate-900 text-sm font-semibold hover:bg-emerald-300 transition-colors"
        >
          Sign in
        </button>
        <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      </>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="w-12 h-12 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-lg font-bold flex items-center justify-center hover:bg-emerald-400/25 transition-colors"
        aria-label="Account menu"
      >
        {initials(user.name, user.email)}
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-64 p-2 rounded-xl border border-white/10 bg-[#0d1424]/98 backdrop-blur-xl shadow-2xl shadow-black/50">
          {/* identity */}
          <div className="px-3 py-2.5 border-b border-white/[0.06] mb-1">
            <p className="text-sm font-medium text-white truncate capitalize">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <p className="text-xs text-emerald-400/80 mt-1.5">{channelSummary(user.notifications)}</p>
          </div>

          <button
            onClick={() => { navigate('/account'); setMenuOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/[0.06] transition-colors text-left"
          >
            <SettingsRoundedIcon className="text-slate-500 h-5 w-5" /> Account
          </button>
          <button
            onClick={() => { setSettingsOpen(true); setMenuOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/[0.06] transition-colors text-left"
          >
            <BellBoldIcon className="text-slate-500 h-5 w-5" /> Notification settings
          </button>
          <button
            onClick={() => { signOut(); setMenuOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/[0.06] transition-colors text-left"
          >
            <ExitFillIcon className="text-slate-500 h-5 w-5" /> Sign out
          </button>
        </div>
      )}

      <NotificationSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
