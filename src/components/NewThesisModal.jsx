import { useState } from 'react'
import Modal from './Modal'
import { api } from '../api/client'

// Metrics the backend can actually fetch (quant_service.METRIC_MAP) + the
// operators it accepts (VALID_OPERATORS). Keeping the UI to these avoids
// creating conditions the evaluator can never resolve.
const METRICS = [
  'forward_pe', 'trailing_pe', 'price_to_book', 'price_to_sales', 'peg_ratio',
  'market_cap', 'dividend_yield', 'beta', 'current_price', 'eps',
  'profit_margin', 'revenue_growth', 'debt_to_equity',
]
const OPERATORS = ['<', '<=', '>', '>=', '==']

// Base field styling WITHOUT a width — callers set width explicitly, so we never
// mix `w-full` with `flex-1`/`w-*` (Tailwind resolves such conflicts by CSS
// order, which silently collapsed the metric select before).
const field =
  'px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white ' +
  'placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/40 focus:bg-white/[0.06] transition-colors'
const fieldFull = `${field} w-full`

function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-white/[0.03] p-0.5 border border-white/[0.06]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            value === o.value ? 'bg-emerald-400/15 text-emerald-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SectionHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500">{title}</span>
      {children}
    </div>
  )
}

export default function NewThesisModal({ open, onClose, onCreated }) {
  const [ticker, setTicker] = useState('')
  const [notes, setNotes] = useState('')
  const [quantMode, setQuantMode] = useState('ANY')
  const [catalystMode, setCatalystMode] = useState('ANY')
  const [conditions, setConditions] = useState([{ metric: 'forward_pe', operator: '<', value: '' }])
  const [catalysts, setCatalysts] = useState([''])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setTicker(''); setNotes(''); setQuantMode('ANY'); setCatalystMode('ANY')
    setConditions([{ metric: 'forward_pe', operator: '<', value: '' }]); setCatalysts(['']); setError('')
  }

  const setCond = (i, k, v) => setConditions((cs) => cs.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)))
  const addCond = () => setConditions((cs) => [...cs, { metric: 'forward_pe', operator: '<', value: '' }])
  const rmCond = (i) => setConditions((cs) => cs.filter((_, idx) => idx !== i))

  const setCat = (i, v) => setCatalysts((cs) => cs.map((c, idx) => (idx === i ? v : c)))
  const addCat = () => setCatalysts((cs) => [...cs, ''])
  const rmCat = (i) => setCatalysts((cs) => cs.filter((_, idx) => idx !== i))

  const submit = async (e) => {
    e.preventDefault()
    if (!ticker.trim()) { setError('Enter a ticker.'); return }

    const quant_conditions = conditions
      .filter((c) => c.value !== '' && !Number.isNaN(Number(c.value)))
      .map((c) => ({ metric: c.metric, operator: c.operator, value: Number(c.value) }))
    const cats = catalysts
      .map((d) => d.trim())
      .filter(Boolean)
      .map((description) => ({ state: 'unconfirmed', description }))

    if (quant_conditions.length === 0 && cats.length === 0) {
      setError('Add at least one quant condition or catalyst.')
      return
    }

    setBusy(true); setError('')
    try {
      await api.theses.create({
        ticker: ticker.trim().toUpperCase(),
        quant_mode: quantMode,
        catalyst_mode: catalystMode,
        notes: notes.trim() || null,
        quant_conditions,
        catalysts: cats,
      })
      reset()
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to create thesis.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New thesis"
      subtitle="A ticker, the quant conditions and catalysts to watch. The agent monitors it every sweep."
      maxWidth="max-w-lg"
    >
      <form onSubmit={submit} className="space-y-5">
        {/* ticker */}
        <label className="block">
          <span className="text-xs text-slate-500 mb-1.5 block">Ticker</span>
          <input className={`${fieldFull} uppercase`} placeholder="NVDA" value={ticker}
            onChange={(e) => setTicker(e.target.value)} autoFocus />
        </label>

        {/* quant conditions — mode toggle lives with the section it governs */}
        <div className="space-y-2">
          <SectionHeader title="Quant conditions">
            <Segmented value={quantMode} onChange={setQuantMode}
              options={[{ value: 'ANY', label: 'Any pass' }, { value: 'ALL', label: 'All pass' }]} />
          </SectionHeader>

          {conditions.map((c, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <select className={`${field} flex-1 min-w-0`} value={c.metric} onChange={(e) => setCond(i, 'metric', e.target.value)}>
                {METRICS.map((m) => <option key={m} value={m} className="bg-slate-800">{m.replace(/_/g, ' ')}</option>)}
              </select>
              <select className={`${field} w-[4.5rem] flex-shrink-0`} value={c.operator} onChange={(e) => setCond(i, 'operator', e.target.value)}>
                {OPERATORS.map((o) => <option key={o} value={o} className="bg-slate-800">{o}</option>)}
              </select>
              <input className={`${field} w-24 flex-shrink-0`} type="number" step="any" placeholder="value"
                value={c.value} onChange={(e) => setCond(i, 'value', e.target.value)} />
              <button type="button" onClick={() => rmCond(i)} disabled={conditions.length === 1}
                className="w-8 h-8 flex-shrink-0 rounded-lg text-slate-500 hover:text-rose-400 disabled:opacity-30" aria-label="Remove">✕</button>
            </div>
          ))}
          <button type="button" onClick={addCond} className="text-xs text-emerald-400 hover:text-emerald-300">+ Add condition</button>
        </div>

        {/* catalysts */}
        <div className="space-y-2">
          <SectionHeader title="Catalysts">
            <Segmented value={catalystMode} onChange={setCatalystMode}
              options={[
                { value: 'ANY', label: 'Any confirmed' },
                { value: 'ALL', label: 'All confirmed' },
                { value: 'NONE_REQUIRED', label: 'Not required' },
              ]} />
          </SectionHeader>
          <p className="text-[11px] text-slate-600 -mt-1">Plain-language events the agent classifies news against.</p>

          {catalysts.map((c, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <input className={`${field} flex-1 min-w-0`} placeholder="e.g. NVIDIA announces a new data-center GPU"
                value={c} onChange={(e) => setCat(i, e.target.value)} />
              <button type="button" onClick={() => rmCat(i)} disabled={catalysts.length === 1}
                className="w-8 h-8 flex-shrink-0 rounded-lg text-slate-500 hover:text-rose-400 disabled:opacity-30" aria-label="Remove">✕</button>
            </div>
          ))}
          <button type="button" onClick={addCat} className="text-xs text-emerald-400 hover:text-emerald-300">+ Add catalyst</button>
        </div>

        {/* notes */}
        <label className="block">
          <span className="text-xs text-slate-500 mb-1.5 block">Notes (optional)</span>
          <textarea className={`${fieldFull} resize-none`} rows={2} placeholder="Why you're watching this…"
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button type="submit" disabled={busy}
            className="text-sm px-4 py-2 rounded-lg bg-emerald-400 text-slate-900 font-semibold hover:bg-emerald-300 transition-colors disabled:opacity-50">
            {busy ? 'Creating…' : 'Create thesis'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
