const apiUrl = process.env['API_URL'] ?? 'http://localhost:4000'

interface Health {
  status: string
  db: string
  uptime: number
}

/**
 * Phase 1 placeholder. Fetching /health from a server component proves the web
 * app can reach the API; phase 7 replaces this with the real home page and the
 * typed client in lib/api.
 */
async function getHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${apiUrl}/health`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as Health
  } catch {
    return null
  }
}

export default async function Home() {
  const health = await getHealth()

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-5 px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Phase 1</p>
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Portfolio, with a CMS built from scratch
      </h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">
        Scaffold only. The hero, projects, blog and everything else arrive in phase 7.
      </p>
      <dl className="mt-2 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <dt className="font-medium">API health</dt>
        <dd className="mt-1 text-neutral-600 dark:text-neutral-400">
          {health ? (
            <>
              {health.status} · db {health.db} · up {health.uptime}s
            </>
          ) : (
            <>Could not reach {apiUrl}</>
          )}
        </dd>
      </dl>
    </main>
  )
}
