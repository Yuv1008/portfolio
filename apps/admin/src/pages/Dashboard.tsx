import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Stats } from '@portfolio/shared'
import { api, errorMessage } from '../lib/api'
import { SkeletonCard, SkeletonRows } from '../components/Skeleton'
import { EmptyState, ErrorState } from '../components/EmptyState'

const CARDS: { key: keyof Stats['counts']; label: string; to: string }[] = [
  { key: 'projects', label: 'Projects', to: '/projects' },
  { key: 'blogs', label: 'Posts', to: '/blogs' },
  { key: 'skills', label: 'Skills', to: '/skills' },
  { key: 'experience', label: 'Experience', to: '/experience' },
  { key: 'testimonials', label: 'Testimonials', to: '/testimonials' },
  { key: 'services', label: 'Services', to: '/services' },
  { key: 'media', label: 'Media', to: '/media' },
  { key: 'messages', label: 'Messages', to: '/messages' },
]

const formatDate = (value: string | Date): string =>
  new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export default function Dashboard() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: async ({ signal }) => {
      const res = await api.get<Stats>('/admin/stats', { signal })
      return res.data
    },
  })

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {data
            ? `${String(data.unreadMessages)} unread ${data.unreadMessages === 1 ? 'message' : 'messages'}`
            : 'Everything in your CMS at a glance.'}
        </p>
      </header>

      {error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <section aria-label="Content counts">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {isPending
                ? CARDS.map((card) => <SkeletonCard key={card.key} />)
                : CARDS.map((card) => (
                    <Link
                      key={card.key}
                      to={card.to}
                      className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-700 hover:bg-neutral-800/60"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                        {card.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold tabular-nums">
                        {data.counts[card.key]}
                      </p>
                    </Link>
                  ))}
            </div>
          </section>

          <section aria-label="Recent messages" className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-neutral-200">Recent messages</h2>
              <Link to="/messages" className="text-accent text-sm hover:underline">
                View all
              </Link>
            </div>

            {isPending ? (
              <SkeletonRows rows={3} />
            ) : data.recentMessages.length === 0 ? (
              <EmptyState
                title="No messages yet"
                description="Submissions from the contact form will appear here."
              />
            ) : (
              <ul className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800">
                {data.recentMessages.map((message) => (
                  <li key={message.id} className="flex gap-3 bg-neutral-900 px-4 py-3">
                    <span
                      aria-hidden
                      className={`mt-2 size-2 shrink-0 rounded-full ${
                        message.read ? 'bg-transparent' : 'bg-accent'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          message.read ? 'text-neutral-300' : 'font-medium text-neutral-100'
                        }`}
                      >
                        {message.subject}
                        {message.read ? null : <span className="sr-only"> (unread)</span>}
                      </p>
                      <p className="truncate text-sm text-neutral-500">
                        {message.name} · {message.email}
                      </p>
                    </div>
                    <time
                      dateTime={new Date(message.createdAt).toISOString()}
                      className="shrink-0 text-xs text-neutral-500"
                    >
                      {formatDate(message.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
