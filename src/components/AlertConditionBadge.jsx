import { metricLabel } from '../constants/metrics'

export default function AlertConditionBadge({ condition }) {
  const { metric, operator, threshold, value, met } = condition
  const label = metricLabel(metric)

  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm ${
      met
        ? 'bg-emerald-400/5 border-emerald-400/15 text-emerald-300'
        : 'bg-white/[0.03] border-white/[0.06] text-slate-400'
    }`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${met ? 'bg-emerald-400' : 'bg-slate-600'}`} />
        <span className="font-medium text-slate-300">{label}</span>
        <span className="text-slate-500">{operator} {threshold}</span>
      </div>
      <span className={`tabular font-medium flex-shrink-0 ${met ? 'text-emerald-400' : 'text-slate-300'}`}>
        {value != null ? value.toFixed(1) : '—'}
      </span>
    </div>
  )
}
