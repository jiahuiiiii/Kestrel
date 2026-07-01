function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.7 ? 'bg-emerald-400' : value >= 0.4 ? 'bg-amber-400' : 'bg-slate-600'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular text-xs text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function AgentReasoningPanel({ evaluation }) {
  if (!evaluation) {
    return (
      <div className="glass p-4 text-sm text-slate-500 text-center py-8">
        No evaluation yet — waiting for first poll cycle.
      </div>
    )
  }

  const { timestamp, signal, quantResults, catalystResults, reason } = evaluation
  const ts = new Date(timestamp).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="glass p-5 space-y-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Agent reasoning</p>
          <p className="text-sm text-slate-300">{reason}</p>
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full border ${
          signal
            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}>
          {signal ? 'Signal' : 'No signal'}
        </span>
      </div>

      {/* quant summary */}
      {quantResults?.length > 0 && (
        <div>
          <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-2">Quant conditions</p>
          <div className="space-y-1.5">
            {quantResults.map((r, i) => (
              <ConditionRow key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* catalyst results */}
      {catalystResults?.length > 0 && (
        <div>
          <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-2">Catalyst scan</p>
          <div className="space-y-3">
            {catalystResults.map((r, i) => (
              <CatalystRow key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-600 text-right">Last evaluated {ts}</p>
    </div>
  )
}

const METRIC_LABELS = {
  forward_pe: 'Forward P/E', pb_ratio: 'P/B', ev_ebitda: 'EV/EBITDA', price_vs_ma200: 'Price/200d MA',
}

function ConditionRow({ result }) {
  const label = METRIC_LABELS[result.metric] ?? result.metric
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">
        {result.met ? '✓' : '✗'} {label} {result.operator} {result.value}
      </span>
      <span className={`tabular ${result.met ? 'text-emerald-400' : 'text-rose-400'}`}>
        {result.currentValue?.toFixed(1)}
      </span>
    </div>
  )
}

function CatalystRow({ result }) {
  return (
    <div className={`rounded-lg border p-3 space-y-2 ${
      result.verdict
        ? 'bg-emerald-400/5 border-emerald-400/15'
        : 'bg-white/[0.02] border-white/[0.05]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-300 leading-snug">{result.description}</p>
        <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
          result.verdict ? 'bg-emerald-400/15 text-emerald-400' : 'bg-slate-600/20 text-slate-500'
        }`}>
          {result.verdict ? 'confirmed' : 'not confirmed'}
        </span>
      </div>

      {result.confidence != null && (
        <ConfidenceBar value={result.confidence} />
      )}

      {result.articleHeadline && (
        <p className="text-xs text-slate-600 italic">"{result.articleHeadline}"</p>
      )}

      {result.quote && (
        <blockquote className="border-l-2 border-emerald-400/40 pl-3 text-xs text-emerald-300/80 italic leading-relaxed">
          {result.quote}
        </blockquote>
      )}
    </div>
  )
}
