// The body of a thesis form — quant conditions, catalysts, their combination
// modes, and notes. Shared by NewThesisModal and EditThesisModal so the two can
// never drift on the metric list, the operators, or the field styling.
//
// Rows are `{ key, id, ... }`: `key` is a stable local identity for React (a
// row's array index isn't — removing one above it would re-key every row below
// and hand the wrong text to the wrong input). `id` is the backend's row id, and
// null on a row the user just added — that's exactly the flag EditThesisModal's
// diff reads to decide POST vs PUT.

// Metrics the backend can actually fetch (quant_service.METRIC_MAP) + the
// operators it accepts (VALID_OPERATORS). Keeping the UI to these avoids
// creating conditions the evaluator can never resolve.
export const METRICS = [
  'forward_pe', 'trailing_pe', 'price_to_book', 'price_to_sales', 'peg_ratio',
  'market_cap', 'dividend_yield', 'beta', 'current_price', 'eps',
  'profit_margin', 'revenue_growth', 'debt_to_equity',
]
export const OPERATORS = ['<', '<=', '>', '>=', '==']

// Base field styling WITHOUT a width — callers set width explicitly, so we never
// mix `w-full` with `flex-1`/`w-*` (Tailwind resolves such conflicts by CSS
// order, which silently collapsed the metric select before).
export const field =
  'px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white ' +
  'placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/40 focus:bg-white/[0.06] transition-colors'
export const fieldFull = `${field} w-full`

let nextKey = 0
const newKey = () => `row-${nextKey++}`

export const blankCondition = () => ({ key: newKey(), id: null, metric: 'forward_pe', operator: '<', value: '' })
export const blankCatalyst = () => ({ key: newKey(), id: null, description: '' })

// A loaded thesis -> editable rows. Values become strings: they live in
// <input>s, and a controlled numeric input needs a string to stay controlled.
export const conditionRows = (thesis) =>
  (thesis?.quantConditions || []).map((c) => ({
    key: newKey(), id: c.id, metric: c.metric, operator: c.operator, value: String(c.value),
  }))

export const catalystRows = (thesis) =>
  (thesis?.catalysts || []).map((c) => ({ key: newKey(), id: c.id, description: c.description }))

export function Segmented({ value, options, onChange }) {
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

export default function ThesisFields({
  quantMode, onQuantMode,
  catalystMode, onCatalystMode,
  conditions, onConditions,
  catalysts, onCatalysts,
  notes, onNotes,
}) {
  const setCond = (key, k, v) => onConditions(conditions.map((c) => (c.key === key ? { ...c, [k]: v } : c)))
  const rmCond = (key) => onConditions(conditions.filter((c) => c.key !== key))
  const addCond = () => onConditions([...conditions, blankCondition()])

  const setCat = (key, v) => onCatalysts(catalysts.map((c) => (c.key === key ? { ...c, description: v } : c)))
  const rmCat = (key) => onCatalysts(catalysts.filter((c) => c.key !== key))
  const addCat = () => onCatalysts([...catalysts, blankCatalyst()])

  return (
    <>
      {/* quant conditions — mode toggle lives with the section it governs */}
      <div className="space-y-2">
        <SectionHeader title="Quant conditions">
          <Segmented value={quantMode} onChange={onQuantMode}
            options={[{ value: 'ANY', label: 'Any pass' }, { value: 'ALL', label: 'All pass' }]} />
        </SectionHeader>

        {conditions.map((c) => (
          <div key={c.key} className="flex gap-1.5 items-center">
            <select className={`${field} flex-1 min-w-0`} value={c.metric}
              onChange={(e) => setCond(c.key, 'metric', e.target.value)}>
              {METRICS.map((m) => <option key={m} value={m} className="bg-slate-800">{m.replace(/_/g, ' ')}</option>)}
            </select>
            <select className={`${field} w-[4.5rem] flex-shrink-0`} value={c.operator}
              onChange={(e) => setCond(c.key, 'operator', e.target.value)}>
              {OPERATORS.map((o) => <option key={o} value={o} className="bg-slate-800">{o}</option>)}
            </select>
            <input className={`${field} w-24 flex-shrink-0`} type="number" step="any" placeholder="value"
              value={c.value} onChange={(e) => setCond(c.key, 'value', e.target.value)} />
            <button type="button" onClick={() => rmCond(c.key)}
              className="w-8 h-8 flex-shrink-0 rounded-lg text-slate-500 hover:text-rose-400" aria-label="Remove condition">✕</button>
          </div>
        ))}
        <button type="button" onClick={addCond} className="text-xs text-emerald-400 hover:text-emerald-300">+ Add condition</button>
      </div>

      {/* catalysts */}
      <div className="space-y-2">
        <SectionHeader title="Catalysts">
          <Segmented value={catalystMode} onChange={onCatalystMode}
            options={[
              { value: 'ANY', label: 'Any confirmed' },
              { value: 'ALL', label: 'All confirmed' },
              { value: 'NONE_REQUIRED', label: 'Not required' },
            ]} />
        </SectionHeader>
        <p className="text-[11px] text-slate-600 -mt-1">Plain-language events the agent classifies news against.</p>

        {catalysts.map((c) => (
          <div key={c.key} className="flex gap-1.5 items-center">
            <input className={`${field} flex-1 min-w-0`} placeholder="e.g. NVIDIA announces a new data-center GPU"
              value={c.description} onChange={(e) => setCat(c.key, e.target.value)} />
            <button type="button" onClick={() => rmCat(c.key)}
              className="w-8 h-8 flex-shrink-0 rounded-lg text-slate-500 hover:text-rose-400" aria-label="Remove catalyst">✕</button>
          </div>
        ))}
        <button type="button" onClick={addCat} className="text-xs text-emerald-400 hover:text-emerald-300">+ Add catalyst</button>
      </div>

      {/* notes */}
      <label className="block">
        <span className="text-xs text-slate-500 mb-1.5 block">Notes (optional)</span>
        <textarea className={`${fieldFull} resize-none`} rows={2} placeholder="Why you're watching this…"
          value={notes} onChange={(e) => onNotes(e.target.value)} />
      </label>
    </>
  )
}
