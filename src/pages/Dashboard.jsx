import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { adaptThesis } from '../api/adapt'
import { useAuth } from '../context/AuthContext'
import ThesisCard from '../components/ThesisCard'
import NewThesisModal from '../components/NewThesisModal'

function StatPill({ label, value, icon, accent = false }) {
  return (
    <div className={`glass px-4 py-3.5 flex items-center gap-3.5 ${accent ? 'ring-1 ring-emerald-400/25 bg-emerald-400/[0.04]' : ''
      }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${accent ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/[0.05] text-slate-400'
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
  const { user, loading: authLoading } = useAuth()
  const [theses, setTheses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNew, setShowNew] = useState(false)

  const loadTheses = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const data = await api.theses.list()
      setTheses((data?.theses ?? []).map(adaptThesis))
      setError('')
    } catch (e) {
      // Swallow transient errors on a silent poll so a network blip doesn't
      // replace the whole watchlist with the error screen.
      if (!silent) setError(e?.message || 'Failed to load theses')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    loadTheses()
  }, [user, authLoading, loadTheses])

  // No WebSocket: poll the watchlist so statuses/signals update without a manual
  // refresh (scheduler retests every ~120s in dev). Silent = no loading flash.
  useEffect(() => {
    if (authLoading || !user) return
    const timer = setInterval(() => loadTheses({ silent: true }), 30_000)
    return () => clearInterval(timer)
  }, [user, authLoading, loadTheses])

  const signalCount = theses.filter((t) => t.signal).length
  const watchCount = theses.filter((t) => !t.signal).length

  const sorted = [...theses].sort((a, b) => {
    if (a.signal !== b.signal) return a.signal ? -1 : 1
    return a.ticker.localeCompare(b.ticker)
  })

  const lastSweep = theses
    .map((t) => t.lastEvaluated)
    .filter(Boolean)
    .sort()
    .at(-1)

  // --- gate states ---
  if (authLoading || loading) {
    return <div className="max-w-6xl mx-auto px-6 py-16 text-center text-slate-500">Loading…</div>
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-xl text-slate-500">◎</div>
        <p className="text-slate-300 font-medium">Sign in to see your watchlist</p>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Use the account menu (top right) to sign in or create an account. Your theses and their live signals appear here.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center space-y-2">
        <p className="text-rose-400 font-medium">Couldn’t load your watchlist</p>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <NewThesisModal open={showNew} onClose={() => setShowNew(false)} onCreated={loadTheses} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Watchlist</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring {theses.length} thes{theses.length === 1 ? 'is' : 'es'}
            {lastSweep && (
              <> · last sweep{' '}
                <span className="text-slate-400">
                  {new Date(lastSweep).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex-shrink-0 text-sm px-4 py-2 rounded-lg bg-emerald-400 text-slate-900 font-semibold hover:bg-emerald-300 transition-colors"
        >
          + New thesis
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill label="Active theses" value={theses.length} icon="◎" />
        <StatPill label="Signals triggered" value={signalCount} icon="↗" accent={signalCount > 0} />
        <StatPill label="Watching" value={watchCount} icon="◔" />
        <StatPill label="Pending proposals" value={0} icon="⁝" />
      </div>

      {theses.length === 0 && (
        <div className="glass px-6 py-16 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-xl text-slate-500">◎</div>
          <p className="text-slate-300 font-medium">No theses on your watchlist yet</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Add a thesis — a ticker, a few quant conditions, and the catalysts you&rsquo;re
            watching for — and the agent starts monitoring it every sweep.
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="mt-2 text-sm px-4 py-2 rounded-lg bg-emerald-400 text-slate-900 font-semibold hover:bg-emerald-300 transition-colors"
          >
            + New thesis
          </button>
        </div>
      )}

      {signalCount > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Signals</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.filter((t) => t.signal).map((t) => (
              <ThesisCard key={t.id} thesis={t} />
            ))}
          </div>
        </section>
      )}

      {watchCount > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest">Watching</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.filter((t) => !t.signal).map((t) => (
              <ThesisCard key={t.id} thesis={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
