// Loading placeholders. An empty screen mid-demo reads as "broken"; a shimmering
// skeleton reads as "working." Use these while an evaluation / list is in flight.

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-md ${className}`} />
}

// A line of text-sized skeleton, optionally shortened (last line of a paragraph).
export function SkeletonText({ className = '', width = 'w-full' }) {
  return <div className={`skeleton h-3 rounded ${width} ${className}`} />
}

// Full-panel placeholder matching the AgentReasoningPanel layout, so the swap
// from loading → loaded doesn't jump the page.
export function ReasoningPanelSkeleton() {
  return (
    <div className="glass p-4 sm:p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-2.5 w-24" />
          <SkeletonText width="w-3/4" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-2 w-28" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-2 w-24" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  )
}

// ── Card-shaped placeholders ───────────────────────────────────────────────
// Each mirrors the real card it stands in for — same wrapper, padding and row
// count — so a list doesn't reflow when the data lands. Section headings and
// page titles are static text, so pages keep rendering those for real and only
// skeleton the part that's actually in flight.

// Dashboard stat pill.
export function StatPillSkeleton() {
  return (
    <div className="glass px-3 py-3 sm:px-4 sm:py-3.5 flex items-center gap-2.5 sm:gap-3.5">
      <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0" />
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  )
}

// Dashboard watchlist card.
export function ThesisCardSkeleton() {
  return (
    <div className="glass p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <SkeletonText width="w-2/3" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>

      <div className="space-y-1.5">
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>

      <div className="pt-2 border-t border-white/[0.05] space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-2.5 w-12" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-end">
          <Skeleton className="h-2.5 w-28" />
        </div>
      </div>
    </div>
  )
}

// Proposals card.
export function ProposalCardSkeleton() {
  return (
    <div className="glass p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-4 w-28 rounded-full" />
        </div>
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>

      <Skeleton className="h-11 w-full rounded-lg" />

      <div className="space-y-2">
        <SkeletonText width="w-full" />
        <SkeletonText width="w-4/5" />
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.05]">
        <Skeleton className="h-2.5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Notifications alert card. Deliberately the same shell as ProposalCardSkeleton
// — the two pages sit next to each other in the nav and used to load into
// visibly different column widths and card rhythms.
export function AlertCardSkeleton() {
  return (
    <div className="glass p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      <div className="space-y-2">
        <SkeletonText width="w-full" />
        <SkeletonText width="w-4/5" />
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.05]">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    </div>
  )
}

// ThesisDetail evaluation timeline rail.
export function TimelineSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="relative pl-7">
          <Skeleton className="absolute left-0 top-[13px] w-3.5 h-3.5 rounded-full" />
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Skeleton
