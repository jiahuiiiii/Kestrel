import { useNavigate } from 'react-router-dom'
import GlassCard from './GlassCard'
import StatusIndicator from './StatusIndicator'
import ConditionBadge from './ConditionBadge'

export default function ThesisCard({ thesis }) {
  const navigate = useNavigate()
  const { id, ticker, name, sector, signal, status, quantConditions, catalysts, lastEvaluated } = thesis

  const metCount = quantConditions.filter(c => c.met).length
  const triggeredCount = catalysts.filter(c => c.triggered).length
  const ts = new Date(lastEvaluated).toLocaleString('en-SG', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <GlassCard
      className={`p-5 space-y-4 ${signal ? 'ring-1 ring-emerald-400/25' : ''}`}
      onClick={() => navigate(`/thesis/${id}`)}
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl font-bold text-white tracking-tight">{ticker}</span>
            <StatusIndicator status={status} variant="badge" />
          </div>
          <p className="text-sm text-slate-500">{name}</p>
          <p className="text-xs text-slate-600 mt-0.5">{sector}</p>
        </div>

        {signal && (
          <div className="flex-shrink-0 text-center">
            <div className="w-9 h-9 rounded-full bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center">
              <span className="text-emerald-400 text-base">↗</span>
            </div>
          </div>
        )}
      </div>

      {/* quant conditions */}
      <div className="space-y-1.5">
        {quantConditions.map(c => (
          <ConditionBadge key={c.id} condition={c} />
        ))}
      </div>

      {/* catalysts */}
      <div className="space-y-1.5">
        {catalysts.map(c => (
          <div key={c.id} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 border ${
            c.triggered
              ? 'bg-emerald-400/5 border-emerald-400/15 text-emerald-300'
              : 'bg-white/[0.02] border-white/[0.05] text-slate-500'
          }`}>
            <span className="mt-0.5 flex-shrink-0">{c.triggered ? '✓' : '○'}</span>
            <span className="leading-snug">{c.description}</span>
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
        <span className="text-xs text-slate-600">
          {metCount}/{quantConditions.length} conditions · {triggeredCount}/{catalysts.length} catalysts
        </span>
        <span className="text-xs text-slate-600">{ts}</span>
      </div>
    </GlassCard>
  )
}
