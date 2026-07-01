import { useState } from 'react'
import { THESES } from '../data/mock'
import ThesisCard from '../components/ThesisCard'

function StatPill({ label, value, icon, accent = false }) {
  return (
    <div className={`glass px-4 py-3.5 flex items-center gap-3.5 ${
      accent ? 'ring-1 ring-emerald-400/25 bg-emerald-400/[0.04]' : ''
    }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${
        accent ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/[0.05] text-slate-400'
      }`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={`tabular text-2xl font-bold leading-none ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
        <span className="text-xs text-slate-500 truncate">{label}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [theses] = useState(THESES)

  const signalCount  = theses.filter(t => t.signal).length
  const watchCount   = theses.filter(t => !t.signal).length

  // sort: signals first, then alphabetical
  const sorted = [...theses].sort((a, b) => {
    if (a.signal !== b.signal) return a.signal ? -1 : 1
    return a.ticker.localeCompare(b.ticker)
  })

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* heading */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Watchlist</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitoring {theses.length} theses · last sweep{' '}
          <span className="text-slate-400">Jul 1, 2026, 06:00</span>
        </p>
      </div>

      {/* stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill label="Active theses"     value={theses.length} icon="◎" />
        <StatPill label="Signals triggered" value={signalCount}    icon="↗" accent={signalCount > 0} />
        <StatPill label="Watching"          value={watchCount}     icon="◔" />
        <StatPill label="Pending proposals" value={2}              icon="⁝" />
      </div>

      {/* thesis grid */}
      {signalCount > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Signals</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.filter(t => t.signal).map(t => (
              <ThesisCard key={t.id} thesis={t} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs text-slate-500 uppercase tracking-widest">Watching</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.filter(t => !t.signal).map(t => (
            <ThesisCard key={t.id} thesis={t} />
          ))}
        </div>
      </section>
    </div>
  )
}
