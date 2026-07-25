import { metricLabel } from '../constants/metrics'
import { readinessFromEvaluation } from '../lib/readiness'
import ReadinessMeter from './ReadinessMeter'
import { ReasoningPanelSkeleton } from './Skeleton'

function ConfidenceBar({ value, size = 'sm' }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.7 ? 'bg-emerald-400' : value >= 0.4 ? 'bg-amber-400' : 'bg-slate-600'
  const track = size === 'lg' ? 'h-1.5' : 'h-1'
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${track} bg-white/10 rounded-full overflow-hidden`}>
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular text-xs text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

// The agent is mid-evaluation. Keeps the demo from ever showing a dead panel.
function ThinkingState() {
  return (
    <div className="glass p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex gap-1">
          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animationDelay: '0s' }} />
          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animationDelay: '0.2s' }} />
          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animationDelay: '0.4s' }} />
        </div>
        <p className="text-sm text-slate-300">Agent is evaluating — scanning conditions & news…</p>
      </div>
      <ReasoningPanelSkeleton />
    </div>
  )
}

export default function AgentReasoningPanel({ evaluation, thesis = null, loading = false }) {
  if (loading) {
    return <ThinkingState />
  }

  if (!evaluation) {
    return (
      <div className="glass p-6 text-center space-y-2">
        <div className="w-10 h-10 mx-auto rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500">
          ◔
        </div>
        <p className="text-sm text-slate-400">No evaluation yet</p>
        <p className="text-xs text-slate-600">
          The agent will reason here after the first poll cycle — conditions checked,
          news scanned, verdict explained.
        </p>
      </div>
    )
  }

  const { timestamp, signal, quantResults, catalystResults, reason } = evaluation
  const ts = new Date(timestamp).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })
  const readiness = readinessFromEvaluation(evaluation, thesis)

  // Hero the evidence: confirmed catalysts are the "here's exactly why" moment.
  const confirmed = (catalystResults ?? []).filter((r) => r.verdict)
  const unconfirmed = (catalystResults ?? []).filter((r) => !r.verdict)

  return (
    <div className="glass p-5 space-y-5 animate-fadeIn">
      {/* header: verdict + agent summary */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Agent reasoning</p>
          <p className="text-sm text-slate-300 leading-relaxed">{reason}</p>
        </div>
        <span
          className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${
            signal
              ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}
        >
          {signal ? '↗ Signal' : 'No signal'}
        </span>
      </div>

      {/* readiness meter — how close to firing */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <ReadinessMeter readiness={readiness} />
      </div>

      {/* confirmed catalysts — the hero evidence block */}
      {confirmed.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] text-emerald-400/70 uppercase tracking-widest">
            Catalyst confirmed — evidence
          </p>
          {confirmed.map((r, i) => (
            <EvidenceCard key={i} result={r} />
          ))}
        </div>
      )}

      {/* quant conditions */}
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

      {/* catalysts scanned but not confirmed */}
      {unconfirmed.length > 0 && (
        <div>
          <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-2">
            {confirmed.length > 0 ? 'Also scanned' : 'Catalyst scan'}
          </p>
          <div className="space-y-3">
            {unconfirmed.map((r, i) => (
              <CatalystRow key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* no articles this cycle */}
      {(catalystResults?.length ?? 0) === 0 && (
        <p className="text-xs text-slate-600 italic">
          No relevant news articles found this cycle.
        </p>
      )}

      <p className="text-[11px] text-slate-600 text-right">Last evaluated {ts}</p>
    </div>
  )
}

// The money shot: article + supporting quote + confidence, laid out so a judge
// can see at a glance *why* the agent said "buy."
function EvidenceCard({ result }) {
  return (
    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-200 leading-snug font-medium">{result.description}</p>
        {result.confidence != null && (
          <span className="flex-shrink-0 tabular text-xs font-semibold text-emerald-400 bg-emerald-400/15 px-2 py-0.5 rounded-full">
            {Math.round(result.confidence * 100)}% conf.
          </span>
        )}
      </div>

      {result.articleHeadline && (
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 mt-0.5 text-[10px] uppercase tracking-widest text-slate-500 border border-white/10 rounded px-1.5 py-0.5">
            Source
          </span>
          <p className="text-sm text-slate-300 leading-snug">{result.articleHeadline}</p>
        </div>
      )}

      {result.quote && (
        <blockquote className="relative border-l-2 border-emerald-400/50 pl-3 text-sm text-emerald-200/90 italic leading-relaxed">
          {result.quote}
        </blockquote>
      )}

      {result.confidence != null && (
        <div className="pt-0.5">
          <ConfidenceBar value={result.confidence} size="lg" />
        </div>
      )}
    </div>
  )
}

function ConditionRow({ result }) {
  const label = metricLabel(result.metric)
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">
        <span className={result.met ? 'text-emerald-400' : 'text-rose-400'}>{result.met ? '✓' : '✗'}</span>{' '}
        {label} {result.operator} {result.value}
      </span>
      <span className={`tabular ${result.met ? 'text-emerald-400' : 'text-rose-400'}`}>
        {result.currentValue != null ? result.currentValue.toFixed(1) : '—'}
      </span>
    </div>
  )
}

// A catalyst's progress toward confirming — its STATE, not the classifier's
// self-confidence. A near-full green bar next to "not confirmed" (the old
// confidence bar) read as "almost confirmed"; this shows the actual ladder
// unconfirmed → rumored → confirmed, so the fill means "closeness to firing".
const CATALYST_STAGE = {
  unconfirmed: { pct: 8, bar: 'bg-slate-500', chip: 'bg-slate-600/20 text-slate-400', label: 'unconfirmed' },
  rumored: { pct: 55, bar: 'bg-amber-400', chip: 'bg-amber-400/15 text-amber-300', label: 'rumored' },
  confirmed: { pct: 100, bar: 'bg-emerald-400', chip: 'bg-emerald-400/15 text-emerald-300', label: 'confirmed' },
  invalidated: { pct: 100, bar: 'bg-rose-500', chip: 'bg-rose-500/15 text-rose-300', label: 'invalidated' },
}

function CatalystRow({ result }) {
  const stage = CATALYST_STAGE[result.state] ?? CATALYST_STAGE.unconfirmed
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-300 leading-snug">{result.description}</p>
        <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${stage.chip}`}>
          {stage.label}
        </span>
      </div>

      <div className="space-y-1">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${stage.bar}`} style={{ width: `${stage.pct}%` }} />
        </div>
        <div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-600">
          <span>unconfirmed</span><span>rumored</span><span>confirmed</span>
        </div>
      </div>

      {result.articleHeadline && (
        <p className="text-xs text-slate-600 italic">Nearest article: &ldquo;{result.articleHeadline}&rdquo;</p>
      )}
    </div>
  )
}
