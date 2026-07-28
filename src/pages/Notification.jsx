import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { adaptAlerts } from '../api/adapt'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/GlassCard'
import SignedOut from '../components/SignedOut'
import { AlertCardSkeleton, Skeleton } from '../components/Skeleton'

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
    <GlassCard className="p-4 sm:p-5 space-y-4">
      {/* header row */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <Link
            to={`/thesis/${alert.thesisId}`}
            className="text-base font-bold text-white hover:text-emerald-300 transition-colors flex-shrink-0"
          >
            {alert.ticker || '—'}
          </Link>
          {alert.thesisNotes && (
            <span className="text-xs text-slate-500 truncate sm:max-w-[260px]" title={alert.thesisNotes}>
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

      {/* footer row — same hairline-separated meta strip as ProposalCard */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1 border-t border-white/[0.05]">
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
    <GlassCard className="px-6 py-10 text-center">
      <p className="text-slate-500 text-sm">No alerts yet.</p>
      <p className="text-slate-600 text-xs mt-1">
        Alerts appear here when a thesis meets its conditions and fires a signal.
      </p>
    </GlassCard>
  )
}

// ── page ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function Notification() {
  const { user, loading: authLoading } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  // Starts true, not `!!user`: on a hard refresh `user` is still null while the
  // token refresh is in flight, and seeding false let the empty state flash
  // between auth resolving and the first page landing.
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const loadPage = useCallback(async (p, append = false) => {
    if (!user) { setLoading(false); return }
    if (append) setLoadingMore(true)
    else { setLoading(true); setError(null) }
    try {
      const raw = await api.notification.getAllAlerts(p, PAGE_SIZE)
      const { alerts: incoming, totalPages: tp } = adaptAlerts(raw)
      setAlerts((prev) => append ? [...prev, ...incoming] : incoming)
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
    setAlerts([])
    loadPage(1)
    localStorage.setItem('kestrel_alerts_last_seen', Date.now().toString())
  }, [loadPage])

  const groups = groupByDate(alerts)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">
          Alerts fired when a thesis met its conditions.
        </p>
      </div>

      {authLoading || loading ? (
        <section className="space-y-3">
          <Skeleton className="h-2.5 w-24" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <AlertCardSkeleton key={i} />)}
          </div>
        </section>
      ) : !user ? (
        <SignedOut
          icon="🔔"
          title="Sign in to see your notifications"
          body="Use the account menu (top right) to sign in or create an account. Alerts from your theses appear here."
        />
      ) : error ? (
        <GlassCard className="px-6 py-10 text-center">
          <p className="text-rose-400 text-sm mb-3">{error}</p>
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
        <>
          {groups.map(({ label, items }) => (
            <section key={label} className="space-y-3">
              <h2 className="text-xs text-slate-500 uppercase tracking-widest">
                {label} ({items.length})
              </h2>
              <div className="space-y-4">
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
        </>
      )}
    </div>
  )
}
