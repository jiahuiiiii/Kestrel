import { useEffect, useMemo, useRef, useState } from 'react'
import { field } from './ThesisFields'

// A type-to-search ticker picker: the user types and we suggest matching
// tickers instead of dumping the whole listed universe into a native <select>
// (thousands of options nobody can scroll). Matches that *start* with the query
// rank above mere substring matches, so typing "AA" surfaces AAPL before CAAP.
const MAX_SUGGESTIONS = 8

export default function TickerCombobox({ value, onChange, tickers, loading, error, autoFocus }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0) // highlighted suggestion index
  const wrapRef = useRef(null)

  // Keep the text in sync if the selected value is changed from outside.
  useEffect(() => { setQuery(value || '') }, [value])

  // Close the suggestion list on any click outside the widget.
  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const suggestions = useMemo(() => {
    const q = query.trim().toUpperCase()
    if (!q) return tickers.slice(0, MAX_SUGGESTIONS)
    const starts = [], contains = []
    for (const t of tickers) {
      const u = t.toUpperCase()
      if (u.startsWith(q)) starts.push(t)
      else if (u.includes(q)) contains.push(t)
      if (starts.length >= MAX_SUGGESTIONS) break
    }
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
  }, [query, tickers])

  const choose = (t) => {
    onChange(t)
    setQuery(t)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      if (open && suggestions[active]) { e.preventDefault(); choose(suggestions[active]) }
    } else if (e.key === 'Escape') { setOpen(false) }
  }

  if (error) return <p className="text-xs text-rose-400">{error}</p>

  return (
    <div ref={wrapRef} className="relative">
      <input
        className={`${field} w-full uppercase`}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={loading ? 'Loading tickers…' : 'Type a ticker, e.g. AAPL'}
        disabled={loading}
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => {
          const v = e.target.value.toUpperCase()
          setQuery(v)
          onChange(v)        // keep the form's value live with what's typed
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && !loading && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-white/[0.08] bg-slate-800 shadow-xl py-1">
          {suggestions.map((t, i) => (
            <li key={t}>
              <button
                type="button"
                // onMouseDown fires before the input's blur, so the click lands.
                onMouseDown={(e) => { e.preventDefault(); choose(t) }}
                onMouseEnter={() => setActive(i)}
                className={`w-full text-left px-3 py-1.5 text-sm uppercase transition-colors ${
                  i === active ? 'bg-emerald-400/15 text-emerald-300' : 'text-white hover:bg-white/[0.06]'
                }`}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim() && suggestions.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-white/[0.08] bg-slate-800 shadow-xl px-3 py-2 text-xs text-slate-500">
          No tickers match “{query}”.
        </div>
      )}
    </div>
  )
}
