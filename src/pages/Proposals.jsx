import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PROPOSALS } from '../data/mock'
import GlassCard from '../components/GlassCard'

const TYPE_LABELS = {
  adjust_threshold: 'Threshold adjustment',
  add_catalyst:     'New catalyst',
  remove_catalyst:  'Remove catalyst',
}

function ProposalCard({ proposal, onApprove, onReject }) {
  const navigate = useNavigate()
  const { ticker, type, status, createdAt, resolvedAt, proposedChange } = proposal
  const ts = new Date(createdAt).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })
  const isPending = status === 'pending'

  return (
    <GlassCard className={`p-5 space-y-4 ${
      isPending ? '' : 'opacity-60'
    }`}>
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(`/thesis/${proposal.thesisId}`)}
            className="text-lg font-bold text-white tracking-tight hover:text-emerald-400 transition-colors"
          >
            {ticker}
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

      {/* change details */}
      {type === 'adjust_threshold' && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm flex items-center gap-3">
          <span className="text-slate-400 tabular">{proposedChange.metric?.replace(/_/g, ' ')}</span>
          <span className="text-slate-600">→</span>
          <span className="text-rose-400 tabular line-through">&lt; {proposedChange.currentValue}</span>
          <span className="text-slate-600">→</span>
          <span className="text-emerald-400 tabular">&lt; {proposedChange.suggestedValue}</span>
        </div>
      )}

      {type === 'add_catalyst' && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-slate-300">
          "{proposedChange.description}"
        </div>
      )}

      {/* rationale */}
      <p className="text-sm text-slate-400 leading-relaxed">{proposedChange.rationale}</p>

      {/* footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
        <span className="text-xs text-slate-600">{ts}</span>
        {isPending ? (
          <div className="flex gap-2">
            <button
              onClick={() => onReject(proposal.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove(proposal.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20 transition-all font-medium"
            >
              Approve
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-600">
            Resolved {resolvedAt ? new Date(resolvedAt).toLocaleString('en-SG', { dateStyle: 'short' }) : '—'}
          </span>
        )}
      </div>
    </GlassCard>
  )
}

export default function Proposals() {
  const [proposals, setProposals] = useState(PROPOSALS)

  const pending  = proposals.filter(p => p.status === 'pending')
  const resolved = proposals.filter(p => p.status !== 'pending')

  const approve = (id) => setProposals(ps =>
    ps.map(p => p.id === id ? { ...p, status: 'approved', resolvedAt: new Date().toISOString() } : p)
  )
  const reject = (id) => setProposals(ps =>
    ps.map(p => p.id === id ? { ...p, status: 'rejected', resolvedAt: new Date().toISOString() } : p)
  )

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Proposals</h1>
        <p className="text-sm text-slate-500 mt-1">
          The agent suggests — you decide. Changes only apply after you approve.
        </p>
      </div>

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">
            Pending ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map(p => (
              <ProposalCard key={p.id} proposal={p} onApprove={approve} onReject={reject} />
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
            {resolved.map(p => (
              <ProposalCard key={p.id} proposal={p} onApprove={approve} onReject={reject} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
