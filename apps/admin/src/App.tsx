import { useEffect, useState } from 'react'

const apiUrl = import.meta.env['VITE_API_URL'] ?? 'http://localhost:4000'

interface Health {
  status: string
  db: string
  uptime: number
}

/**
 * Phase 1 placeholder. It calls /health so the scaffold proves the admin can
 * reach the API through CORS; phase 5 replaces this with the real router.
 */
export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${apiUrl}/health`, { signal: controller.signal })
      .then((res) =>
        res.ok ? (res.json() as Promise<Health>) : Promise.reject(new Error(String(res.status))),
      )
      .then(setHealth)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [])

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Phase 1</p>
      <h1 className="text-3xl font-semibold tracking-tight">Portfolio admin</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Scaffold only. The login screen, layout and dashboard arrive in phase 5.
      </p>
      <div className="rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <p className="font-medium">API health</p>
        {health ? (
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {health.status} · db {health.db} · up {health.uptime}s
          </p>
        ) : error ? (
          <p className="mt-1 text-red-600">
            Could not reach {apiUrl}: {error}
          </p>
        ) : (
          <p className="mt-1 text-neutral-500">checking…</p>
        )}
      </div>
    </main>
  )
}
