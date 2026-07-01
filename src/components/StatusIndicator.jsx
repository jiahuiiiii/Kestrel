const CONFIG = {
  signal:   { dot: 'bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]', label: 'Signal', text: 'text-emerald-400', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  watching: { dot: 'bg-slate-500',  label: 'Watching', text: 'text-slate-400',  badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  paused:   { dot: 'bg-amber-400',  label: 'Paused',  text: 'text-amber-400',  badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
}

export default function StatusIndicator({ status = 'watching', variant = 'dot' }) {
  const cfg = CONFIG[status] ?? CONFIG.watching

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    )
  }

  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
  )
}
