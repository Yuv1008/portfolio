import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-muted)]">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-[var(--color-muted)]">
        That page does not exist, or it is not published.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        Back home
      </Link>
    </div>
  )
}
