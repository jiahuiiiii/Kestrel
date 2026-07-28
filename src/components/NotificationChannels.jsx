import { useState, useEffect } from 'react'
import { api } from "../api/client"

const BOT_HANDLE = 'KestrelFinanceBot'

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        on ? 'bg-emerald-400' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-4' : ''
        }`}
      />
    </button>
  )
}

function ChannelCard({ icon, title, desc, enabled, onToggle, children }) {
  return (
    <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${
      enabled ? 'border-emerald-400/25 bg-emerald-400/[0.04]' : 'border-white/[0.07] bg-white/[0.02]'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${
          enabled ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/[0.05] text-slate-400'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-white min-w-0 truncate">{title}</span>
            <Toggle on={enabled} onChange={onToggle} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      {/* The 3rem indent aligns children under the title on desktop; on a phone
          it just steals width from the linking code, so drop it below `sm`. */}
      {enabled && children && <div className="mt-4 pl-0 sm:pl-12">{children}</div>}
    </div>
  )
}

export default function NotificationChannels({ prefs, onChange }) {
  const [linkData, setLinkData] = useState(null)
  const [loadingLink, setLoadingLink] = useState(false)
  const [linkError, setLinkError] = useState(null)

  const setTelegram = (patch) => onChange({ ...prefs, telegram: { ...prefs.telegram, ...patch } })

  // Fetch token once when enabled and not yet linked
  useEffect(() => {
    if (!prefs.telegram.enabled || prefs.telegram.linked) {
      setLinkData(null)
      return
    }

    let cancelled = false
    setLoadingLink(true)
    setLinkError(null)

    api.telegram.connect()
      .then((result) => {
        if (!cancelled) setLinkData(result)
      })
      .catch(() => {
        if (!cancelled) setLinkError('Failed to generate linking code. Try again.')
      })
      .finally(() => {
        if (!cancelled) setLoadingLink(false)
      })

    return () => { cancelled = true }
  }, [prefs.telegram.enabled, prefs.telegram.linked])

  const handleUnlink = async () => {
    try {
      await api.telegram.disconnect()
    } catch { /* non-fatal — WS will update state if it succeeded */ }
  }

  const openTelegram = () => {
    if (linkData?.unique_link) {
      window.open(linkData.unique_link, '_blank', 'noopener')
    }
  }

  return (
    <div className="space-y-3">
      {/* Email
      <ChannelCard
        icon="✉"
        title="Email"
        desc="Reliable baseline — works everywhere, permanent record."
        enabled={prefs.email.enabled}
        onToggle={(v) => setEmail({ enabled: v })}
      >
        <label className="block">
          <span className="text-xs text-slate-500 mb-1.5 block">Deliver alerts to</span>
          <input
            type="email"
            value={prefs.email.address}
            onChange={(e) => setEmail({ address: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/40 transition-colors"
          />
        </label>
        {emailInvalid && <p className="text-xs text-rose-400 mt-1.5">Enter a valid email address.</p>}
      </ChannelCard> */}

      {/* Telegram */}
      <ChannelCard
        icon="✈"
        title="Telegram"
        desc="Instant mobile push — free, works on iOS."
        enabled={prefs.telegram.enabled}
        onToggle={(v) => setTelegram({ enabled: v })}
      >
        {prefs.telegram.linked ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg bg-emerald-400/[0.06] border border-emerald-400/20 px-3 py-2.5">
            <span className="text-sm text-emerald-300 flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="truncate">Linked{prefs.telegram.handle ? ` as @${prefs.telegram.handle}` : ''}</span>
            </span>
            <button
              onClick={handleUnlink}
              className="text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0"
            >
              Unlink
            </button>
          </div>
        ) : loadingLink ? (
          <p className="text-xs text-slate-500">Generating linking code…</p>
        ) : linkError ? (
          <p className="text-xs text-rose-400">{linkError}</p>
        ) : linkData ? (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500 leading-relaxed">
              Open the bot <span className="text-slate-300">@{BOT_HANDLE}</span> and send{' '}
              <code className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded break-all">
                /authorize {linkData.token}
              </code>
              . Code expires in {Math.floor(linkData.expires_in_seconds / 60)} minutes.
            </p>
            <button
              onClick={openTelegram}
              className="w-full py-2 rounded-lg bg-sky-500/15 border border-sky-400/25 text-sky-300 text-sm font-medium hover:bg-sky-500/25 transition-colors"
            >
              Open Telegram
            </button>
            <p className="text-xs text-slate-600">
              Waiting for confirmation — send the command above and this will update automatically.
            </p>
          </div>
        ) : null}
      </ChannelCard>

      <p className="text-xs text-slate-600 px-1">
        In-app alerts stream live over WebSocket whenever the dashboard is open — always on.
      </p>
    </div>
  )
}

export function channelsValid(prefs) {
  return prefs.telegram.enabled && prefs.telegram.linked
}