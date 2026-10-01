'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-[var(--color-muted)]">
        The site could not load its content. The API may be unreachable.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-surface)]"
      >
        Try again
      </button>
    </div>
  )
}
