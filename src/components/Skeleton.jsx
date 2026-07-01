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
    <div className="glass p-5 space-y-5">
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

export default Skeleton
