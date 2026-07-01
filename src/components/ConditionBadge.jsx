import { metricLabel } from '../constants/metrics'

export default function ConditionBadge({ condition }) {
  const { metric, operator, value, currentValue, met } = condition
  const label = metricLabel(metric)

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
      met
        ? 'bg-emerald-400/5 border-emerald-400/15 text-emerald-300'
        : 'bg-white/[0.03] border-white/[0.06] text-slate-400'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${met ? 'bg-emerald-400' : 'bg-slate-600'}`} />
        <span className="font-medium text-slate-300">{label}</span>
        <span className="text-slate-500">{operator} {value}</span>
      </div>
      <span className={`tabular font-medium ${met ? 'text-emerald-400' : 'text-slate-300'}`}>
        {currentValue != null ? currentValue.toFixed(1) : '—'}
      </span>
    </div>
  )
}
