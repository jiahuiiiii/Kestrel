import { readinessFromEvaluation } from '../lib/readiness'

// A vertical timeline of a thesis's evaluations, newest at top. Each node is
// selectable and drives the reasoning panel. The point judges should feel: watch
// a thesis climb from "1 of 4" toward "Ready ↗" over successive sweeps.
//
// `evaluations` arrive newest-first (per the API contract). We compare each node
// to the chronologically previous sweep (index i+1, the older one) to show the
// delta — e.g. "▲ +1" when a new condition was met.

function nodeColor(r, isSignal) {
  if (isSignal || r.ready) return 'bg-emerald-400 border-emerald-400 shadow-[0_0_8px_1px_rgba(52,211,153,0.5)]'
  if (r.met > 0) return 'bg-amber-400/80 border-amber-400/80'
  return 'bg-slate-600 border-slate-600'
}

function Delta({ current, previous }) {
  if (!previous) return null
  const diff = current.met - previous.met
  if (diff === 0) return null
  const up = diff > 0
  return (
    <span className={`tabular text-[11px] font-medium ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      {up ? '▲' : '▼'} {up ? '+' : ''}{diff}
    </span>
  )
}

export default function EvaluationTimeline({ evaluations, thesis, activeIdx, onSelect }) {
  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="glass px-4 py-6 text-center text-sm text-slate-500">
        No evaluations yet. History appears here after the first sweep.
      </div>
    )
  }

  const readinessByIdx = evaluations.map((e) => readinessFromEvaluation(e, thesis))

  return (
    <div className="relative">
      {/* connecting spine */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.08]" aria-hidden="true" />

      <ol className="space-y-2">
        {evaluations.map((e, i) => {
          const r = readinessByIdx[i]
          const prev = readinessByIdx[i + 1] // older sweep
          const active = i === activeIdx
          const isSignal = e.signal || r.ready
          const date = new Date(e.timestamp).toLocaleString('en-SG', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <li key={e.id} className="relative pl-7">
              {/* node dot */}
              <span
                className={`absolute left-0 top-[13px] w-3.5 h-3.5 rounded-full border-2 transition-colors ${nodeColor(r, isSignal)}`}
                aria-hidden="true"
              />

              <button
                onClick={() => onSelect(i)}
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                  active
                    ? 'border-white/20 bg-white/[0.06]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm ${active ? 'text-white' : 'text-slate-300'}`}>{date}</span>
                  <div className="flex items-center gap-2">
                    <Delta current={r} previous={prev} />
                    {isSignal ? (
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                        Ready ↗
                      </span>
                    ) : (
                      <span className="tabular text-xs text-slate-500">{r.met}/{r.total}</span>
                    )}
                  </div>
                </div>

                {/* mini segmented readiness */}
                <div className="flex gap-0.5 mt-2" aria-hidden="true">
                  {Array.from({ length: Math.max(r.total, 1) }).map((_, s) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full ${
                        s < r.met ? (isSignal ? 'bg-emerald-400' : 'bg-emerald-400/50') : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
