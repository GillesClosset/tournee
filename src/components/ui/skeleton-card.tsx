import { cn } from '@/lib/utils'

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 shadow-sm', className)}>
      <div className="space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex gap-4 border-b border-border px-4 py-3">
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/6 animate-pulse rounded bg-muted" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-border px-4 py-3 last:border-b-0">
          <div className="h-3 w-1/4 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-1/6 animate-pulse rounded bg-muted/60" />
        </div>
      ))}
    </div>
  )
}
