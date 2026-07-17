import { useParams, useNavigate } from 'react-router-dom'
import { useCallback, useState, useEffect } from 'react'
import { api } from '../api/client'
import { adaptThesis, adaptEvaluation, catalystResultsFromThesis } from '../api/adapt'
import GlassCard from '../components/GlassCard'
import StatusIndicator from '../components/StatusIndicator'
import ConditionBadge from '../components/ConditionBadge'
import AgentReasoningPanel from '../components/AgentReasoningPanel'
import EvaluationTimeline from '../components/EvaluationTimeline'
import EditThesisModal from '../components/EditThesisModal'

export default function ThesisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [thesis, setThesis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeEvalIdx, setActiveEvalIdx] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.theses.remove(id)
      navigate('/') // back to the watchlist
    } catch (e) {
      setError(e?.message || 'Failed to delete thesis')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  // Also the post-save refetch for EditThesisModal — stable per thesis id, so
  // the mount effect below can depend on it without re-running every render.
  const load = useCallback(({ active = () => true } = {}) =>
    Promise.all([api.theses.get(id), api.theses.evaluations(id)])
      .then(([detail, evalPage]) => {
        if (!active()) return
        const raw = detail?.theses
        const adapted = adaptThesis(raw)
        const evaluations = (evalPage?.evaluations ?? []).map(adaptEvaluation)
        // Newest evaluation is the only one whose per-catalyst evidence we can
        // reconstruct from current catalyst state — attach it there.
        if (evaluations.length > 0) {
          evaluations[0].catalystResults = catalystResultsFromThesis(raw)
        }
        adapted.evaluations = evaluations
        setThesis(adapted)
        setError('')
      })
      .catch((e) => active() && setError(e?.message || 'Failed to load thesis')), [id])

  useEffect(() => {
    let alive = true
    setLoading(true)
    load({ active: () => alive }).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [id, load])

  if (loading) {
    return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-slate-500">Loading…</div>
  }

  if (error || !thesis) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center space-y-2">
        <p className="text-slate-400">{error || 'Thesis not found.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-emerald-400 hover:text-emerald-300">← Back</button>
      </div>
    )
  }

  const { ticker, name, sector, signal, status, notes, quantConditions, catalysts, evaluations } = thesis
  const activeEval = evaluations[activeEvalIdx]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          ← Back
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Remove this thesis?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Removing…' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            >
              Edit thesis
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-500 hover:text-rose-400 hover:border-rose-400/30 transition-colors"
            >
              Remove thesis
            </button>
          </div>
        )}
      </div>

      <EditThesisModal open={editing} onClose={() => setEditing(false)} thesis={thesis} onSaved={load} />

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

      {notes && (
        <GlassCard className="px-4 py-3">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-1">Thesis notes</p>
          <p className="text-sm text-slate-300 leading-relaxed">{notes}</p>
        </GlassCard>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Quant conditions</h2>
          <div className="space-y-2">
            {quantConditions.map((c) => (
              <ConditionBadge key={c.id} condition={c} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Catalysts</h2>
          <div className="space-y-2">
            {catalysts.map((c) => (
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Evaluation history</h2>
        </div>

        {evaluations.length === 0 ? (
          <GlassCard className="px-4 py-8 text-center text-sm text-slate-500">
            No evaluations yet — the agent hasn’t swept this thesis. Run a sweep to populate this.
          </GlassCard>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,17rem)_1fr] gap-6 items-start">
            <div className="space-y-2">
              <p className="text-[11px] text-slate-600 uppercase tracking-widest">
                {evaluations.length} sweep{evaluations.length === 1 ? '' : 's'}
              </p>
              <EvaluationTimeline
                evaluations={evaluations}
                thesis={thesis}
                activeIdx={activeEvalIdx}
                onSelect={setActiveEvalIdx}
              />
            </div>

            <AgentReasoningPanel evaluation={activeEval} thesis={thesis} loading={false} />
          </div>
        )}
      </section>
    </div>
  )
}
