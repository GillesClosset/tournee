import { SkeletonCard } from '@/components/ui/skeleton-card'

export default function WeekLoading() {
  return (
    <div className="space-y-4">
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-28 animate-pulse rounded bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded bg-muted" />
      </div>
      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
