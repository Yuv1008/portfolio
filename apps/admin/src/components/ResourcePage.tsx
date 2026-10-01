import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Paginated } from '@portfolio/shared'
import { api, errorMessage } from '../lib/api'
import type { ResourceDefinition } from '../lib/resources'
import { useDebounced } from '../lib/useDebounced'
import { ResourceTable } from './ResourceTable'
import { ResourceForm } from './ResourceForm'
import { Modal, ConfirmDialog } from './Modal'
import { useToast } from './Toast'

interface Row {
  id: string
  [key: string]: unknown
}

const isPaginatedPayload = (value: unknown): value is Paginated<Row> =>
  typeof value === 'object' && value !== null && 'items' in value && 'total' in value

/**
 * Everything a content page does: list, search, paginate, create, edit,
 * reorder, delete and toggle published. Each page supplies a definition and
 * nothing else.
 */
export const ResourcePage = ({ definition }: { definition: ResourceDefinition }) => {
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search, 300)

  const [editing, setEditing] = useState<Row | null | 'new'>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)

  const listKey = [definition.key, { q: debouncedSearch, page }] as const

  const list = useQuery({
    queryKey: listKey,
    // `signal` makes the request genuinely abortable, which is what lets
    // cancelQueries stop an in-flight GET from landing after an optimistic
    // update and overwriting it with a pre-mutation value.
    queryFn: async ({ signal }) => {
      const res = await api.get<Row[] | Paginated<Row>>(definition.endpoint, {
        signal,
        params: {
          ...(debouncedSearch ? { q: debouncedSearch } : {}),
          ...(definition.paginated ? { page, limit: 20 } : {}),
        },
      })
      return res.data
    },
  })

  const rows: Row[] = useMemo(() => {
    if (!list.data) return []
    return isPaginatedPayload(list.data) ? list.data.items : list.data
  }, [list.data])

  const pageInfo = isPaginatedPayload(list.data) ? list.data : null

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [definition.key] })
    void queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  const save = useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Record<string, unknown> }) => {
      if (id) {
        const res = await api.put<Row>(`${definition.endpoint}/${id}`, values)
        return res.data
      }
      const res = await api.post<Row>(definition.endpoint, values)
      return res.data
    },
    onSuccess: (_row, variables) => {
      invalidate()
      notify(
        variables.id ? `Saved the ${definition.singular}` : `Created the ${definition.singular}`,
        'success',
      )
      setEditing(null)
    },
    onError: (error) => {
      notify(errorMessage(error), 'error')
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${definition.endpoint}/${id}`)
    },
    onSuccess: () => {
      invalidate()
      notify(`Deleted the ${definition.singular}`, 'success')
      setDeleting(null)
    },
    onError: (error) => {
      notify(errorMessage(error), 'error')
      setDeleting(null)
    },
  })

  const togglePublished = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      await api.patch(`${definition.endpoint}/${id}`, { published })
    },
    // Optimistic: the switch should feel instant, and roll back if the API refuses.
    onMutate: async ({ id, published }) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData(listKey)

      queryClient.setQueryData(listKey, (current: Row[] | Paginated<Row> | undefined) => {
        if (!current) return current
        const patch = (items: Row[]) => items.map((r) => (r.id === id ? { ...r, published } : r))
        return isPaginatedPayload(current)
          ? { ...current, items: patch(current.items) }
          : patch(current)
      })

      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(listKey, context.previous)
      notify(errorMessage(error), 'error')
    },
    onSettled: invalidate,
  })

  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      await api.patch(`${definition.endpoint}/reorder`, {
        items: ids.map((id, index) => ({ id, order: index })),
      })
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData(listKey)

      queryClient.setQueryData(listKey, (current: Row[] | Paginated<Row> | undefined) => {
        if (!current || isPaginatedPayload(current)) return current
        const byId = new Map(current.map((row) => [row.id, row]))
        return ids.flatMap((id) => {
          const row = byId.get(id)
          return row ? [row] : []
        })
      })

      return { previous }
    },
    onError: (error, _ids, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(listKey, context.previous)
      notify(errorMessage(error), 'error')
    },
    onSuccess: () => {
      notify('Order saved', 'success')
    },
    onSettled: invalidate,
  })

  const defaults = useMemo(() => {
    if (editing === 'new' || editing === null) return definition.defaults
    // Dates arrive as ISO strings; <input type="date"> wants YYYY-MM-DD.
    const prepared: Record<string, unknown> = { ...editing }
    for (const field of definition.fields) {
      const value = prepared[field.name]
      if (field.type === 'date' && typeof value === 'string') {
        prepared[field.name] = value.slice(0, 10)
      }
      if (
        value === null &&
        (field.type === 'text' || field.type === 'url' || field.type === 'textarea')
      ) {
        prepared[field.name] = ''
      }
    }
    return prepared
  }, [editing, definition])

  const editingRow = editing === 'new' || editing === null ? null : editing

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{definition.label}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {pageInfo
              ? `${String(pageInfo.total)} total`
              : `${String(rows.length)} ${rows.length === 1 ? definition.singular : `${definition.singular}s`}`}
            {definition.reorderable ? ' · drag the handles to reorder' : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing('new')
          }}
          className="bg-accent hover:bg-accent-strong rounded-md px-3 py-1.5 text-sm font-medium text-white transition"
        >
          New {definition.singular}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder={definition.searchPlaceholder ?? 'Search'}
          aria-label={`Search ${definition.label}`}
          className="focus:border-accent focus:ring-accent w-full max-w-xs rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:ring-1"
        />
        {list.isFetching && !list.isPending ? (
          <span className="text-xs text-neutral-500">Updating…</span>
        ) : null}
      </div>

      <ResourceTable
        rows={rows}
        columns={definition.columns}
        isPending={list.isPending}
        error={list.error}
        errorMessage={list.error ? errorMessage(list.error) : undefined}
        onRetry={() => {
          void list.refetch()
        }}
        emptyTitle={
          debouncedSearch
            ? 'Nothing matches that search'
            : `No ${definition.label.toLowerCase()} yet`
        }
        emptyDescription={
          debouncedSearch ? 'Try a different term.' : `Create your first ${definition.singular}.`
        }
        onEdit={setEditing}
        onDelete={setDeleting}
        reorderable={definition.reorderable && !debouncedSearch}
        onReorder={
          definition.reorderable
            ? (ids) => {
                reorder.mutate(ids)
              }
            : undefined
        }
        {...(definition.publishedKey
          ? {
              isPublished: (row: Row) => Boolean(row[definition.publishedKey as string]),
              onTogglePublished: (row: Row, next: boolean) => {
                togglePublished.mutate({ id: row.id, published: next })
              },
            }
          : {})}
      />

      {pageInfo && pageInfo.pages > 1 ? (
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
            Page {pageInfo.page} of {pageInfo.pages}
          </span>
          <button
            type="button"
            disabled={page >= pageInfo.pages}
            onClick={() => {
              setPage((p) => p + 1)
            }}
            className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-900 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      ) : null}

      <Modal
        open={editing !== null}
        onClose={() => {
          setEditing(null)
        }}
        title={editingRow ? `Edit ${definition.singular}` : `New ${definition.singular}`}
        wide
      >
        <ResourceForm
          schema={definition.schema}
          fields={definition.fields}
          defaultValues={defaults}
          submitLabel={editingRow ? 'Save changes' : `Create ${definition.singular}`}
          busy={save.isPending}
          onCancel={() => {
            setEditing(null)
          }}
          onSubmit={async (values) => {
            await save.mutateAsync({
              ...(editingRow ? { id: editingRow.id } : {}),
              values: values as Record<string, unknown>,
            })
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete this ${definition.singular}?`}
        message={
          deleting
            ? `"${String(deleting[definition.columns[0]?.key ?? 'id'] ?? 'This item')}" will be removed permanently. This cannot be undone.`
            : ''
        }
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
