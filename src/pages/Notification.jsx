import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { adaptAlerts } from '../api/adapt'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/GlassCard'
import { Skeleton, SkeletonText } from '../components/Skeleton'

// ── helpers ────────────────────────────────────────────────────────────────

function formatRelative(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatDateGroup(iso) {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

function groupByDate(alerts) {
  const groups = []
  const seen = new Map()
  for (const a of alerts) {
    const label = formatDateGroup(a.createdAt)
    if (!seen.has(label)) {
      seen.set(label, groups.length)
      groups.push({ label, items: [] })
    }
    groups[seen.get(label)].items.push(a)
  }
  return groups
}

function channelLabel(ch) {
  if (!ch) return null
  return ch.charAt(0) + ch.slice(1).toLowerCase()
}

// ── sub-components ─────────────────────────────────────────────────────────

function AlertCardSkeleton() {
  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-16 rounded" />
          <SkeletonText width="w-2/3" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <SkeletonText width="w-full" />
      <SkeletonText width="w-4/5" />
    </GlassCard>
  )
}

function SignalBadge({ signal }) {
  return signal ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-400/15 text-emerald-300 border border-emerald-400/20">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Signal fired
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-slate-400 border border-white/[0.07]">
      No signal
    </span>
  )
}

function AlertCard({ alert }) {
  const ch = channelLabel(alert.channelsSent)

  return (
    <GlassCard className="p-4 space-y-3">
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to={`/thesis/${alert.thesisId}`}
            className="text-base font-bold text-white hover:text-emerald-300 transition-colors flex-shrink-0"
          >
            {alert.ticker || '—'}
          </Link>
          {alert.thesisNotes && (
            <span className="text-xs text-slate-500 truncate max-w-[260px]" title={alert.thesisNotes}>
              {alert.thesisNotes}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SignalBadge signal={alert.signal} />
        </div>
      </div>

      {/* reason */}
      {alert.reason && (
        <p className="text-sm text-slate-300 leading-relaxed">{alert.reason}</p>
      )}

      {/* footer row */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <span className="text-xs text-slate-600">{formatRelative(alert.createdAt)}</span>
        {ch && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            Sent via {ch}
          </span>
        )}
      </div>
    </GlassCard>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4 text-xl">
        🔔
      </div>
      <p className="text-sm font-medium text-white mb-1">No alerts yet</p>
      <p className="text-xs text-slate-500 max-w-[220px]">
        Alerts appear here when a thesis meets its conditions and fires a signal.
      </p>
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function Notification() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  // Track IDs we've already rendered so WS prepends don't duplicate
  const seenIds = useRef(new Set())

  const loadPage = useCallback(async (p, append = false) => {
    if (!user) return
    if (append) setLoadingMore(true)
    else { setLoading(true); setError(null) }
    try {
      const raw = await api.notification.getAllAlerts(p, PAGE_SIZE)
      const { alerts: incoming, totalPages: tp } = adaptAlerts(raw)
      setAlerts((prev) => {
        const next = append ? [...prev] : []
        for (const a of incoming) {
          if (!seenIds.current.has(a.id)) {
            seenIds.current.add(a.id)
            next.push(a)
          }
        }
        return next
      })
      setTotalPages(tp)
      setPage(p)
    } catch {
      setError('Failed to load alerts. Try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [user])

  // Initial load + mark notifications as seen (clear unread badge)
  useEffect(() => {
    seenIds.current.clear()
    setAlerts([])
    loadPage(1)
    localStorage.setItem('kestrel_alerts_last_seen', Date.now().toString())
  }, [loadPage])

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-xl text-slate-500">🔔</div>
        <p className="text-slate-300 font-medium">Sign in to see your notifications</p>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Use the account menu (top right) to sign in or create an account. Alerts from your theses appear here.
        </p>
      </div>
    )
  }

  const groups = groupByDate(alerts)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">
          Alerts fired when a thesis met its conditions.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <AlertCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-rose-400 mb-3">{error}</p>
          <button
            onClick={() => loadPage(1)}
            className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2"
          >
            Retry
          </button>
        </GlassCard>
      ) : alerts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <section key={label}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                {label}
              </h2>
              <div className="space-y-2">
                {items.map((a) => <AlertCard key={a.id} alert={a} />)}
              </div>
            </section>
          ))}

          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => loadPage(page + 1, true)}
                disabled={loadingMore}
                className="px-5 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:bg-white/[0.05] transition-colors disabled:opacity-40"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
