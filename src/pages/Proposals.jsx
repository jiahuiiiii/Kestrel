import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { adaptProposals } from '../api/adapt'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/GlassCard'
import { metricLabel } from '../constants/metrics'

const TYPE_LABELS = {
  adjust_threshold: 'Threshold adjustment',
  add_condition:    'New condition',
  remove_condition: 'Remove condition',
  add_catalyst:     'New catalyst',
  remove_catalyst:  'Remove catalyst',
  update_catalyst:  'Update catalyst',
  add_thesis:       'New thesis',
}

function fmtDate(v, opts = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-SG', opts)
}

const Chip = ({ tone = 'slate', className = '', children }) => (
  <span className={`tabular ${{
    rose: 'text-rose-400 line-through',
    emerald: 'text-emerald-400',
    slate: 'text-slate-400',
  }[tone]} ${className}`}>{children}</span>
)

const Arrow = () => <span className="text-slate-600">→</span>

const condition = (metric, operator, value) =>
  `${metricLabel(metric)} ${operator} ${value}`

// What the agent wants to change, rendered from proposed_change. The generator
// writes both the apply keys and a snapshot of the row as it was (`current*`),
// so a resolved proposal still reads correctly long after the row it describes
// has moved on — or been deleted.
function ChangeSummary({ type, change }) {
  const box = 'bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm'
  const quote = (text) => `“${text}”`

  switch (type) {
    case 'adjust_threshold':
      if (!change.metric) return null
      return (
        <div className={`${box} flex items-center gap-3 flex-wrap`}>
          <span className="text-slate-300 font-medium">{metricLabel(change.metric)}</span>
          <Chip tone="rose">{change.currentOperator} {change.currentValue}</Chip>
          <Arrow />
          <Chip tone="emerald">{change.operator} {change.value}</Chip>
          {change.liveValue != null && (
            <span className="text-xs text-slate-600 ml-auto">live: {change.liveValue}</span>
          )}
        </div>
      )

    case 'add_condition':
      if (!change.metric) return null
      return <div className={box}><Chip tone="emerald">+ {condition(change.metric, change.operator, change.value)}</Chip></div>

    case 'remove_condition':
      if (!change.currentMetric) return null
      return (
        <div className={`${box} flex items-center gap-3`}>
          <Chip tone="rose">{condition(change.currentMetric, change.currentOperator, change.currentValue)}</Chip>
          {change.liveValue != null && (
            <span className="text-xs text-slate-600 ml-auto">live: {change.liveValue}</span>
          )}
        </div>
      )

    case 'add_catalyst':
      return change.description
        ? <div className={`${box} text-emerald-300`}>{quote(change.description)}</div>
        : null

    case 'update_catalyst':
      return change.description ? (
        <div className={`${box} space-y-1.5`}>
          {change.currentDescription && (
            <p className="text-slate-500 line-through">{quote(change.currentDescription)}</p>
          )}
          <p className="text-emerald-300">{quote(change.description)}</p>
        </div>
      ) : null

    case 'remove_catalyst':
      return change.currentDescription
        ? <div className={`${box} text-slate-500 line-through`}>{quote(change.currentDescription)}</div>
        : null

    default:
      return null
  }
}

function ProposalCard({ proposal, justResolved, onApprove, onReject, busy }) {
  const navigate = useNavigate()
  const { ticker, type, status, createdAt, resolvedAt, proposedChange } = proposal
  const ts = fmtDate(createdAt)
  const isPending = status === 'pending'

  return (
    <GlassCard className={`p-5 space-y-4 ${isPending ? '' : 'opacity-60'} ${justResolved ? 'animate-applied' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => proposal.thesisId && navigate(`/thesis/${proposal.thesisId}`)}
            disabled={!proposal.thesisId}
            className="text-lg font-bold text-white tracking-tight hover:text-emerald-400 transition-colors disabled:hover:text-white disabled:cursor-default"
          >
            {ticker || proposal.kind}
          </button>
          <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-400">
            {TYPE_LABELS[type] ?? type}
          </span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          status === 'pending'
            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
            : status === 'approved'
            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
        }`}>
          {status}
        </span>
      </div>

      <ChangeSummary type={type} change={proposedChange} />

      {proposedChange.rationale && (
        <p className="text-sm text-slate-400 leading-relaxed">{proposedChange.rationale}</p>
      )}

      {(proposedChange.confidence != null || proposal.sourceArticleUrl) && (
        <div className="flex items-center gap-3 text-xs text-slate-600">
          {proposedChange.confidence != null && (
            <span>{Math.round(proposedChange.confidence * 100)}% confident</span>
          )}
          {proposal.sourceArticleUrl && (
            <a href={proposal.sourceArticleUrl} target="_blank" rel="noreferrer"
              className="text-slate-500 hover:text-emerald-400 transition-colors">
              Source article ↗
            </a>
          )}
        </div>
      )}

      {status === 'rejected' && proposal.rejectionReason && (
        <p className="text-xs text-slate-600 italic">{proposal.rejectionReason}</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
        <span className="text-xs text-slate-600">{ts}</span>
        {isPending ? (
          <div className="flex gap-2">
            <button
              onClick={() => onReject(proposal)}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove(proposal)}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20 transition-all font-medium disabled:opacity-50"
            >
              Approve
            </button>
          </div>
        ) : (
          <span className={`text-xs ${status === 'approved' ? 'text-emerald-400/70' : 'text-slate-600'}`}>
            {status === 'approved' ? '✓ Approved & applied' : '✗ Rejected'}
            {resolvedAt ? ` · ${fmtDate(resolvedAt, { dateStyle: 'short' })}` : ''}
          </span>
        )}
      </div>
    </GlassCard>
  )
}

export default function Proposals() {
  const { user, loading: authLoading } = useAuth()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flashId, setFlashId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    return api.proposals.all()
      .then((data) => { setProposals(adaptProposals(data)); setError('') })
      .catch((e) => setError(e?.message || 'Failed to load proposals'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    let active = true
    api.proposals.all()
      .then((data) => active && (setProposals(adaptProposals(data)), setError('')))
      .catch((e) => active && setError(e?.message || 'Failed to load proposals'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [user, authLoading])

  const act = async (proposal, fn) => {
    setBusyId(proposal.id)
    try {
      await fn()
      setFlashId(proposal.id)
      setTimeout(() => setFlashId((f) => (f === proposal.id ? null : f)), 1000)
      await load()
    } catch (e) {
      setError(e?.message || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  const approve = (p) => act(p, () => api.proposals.approve(p.kind, p.id))
  const reject = (p) => act(p, () => api.proposals.reject(p.kind, p.id, 'Rejected by user'))

  const pending = proposals.filter((p) => p.status === 'pending')
  const resolved = proposals.filter((p) => p.status !== 'pending')

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Proposals</h1>
        <p className="text-sm text-slate-500 mt-1">
          The agent suggests — you decide. Changes only apply after you approve.
        </p>
      </div>

      {authLoading || loading ? (
        <p className="text-center text-slate-500 py-10">Loading…</p>
      ) : !user ? (
        <GlassCard className="px-6 py-10 text-center">
          <p className="text-slate-400 text-sm">Sign in to review proposals.</p>
        </GlassCard>
      ) : error ? (
        <GlassCard className="px-6 py-10 text-center">
          <p className="text-rose-400 text-sm">{error}</p>
        </GlassCard>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs text-slate-500 uppercase tracking-widest">Pending ({pending.length})</h2>
              <div className="space-y-4">
                {pending.map((p) => (
                  <ProposalCard key={p.id} proposal={p} justResolved={flashId === p.id}
                    busy={busyId === p.id} onApprove={approve} onReject={reject} />
                ))}
              </div>
            </section>
          )}

          {pending.length === 0 && (
            <GlassCard className="px-6 py-10 text-center">
              <p className="text-slate-500 text-sm">No pending proposals.</p>
              <p className="text-slate-600 text-xs mt-1">The agent will suggest changes when it spots patterns.</p>
            </GlassCard>
          )}

          {resolved.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs text-slate-500 uppercase tracking-widest">Resolved</h2>
              <div className="space-y-4">
                {resolved.map((p) => (
                  <ProposalCard key={p.id} proposal={p} justResolved={flashId === p.id}
                    busy={busyId === p.id} onApprove={approve} onReject={reject} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
