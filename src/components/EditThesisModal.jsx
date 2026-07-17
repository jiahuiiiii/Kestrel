import { useEffect, useState } from 'react'
import Modal from './Modal'
import { api } from '../api/client'
import ThesisFields, { catalystRows, conditionRows } from './ThesisFields'
import { diffThesis } from '../lib/thesisDiff'

// Loads a thesis into a form and, on save, applies the difference row by row.
// The "what changed" reasoning is all in lib/thesisDiff — this executes it.

export default function EditThesisModal({ open, onClose, thesis, onSaved }) {
  const [quantMode, setQuantMode] = useState('ANY')
  const [catalystMode, setCatalystMode] = useState('ANY')
  const [conditions, setConditions] = useState([])
  const [catalysts, setCatalysts] = useState([])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Re-seed each time the modal opens so a cancelled edit doesn't linger, and a
  // thesis changed by a sweep in the background doesn't get saved back stale.
  useEffect(() => {
    if (!open || !thesis) return
    setQuantMode(thesis.quantMode || 'ANY')
    setCatalystMode(thesis.catalystMode || 'ANY')
    setConditions(conditionRows(thesis))
    setCatalysts(catalystRows(thesis))
    setNotes(thesis.notes || '')
    setError('')
  }, [open, thesis])

  const submit = async (e) => {
    e.preventDefault()
    const plan = diffThesis(thesis, { quantMode, catalystMode, notes, conditions, catalysts })
    if (plan.error) { setError(plan.error); return }
    if (plan.empty) { onClose(); return }

    const id = thesis.id
    setBusy(true); setError('')
    try {
      if (plan.thesisUpdate) await api.theses.update(id, plan.thesisUpdate)

      for (const body of plan.addConditions) await api.theses.addCondition(id, body)
      for (const { id: cid, body } of plan.updateConditions) await api.theses.updateCondition(id, cid, body)
      for (const cid of plan.removeConditionIds) await api.theses.removeCondition(id, cid)

      for (const body of plan.addCatalysts) await api.theses.addCatalyst(id, body)
      for (const { id: cid, body } of plan.updateCatalysts) await api.theses.updateCatalyst(id, cid, body)
      for (const cid of plan.removeCatalystIds) await api.theses.removeCatalyst(id, cid)

      onSaved?.()
      onClose()
    } catch (err) {
      // Row-by-row means a mid-flight failure leaves earlier edits applied. Say
      // so, and refetch so the page shows what actually landed rather than the
      // form's optimistic version of it.
      setError(`${err?.message || 'Failed to save thesis.'} — some changes may have been applied; reopen to check.`)
      onSaved?.()
    } finally {
      setBusy(false)
    }
  }

  if (!thesis) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${thesis.ticker}`}
      subtitle="Change what the agent watches. The ticker is fixed — create a new thesis for a different stock."
      maxWidth="max-w-lg"
    >
      <form onSubmit={submit} className="space-y-5">
        <ThesisFields
          quantMode={quantMode} onQuantMode={setQuantMode}
          catalystMode={catalystMode} onCatalystMode={setCatalystMode}
          conditions={conditions} onConditions={setConditions}
          catalysts={catalysts} onCatalysts={setCatalysts}
          notes={notes} onNotes={setNotes}
        />

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button type="submit" disabled={busy}
            className="text-sm px-4 py-2 rounded-lg bg-emerald-400 text-slate-900 font-semibold hover:bg-emerald-300 transition-colors disabled:opacity-50">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
