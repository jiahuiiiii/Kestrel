import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { THESES } from '../data/mock'
import GlassCard from '../components/GlassCard'
import StatusIndicator from '../components/StatusIndicator'
import ConditionBadge from '../components/ConditionBadge'
import AgentReasoningPanel from '../components/AgentReasoningPanel'

export default function ThesisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const thesis = THESES.find(t => t.id === Number(id))

  const [activeEvalIdx, setActiveEvalIdx] = useState(0)

  if (!thesis) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-slate-500 text-center">
        Thesis not found.
      </div>
    )
  }

  const { ticker, name, sector, signal, status, notes, quantConditions, catalysts, evaluations } = thesis
  const activeEval = evaluations[activeEvalIdx]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
      >
        ← Back
      </button>

      {/* title block */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">{ticker}</h1>
            <StatusIndicator status={status} variant="badge" />
          </div>
          <p className="text-slate-400">{name}</p>
          <p className="text-sm text-slate-600 mt-0.5">{sector}</p>
        </div>

        {signal && (
          <div className="flex-shrink-0 glass px-4 py-3 text-center">
            <p className="text-emerald-400 text-lg font-bold">↗ Signal</p>
            <p className="text-xs text-emerald-400/60 mt-0.5">All conditions met</p>
          </div>
        )}
      </div>

      {/* notes */}
      {notes && (
        <GlassCard className="px-4 py-3">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-1">Thesis notes</p>
          <p className="text-sm text-slate-300 leading-relaxed">{notes}</p>
        </GlassCard>
      )}

      {/* two-col: conditions + catalysts */}
      <div className="grid sm:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Quant conditions</h2>
          <div className="space-y-2">
            {quantConditions.map(c => (
              <ConditionBadge key={c.id} condition={c} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Catalysts</h2>
          <div className="space-y-2">
            {catalysts.map(c => (
              <div key={c.id} className={`rounded-lg border px-3 py-2.5 text-sm ${
                c.triggered
                  ? 'bg-emerald-400/5 border-emerald-400/20 text-emerald-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-400'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">{c.triggered ? '✓' : '○'}</span>
                  <span className="leading-snug">{c.description}</span>
                </div>
                {c.triggered && c.triggeredAt && (
                  <p className="text-xs text-emerald-400/50 mt-1.5 pl-5">
                    Confirmed {new Date(c.triggeredAt).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* evaluation history picker */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Evaluation history</h2>
          {evaluations.length > 1 && (
            <div className="flex gap-1">
              {evaluations.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => setActiveEvalIdx(i)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    i === activeEvalIdx
                      ? 'bg-white/10 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {new Date(e.timestamp).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                </button>
              ))}
            </div>
          )}
        </div>

        <AgentReasoningPanel evaluation={activeEval} />
      </section>
    </div>
  )
}
