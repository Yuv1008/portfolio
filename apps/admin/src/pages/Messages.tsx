import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Message, Paginated } from '@portfolio/shared'
import { api, errorMessage } from '../lib/api'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../components/Toast'
import { Skeleton } from '../components/Skeleton'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/Modal'

const formatDateTime = (value: string | Date): string =>
  new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function Messages() {
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Message | null>(null)
  const q = useDebounced(search, 300)

  const listKey = ['messages', { q, page }] as const

  const list = useQuery({
    queryKey: listKey,
    queryFn: async ({ signal }) => {
      const res = await api.get<Paginated<Message>>('/admin/messages', {
        signal,
        params: { page, limit: 20, ...(q ? { q } : {}) },
      })
      return res.data
    },
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['messages'] })
    void queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  const setRead = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      await api.patch(`/admin/messages/${id}/read`, { read })
    },
    onMutate: async ({ id, read }) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<Paginated<Message>>(listKey)
      queryClient.setQueryData<Paginated<Message>>(listKey, (current) =>
        current
          ? { ...current, items: current.items.map((m) => (m.id === id ? { ...m, read } : m)) }
          : current,
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous)
      notify(errorMessage(error), 'error')
    },
    onSettled: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/messages/${id}`)
    },
    onSuccess: () => {
      invalidate()
      notify('Message deleted', 'success')
      setDeleting(null)
    },
    onError: (error) => {
      notify(errorMessage(error), 'error')
      setDeleting(null)
    },
  })

  const toggleExpanded = (message: Message) => {
    const opening = expanded !== message.id
    setExpanded(opening ? message.id : null)
    // Opening a message is the natural moment to mark it read.
    if (opening && !message.read) setRead.mutate({ id: message.id, read: true })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {list.data ? `${String(list.data.total)} total` : 'From the contact form'}
        </p>
      </header>

      <input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Search by name, email or subject"
        aria-label="Search messages"
        className="focus:border-accent focus:ring-accent w-full max-w-xs rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:ring-1"
      />

      {list.error ? (
        <ErrorState
          message={errorMessage(list.error)}
          onRetry={() => {
            void list.refetch()
          }}
        />
      ) : list.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : list.data.items.length === 0 ? (
        <EmptyState
          title={q ? 'Nothing matches that search' : 'No messages yet'}
          description={q ? 'Try a different term.' : 'Submissions from the contact form land here.'}
        />
      ) : (
        <ul className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800">
          {list.data.items.map((message) => {
            const isOpen = expanded === message.id
            return (
              <li key={message.id} className="bg-neutral-900">
                <div className="flex items-start gap-3 px-4 py-3">
                  <span
                    aria-hidden
                    className={`mt-2 size-2 shrink-0 rounded-full ${message.read ? 'bg-transparent' : 'bg-accent'}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      toggleExpanded(message)
                    }}
                    aria-expanded={isOpen}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={`truncate text-sm ${message.read ? 'text-neutral-300' : 'font-medium text-neutral-100'}`}
                    >
                      {message.subject}
                      {message.read ? null : <span className="sr-only"> (unread)</span>}
                    </p>
                    <p className="truncate text-sm text-neutral-500">
                      {message.name} · {message.email}
                    </p>
                  </button>
                  <time
                    dateTime={new Date(message.createdAt).toISOString()}
                    className="hidden shrink-0 text-xs text-neutral-500 sm:block"
                  >
                    {formatDateTime(message.createdAt)}
                  </time>
                </div>

                {isOpen ? (
                  <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                      {message.body}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                        className="bg-accent hover:bg-accent-strong rounded-md px-3 py-1.5 text-sm text-white transition"
                      >
                        Reply by email
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setRead.mutate({ id: message.id, read: !message.read })
                        }}
                        className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-800"
                      >
                        Mark as {message.read ? 'unread' : 'read'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(message)
                        }}
                        className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {list.data && list.data.pages > 1 ? (
        <nav className="flex items-center justify-between" aria-label="Pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              setPage((p) => p - 1)
            }}
            className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-900 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {list.data.page} of {list.data.pages}
          </span>
          <button
            type="button"
            disabled={page >= list.data.pages}
            onClick={() => {
              setPage((p) => p + 1)
            }}
            className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-900 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this message?"
        message={deleting ? `The message from ${deleting.name} will be removed permanently.` : ''}
        busy={remove.isPending}
        onCancel={() => {
          setDeleting(null)
        }}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}
