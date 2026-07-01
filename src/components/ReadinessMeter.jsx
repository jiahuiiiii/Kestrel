// A segmented progress meter that turns "0 of 3 conditions" into a glanceable
// picture of how close a thesis is to firing. One segment per condition +
// catalyst; filled segments = met/confirmed. Reads as a progress bar toward READY.

function Segments({ filled, total, ready }) {
  if (total === 0) {
    return <div className="h-1.5 flex-1 rounded-full bg-white/10" />
  }
  return (
    <div className="flex-1 flex gap-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i < filled
              ? ready
                ? 'bg-emerald-400'
                : 'bg-emerald-400/60'
              : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  )
}

export default function ReadinessMeter({
  readiness,
  size = 'md',
  showBreakdown = true,
}) {
  const { met, total, ready, signal, quantMet, quantTotal, catalystMet, catalystTotal } = readiness
  const isReady = signal || ready
  const compact = size === 'sm'

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex items-center justify-between gap-3">
        <span className={`uppercase tracking-widest text-slate-500 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          Readiness
        </span>
        <span
          className={`tabular font-medium ${compact ? 'text-xs' : 'text-sm'} ${
            isReady ? 'text-emerald-400' : 'text-slate-300'
          }`}
        >
          {isReady ? 'Ready ↗' : `${met} of ${total}`}
        </span>
      </div>

      <Segments filled={met} total={total} ready={isReady} />

      {showBreakdown && (
        <div className={`flex items-center gap-3 text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          <span>
            <span className={quantMet === quantTotal && quantTotal > 0 ? 'text-emerald-400/80' : 'text-slate-400'}>
              {quantMet}/{quantTotal}
            </span>{' '}
            conditions
          </span>
          <span className="text-slate-700">·</span>
          <span>
            <span className={catalystMet === catalystTotal && catalystTotal > 0 ? 'text-emerald-400/80' : 'text-slate-400'}>
              {catalystMet}/{catalystTotal}
            </span>{' '}
            catalysts
          </span>
        </div>
      )}
    </div>
  )
}
