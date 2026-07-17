// Maps backend DTOs -> the shape the existing components already consume (the
// former mock shape). Keeping this translation in one place means the pages and
// components stay untouched as the seam settles.
//
// Fields the backend doesn't (yet) track are filled with safe placeholders the
// components already handle: `name`/`sector` are cosmetic, and per-condition
// `currentValue`/`met` aren't persisted on an evaluation, so ConditionBadge
// renders them as "—" until the backend stores a richer per-condition result.

function isFiring(ev) {
  if (!ev) return false
  const r = ev.results || {}
  return r.signal === true || ev.signal === true || ev.signal === 'true' || ev.evaluation_status === 'firing'
}

function evidenceList(catalyst) {
  const e = catalyst.evidence
  if (Array.isArray(e)) return e
  return e ? [e] : []
}

function newestEvidence(catalyst) {
  const list = evidenceList(catalyst)
  if (!list.length) return null
  return [...list].sort((a, b) =>
    String(b?.classified_at || '').localeCompare(String(a?.classified_at || '')),
  )[0]
}

// Index a latest_evaluation's persisted per-condition detail by condition id.
function quantDetailById(evaluation) {
  const detail = (evaluation?.results?.quant_detail) || []
  const byId = {}
  for (const d of detail) byId[d.quant_condition_id] = d
  return byId
}

// Deleting a condition/catalyst is a SOFT delete: the backend flips `enabled` to
// false and keeps the row (and its evidence) for the audit trail. The API still
// returns those rows, so every read path has to drop them here — otherwise a
// removed condition keeps rendering, and worse, keeps being counted.
const isEnabled = (row) => row.enabled !== false
const activeRows = (rows) => (rows || []).filter(isEnabled)

// A backend ThesesResponse -> a dashboard/detail thesis.
export function adaptThesis(t) {
  const latest = t.latest_evaluation
  const firing = isFiring(latest)
  const detailById = quantDetailById(latest)
  return {
    id: t.theses_id,
    ticker: t.ticker,
    name: t.ticker, // backend has no company name field
    sector: '', // not tracked
    signal: firing,
    status: firing ? 'signal' : 'watching',
    lastEvaluated: latest?.created_at || null,
    notes: t.notes || '',
    quantMode: t.quant_mode,
    catalystMode: t.catalyst_mode,
    quantConditions: activeRows(t.quant_conditions).map((q) => {
      const d = detailById[q.quant_condition_id]
      return {
        id: q.quant_condition_id,
        metric: q.metric,
        operator: q.operator,
        value: Number(q.value),
        currentValue: d && d.value != null ? Number(d.value) : null,
        met: d ? d.passes : null,
      }
    }),
    catalysts: activeRows(t.catalysts).map((c) => {
      const e = newestEvidence(c)
      const triggered = c.state === 'confirmed'
      return {
        id: c.catalyst_id,
        description: c.description || '',
        state: c.state,
        triggered,
        triggeredAt: triggered && e ? e.classified_at : null,
      }
    }),
    evaluations: [], // filled on the detail page via adaptEvaluations
  }
}

// The catalysts' newest verdicts as evaluation-style catalystResults, so the
// reasoning panel shows real confidence + verbatim quotes for the current state.
export function catalystResultsFromThesis(t) {
  return activeRows(t.catalysts).map((c) => {
    const e = newestEvidence(c)
    return {
      description: c.description || '',
      verdict: c.state === 'confirmed',
      confidence: e ? e.confidence : null,
      quote: e ? e.supporting_quote : null,
      reasoning: e ? e.reasoning : null,
      sourceKind: e ? e.source_kind : null,
      articleHeadline: null, // backend evidence stores article_id, not the headline
    }
  })
}

// --- Proposals -------------------------------------------------------------
// GET /proposals returns three separate paginated lists (theses/quant/catalyst).
// We flatten them into one unified list the ProposalCard consumes. Backend
// proposal_type is ADD/REMOVE/UPDATE; we map it to the UI's type vocabulary.

const PROPOSAL_TYPE = {
  quant:    { UPDATE: 'adjust_threshold', ADD: 'add_condition', REMOVE: 'remove_condition' },
  catalyst: { ADD: 'add_catalyst', REMOVE: 'remove_catalyst', UPDATE: 'update_catalyst' },
}

function adaptProposal(p, kind, idField, statusField) {
  const change = p.proposed_change || {}
  const rawType = p.proposal_type
  const type = (PROPOSAL_TYPE[kind] && PROPOSAL_TYPE[kind][rawType]) ||
    (kind === 'theses' ? 'add_thesis' : rawType)
  return {
    id: p[idField],
    kind, // 'theses' | 'quant' | 'catalyst' — needed for approve/reject routing
    thesisId: p.theses_id || null,
    // The proposal row has no ticker column; the generator writes it into
    // proposed_change so the card stays readable without a join.
    ticker: change.ticker || '',
    type,
    status: String(p[statusField] || '').toLowerCase(),
    createdAt: p.created_at || null,
    resolvedAt: p.resolved_at || null,
    rejectionReason: p.rejection_reason || null,
    sourceArticleUrl: p.source_article_url || null,
    proposedChange: {
      ...change,
      rationale: p.llm_rationale || change.rationale || '',
      confidence: p.llm_confidence != null ? Number(p.llm_confidence) : null,
    },
  }
}

export function adaptProposals(resp) {
  if (!resp) return []
  const theses = (resp.theses_proposals?.theses_proposals || [])
    .map((p) => adaptProposal(p, 'theses', 'theses_proposal_id', 'theses_proposal_status'))
  const quant = (resp.quant_proposals?.quant_proposals || [])
    .map((p) => adaptProposal(p, 'quant', 'quant_proposal_id', 'quant_proposal_status'))
  const catalyst = (resp.catalyst_proposals?.catalyst_proposals || [])
    .map((p) => adaptProposal(p, 'catalyst', 'catalyst_proposal_id', 'catalyst_proposal_status'))
  return [...theses, ...quant, ...catalyst]
}

export function pendingProposalCount(resp) {
  return adaptProposals(resp).filter((p) => p.status === 'pending').length
}

// A backend EvaluationResponse -> a timeline/reasoning-panel evaluation.
// `catalystResults` is attached by the caller for the newest evaluation (that's
// the only one whose evidence we can reconstruct from current catalyst state).
export function adaptEvaluation(ev) {
  const r = ev.results || {}
  return {
    id: ev.evaluation_id,
    timestamp: ev.created_at,
    signal: isFiring(ev),
    status: ev.evaluation_status,
    reason: ev.reason || r.reason || '',
    blockedBy: r.blocked_by || [],
    quantResults: (r.quant_detail || []).map((d) => ({
      metric: d.metric,
      operator: d.operator,
      value: d.threshold,
      currentValue: d.value != null ? Number(d.value) : null,
      met: d.passes,
    })),
    catalystResults: [],
  }
}
