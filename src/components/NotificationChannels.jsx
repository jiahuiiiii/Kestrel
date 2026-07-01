const BOT_HANDLE = 'KestrelAlertBot'

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
    <div className={`rounded-xl border p-4 transition-colors ${
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
            <span className="text-sm font-medium text-white">{title}</span>
            <Toggle on={enabled} onChange={onToggle} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      {enabled && children && <div className="mt-4 pl-12">{children}</div>}
    </div>
  )
}

// Shared notification-channel editor used by both the settings modal and the
// account page. Controlled: parent owns `prefs`, receives updates via onChange.
export default function NotificationChannels({ prefs, onChange, startCodeSeed = '' }) {
  const setEmail = (patch) => onChange({ ...prefs, email: { ...prefs.email, ...patch } })
  const setTelegram = (patch) => onChange({ ...prefs, telegram: { ...prefs.telegram, ...patch } })

  const startCode = 'kx-' + (startCodeSeed ? btoa(startCodeSeed).slice(0, 8).toLowerCase() : 'demo1234')
  const openTelegram = () =>
    window.open(`https://t.me/${BOT_HANDLE}?start=${startCode}`, '_blank', 'noopener')

  const emailInvalid = prefs.email.enabled && !prefs.email.address.includes('@')

  return (
    <div className="space-y-3">
      {/* Email */}
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
      </ChannelCard>

      {/* Telegram */}
      <ChannelCard
        icon="✈"
        title="Telegram"
        desc="Instant mobile push — free, works on iOS."
        enabled={prefs.telegram.enabled}
        onToggle={(v) => setTelegram({ enabled: v })}
      >
        {prefs.telegram.linked ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-400/[0.06] border border-emerald-400/20 px-3 py-2.5">
            <span className="text-sm text-emerald-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Linked{prefs.telegram.handle ? ` as @${prefs.telegram.handle}` : ''}
            </span>
            <button
              onClick={() => setTelegram({ linked: false, handle: '' })}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Unlink
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500 leading-relaxed">
              Open the bot <span className="text-slate-300">@{BOT_HANDLE}</span> and press{' '}
              <span className="text-slate-300">Start</span>. Your linking code is{' '}
              <code className="tabular text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{startCode}</code>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={openTelegram}
                className="flex-1 py-2 rounded-lg bg-sky-500/15 border border-sky-400/25 text-sky-300 text-sm font-medium hover:bg-sky-500/25 transition-colors"
              >
                Open Telegram
              </button>
              <button
                onClick={() => setTelegram({ linked: true })}
                className="flex-1 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300 text-sm hover:bg-white/[0.08] transition-colors"
              >
                I've pressed Start
              </button>
            </div>
          </div>
        )}
      </ChannelCard>

      {/* in-app note */}
      <p className="text-xs text-slate-600 px-1">
        In-app alerts stream live over WebSocket whenever the dashboard is open — always on.
      </p>
    </div>
  )
}

export function channelsValid(prefs) {
  const noChannel = !prefs.email.enabled && !prefs.telegram.enabled
  const emailInvalid = prefs.email.enabled && !prefs.email.address.includes('@')
  return !noChannel && !emailInvalid
}
