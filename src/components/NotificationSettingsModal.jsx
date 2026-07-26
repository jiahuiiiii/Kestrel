import { useState, useEffect } from 'react'
import Modal from './Modal'
import NotificationChannels, { channelsValid } from './NotificationChannels'
import { useAuth } from '../context/AuthContext'

const DEFAULT_PREFS = {
  telegram: { enabled: false, linked: false, handle: '' },
}

export default function NotificationSettingsModal({ open, onClose }) {
  const { user, updateNotifications } = useAuth()
  const [prefs, setPrefs] = useState(
    () => user?.notifications ?? DEFAULT_PREFS
  )

  // Sync when user.notifications changes externally (e.g. WS telegram_linked event)
  useEffect(() => {
    if (user?.notifications) setPrefs(user.notifications)
  }, [user?.notifications])

  const valid = prefs.telegram.enabled && prefs.telegram.linked
  const noChannel = !prefs.telegram.enabled

  const save = () => {
    if (!valid) return
    updateNotifications(prefs)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notification settings"
      subtitle="Choose how Kestrel alerts you when a thesis fires."
      maxWidth="max-w-lg"
    >
      <NotificationChannels prefs={prefs} onChange={setPrefs} />

      {noChannel && (
        <p className="text-xs text-amber-400 px-1 mt-3">Enable at least one channel to receive alerts.</p>
      )}

      <div className="flex gap-2 pt-4">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!valid}
          className="flex-1 py-2.5 rounded-lg bg-emerald-400 text-slate-900 text-sm font-semibold hover:bg-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save preferences
        </button>
      </div>
    </Modal>
  )
}