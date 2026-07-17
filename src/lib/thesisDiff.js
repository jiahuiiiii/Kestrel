// What an edit to a thesis actually means, as data.
//
// The backend has no bulk-replace endpoint: a thesis's conditions and catalysts
// are individually addressable rows, so saving an edited form means working out
// which rows were added, which changed, and which disappeared. That's the whole
// of the interesting logic in EditThesisModal, so it lives here as one pure
// function — the modal just executes the plan it returns.
//
// Diffing rather than replacing is what preserves a catalyst's state and its
// evidence trail: re-creating an untouched catalyst would throw away the news
// the pipeline already classified against it.

// `notes` is three-valued over the wire: omitted = leave alone, a string = set
// it, and this sentinel = clear it. (UpdateThesesRequest can't tell "absent"
// from "null", so the backend reads "<None>" as an explicit clear.)
export const CLEAR_NOTES = '<None>'

const sameCondition = (a, b) =>
  a.metric === b.metric && a.operator === b.operator && Number(a.value) === Number(b.value)

// Rows the user left usable: a condition needs a numeric value, a catalyst needs
// a non-empty description. Blank rows are treated as never having been typed.
export const validConditions = (rows) =>
  (rows || []).filter((c) => c.value !== '' && c.value != null && !Number.isNaN(Number(c.value)))

export const validCatalysts = (rows) =>
  (rows || [])
    .map((c) => ({ ...c, description: (c.description || '').trim() }))
    .filter((c) => c.description)

/**
 * Work out the API calls that turn `original` into `form`.
 *
 * @param original the adapted thesis as loaded (rows carry backend ids)
 * @param form     `{ quantMode, catalystMode, notes, conditions, catalysts }`,
 *                 where a row without an `id` is one the user just added.
 * @returns a plan: `{ thesisUpdate, addConditions, updateConditions,
 *          removeConditionIds, addCatalysts, updateCatalysts,
 *          removeCatalystIds, empty, error }`. `error` is set when the edit
 *          isn't safe to save; `empty` is true when nothing changed at all.
 */
export function diffThesis(original, form) {
  const conditions = validConditions(form.conditions)
  const catalysts = validCatalysts(form.catalysts)

  const plan = {
    thesisUpdate: null,
    addConditions: [], updateConditions: [], removeConditionIds: [],
    addCatalysts: [], updateCatalysts: [], removeCatalystIds: [],
    empty: false,
    error: null,
  }

  // Both empty would leave nothing gating the thesis — and the evaluator reads
  // "nothing to check" as "everything passed", so it would fire on every sweep.
  if (conditions.length === 0 && catalysts.length === 0) {
    plan.error = 'Keep at least one quant condition or catalyst.'
    return plan
  }

  const notes = (form.notes || '').trim()
  const notesChanged = (original.notes || '') !== notes
  if (form.quantMode !== original.quantMode || form.catalystMode !== original.catalystMode || notesChanged) {
    plan.thesisUpdate = {
      quant_mode: form.quantMode,
      catalyst_mode: form.catalystMode,
      ...(notesChanged ? { notes: notes || CLEAR_NOTES } : {}),
    }
  }

  const origConditions = new Map((original.quantConditions || []).map((c) => [c.id, c]))
  const origCatalysts = new Map((original.catalysts || []).map((c) => [c.id, c]))

  for (const c of conditions) {
    const body = { metric: c.metric, operator: c.operator, value: Number(c.value) }
    const orig = c.id && origConditions.get(c.id)
    if (!orig) plan.addConditions.push(body)
    else if (!sameCondition(body, orig)) plan.updateConditions.push({ id: c.id, body })
  }

  for (const c of catalysts) {
    const orig = c.id && origCatalysts.get(c.id)
    if (!orig) plan.addCatalysts.push({ state: 'unconfirmed', description: c.description })
    else if (c.description !== orig.description) {
      // Description only: sending `state` would reset the catalyst and orphan the
      // evidence the classifier has already gathered against it.
      plan.updateCatalysts.push({ id: c.id, body: { description: c.description } })
    }
  }

  const keptConditionIds = new Set(conditions.map((c) => c.id).filter(Boolean))
  const keptCatalystIds = new Set(catalysts.map((c) => c.id).filter(Boolean))
  plan.removeConditionIds = [...origConditions.keys()].filter((id) => !keptConditionIds.has(id))
  plan.removeCatalystIds = [...origCatalysts.keys()].filter((id) => !keptCatalystIds.has(id))

  plan.empty = !plan.thesisUpdate &&
    !plan.addConditions.length && !plan.updateConditions.length && !plan.removeConditionIds.length &&
    !plan.addCatalysts.length && !plan.updateCatalysts.length && !plan.removeCatalystIds.length

  return plan
}
