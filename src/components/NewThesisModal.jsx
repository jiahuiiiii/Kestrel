import { useState, useEffect } from 'react'
import Modal from './Modal'
import { api } from '../api/client'
import ThesisFields, { blankCatalyst, blankCondition, fieldFull } from './ThesisFields'
// Same "what counts as a real row" rules the edit diff uses, so the two forms
// can't disagree about which blank rows to ignore.
import { validCatalysts, validConditions } from '../lib/thesisDiff'

export default function NewThesisModal({ open, onClose, onCreated }) {
  const [ticker, setTicker] = useState('')
  const [tickers, setTickers] = useState([]);
  const [tickersLoading, setTickersLoading] = useState(true);
  const [tickersError, setTickersError] = useState(null);

  const [notes, setNotes] = useState('')
  const [quantMode, setQuantMode] = useState('ANY')
  const [catalystMode, setCatalystMode] = useState('ANY')
  const [conditions, setConditions] = useState([blankCondition()])
  const [catalysts, setCatalysts] = useState([blankCatalyst()])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const response = api.stocks.getAllListedStocks()
      .then((data) => setTickers(data.stocks))
      .catch((err) => setTickersError(err.message))
      .finally(() => setTickersLoading(false));
  }, []);

  const reset = () => {
    setTicker(''); setNotes(''); setQuantMode('ANY'); setCatalystMode('ANY')
    setConditions([blankCondition()]); setCatalysts([blankCatalyst()]); setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!ticker.trim()) { setError('Enter a ticker.'); return }

    const quant_conditions = validConditions(conditions)
      .map((c) => ({ metric: c.metric, operator: c.operator, value: Number(c.value) }))
    const cats = validCatalysts(catalysts)
      .map((c) => ({ state: 'unconfirmed', description: c.description }))

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
          {tickersError ? (
            <p className='text-xs text-red-400'>{tickersError}</p>
          ) : (
            <select className={`${fieldFull} uppercase`} value={ticker} onChange={(e) => setTicker(e.target.value)} disabled={tickersLoading} autoFocus>
              {tickersLoading ? (
                <option>Loading....</option>
              ) : (
                tickers.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))
              )}
            </select>
          )}
        </label>

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
            {busy ? 'Creating…' : 'Create thesis'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
