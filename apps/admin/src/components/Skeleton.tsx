export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div
    aria-hidden
    className={`animate-pulse rounded-md bg-neutral-800 motion-reduce:animate-none ${className}`}
  />
)

export const SkeletonCard = () => (
  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
    <Skeleton className="h-3 w-20" />
    <Skeleton className="mt-3 h-8 w-12" />
  </div>
)

export const SkeletonRows = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
)

export const FullPageSpinner = ({ label = 'Loading' }: { label?: string }) => (
  <div className="flex min-h-dvh items-center justify-center bg-neutral-950">
    <span className="sr-only">{label}</span>
    <div className="border-t-accent size-6 animate-spin rounded-full border-2 border-neutral-700 motion-reduce:animate-none" />
  </div>
)
