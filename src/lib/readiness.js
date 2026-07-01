// Readiness math shared by the reasoning panel and the evaluation timeline.
//
// "Readiness" answers the demo-critical question: how close is this thesis to
// firing a signal? A thesis is READY when every quant condition is met AND every
// catalyst is confirmed. We express progress as met-out-of-total across both.
//
// Totals note: an Evaluation's `catalystResults` may be [] (no articles found
// that cycle), which understates the denominator. When the owning Thesis is
// available, prefer its defined `catalysts`/`quantConditions` counts for totals
// and only take the *met* counts from the evaluation snapshot.

// Readiness from a Thesis's *current* state (live condition/catalyst flags),
// for the dashboard cards where we don't render a specific evaluation.
export function readinessFromThesis(thesis) {
  const quantConditions = thesis?.quantConditions ?? []
  const catalysts = thesis?.catalysts ?? []

  const quantMet = quantConditions.filter((c) => c.met).length
  const catalystMet = catalysts.filter((c) => c.triggered).length
  const quantTotal = quantConditions.length
  const catalystTotal = catalysts.length

  const met = quantMet + catalystMet
  const total = quantTotal + catalystTotal

  return {
    quantMet,
    quantTotal,
    catalystMet,
    catalystTotal,
    met,
    total,
    ratio: total > 0 ? met / total : 0,
    ready: total > 0 && met === total,
    signal: Boolean(thesis?.signal),
  }
}

export function readinessFromEvaluation(evaluation, thesis = null) {
  const quantResults = evaluation?.quantResults ?? []
  const catalystResults = evaluation?.catalystResults ?? []

  const quantMet = quantResults.filter((r) => r.met).length
  const catalystMet = catalystResults.filter((r) => r.verdict).length

  // Totals: trust the thesis definition when we have it, else the eval snapshot.
  const quantTotal = thesis?.quantConditions?.length ?? quantResults.length
  const catalystTotal = thesis?.catalysts?.length ?? catalystResults.length

  const met = quantMet + catalystMet
  const total = quantTotal + catalystTotal
  const ratio = total > 0 ? met / total : 0

  return {
    quantMet,
    quantTotal,
    catalystMet,
    catalystTotal,
    met,
    total,
    ratio,
    ready: total > 0 && met === total,
    // A signal is the authoritative "fired" state from the backend; readiness is
    // the client-side approximation. When present, `signal` wins.
    signal: Boolean(evaluation?.signal),
  }
}
