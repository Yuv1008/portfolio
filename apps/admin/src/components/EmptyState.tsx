import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="rounded-xl border border-dashed border-neutral-800 px-6 py-12 text-center">
    <p className="text-sm font-medium text-neutral-200">{title}</p>
    {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
    {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
  </div>
)

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-6 py-8 text-center">
    <p className="text-sm font-medium text-red-200">{message}</p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-200 transition hover:bg-red-500/10"
      >
        Try again
      </button>
    ) : null}
  </div>
)
