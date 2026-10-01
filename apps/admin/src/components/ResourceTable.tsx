import { useId } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Skeleton } from './Skeleton'
import { EmptyState, ErrorState } from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  /** Hidden below sm, for columns that are nice-to-have. */
  secondary?: boolean
}

interface Identified {
  id: string
}

interface ResourceTableProps<T extends Identified> {
  rows: T[]
  columns: Column<T>[]
  isPending: boolean
  error: unknown
  errorMessage?: string
  onRetry?: () => void
  emptyTitle: string
  emptyDescription?: string
  onEdit: (row: T) => void
  onDelete: (row: T) => void
  onTogglePublished?: (row: T, next: boolean) => void
  isPublished?: (row: T) => boolean
  onReorder?: (ids: string[]) => void
  reorderable?: boolean
}

interface DragHandleProps {
  attributes: DraggableAttributes
  // dnd-kit types listeners as possibly undefined when dragging is disabled.
  listeners: SyntheticListenerMap | undefined
}

const DragHandle = ({ attributes, listeners }: DragHandleProps) => (
  <button
    type="button"
    aria-label="Reorder"
    className="cursor-grab rounded px-1 text-neutral-600 transition hover:text-neutral-300 active:cursor-grabbing"
    {...attributes}
    {...listeners}
  >
    ⠿
  </button>
)

const Row = <T extends Identified>({
  row,
  columns,
  reorderable,
  onEdit,
  onDelete,
  onTogglePublished,
  isPublished,
}: {
  row: T
  columns: Column<T>[]
  reorderable: boolean
} & Pick<ResourceTableProps<T>, 'onEdit' | 'onDelete' | 'onTogglePublished' | 'isPublished'>) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: !reorderable,
  })

  const published = isPublished?.(row)

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border-t border-neutral-800 ${isDragging ? 'relative z-10 bg-neutral-800' : 'bg-neutral-900'}`}
    >
      {reorderable ? (
        <td className="w-8 px-2 py-3">
          <DragHandle attributes={attributes} listeners={listeners} />
        </td>
      ) : null}

      {columns.map((column) => (
        <td
          key={column.key}
          className={`px-3 py-3 text-sm text-neutral-300 ${column.secondary ? 'hidden sm:table-cell' : ''}`}
        >
          {column.render(row)}
        </td>
      ))}

      {onTogglePublished && isPublished ? (
        <td className="px-3 py-3">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => {
                onTogglePublished(row, e.target.checked)
              }}
              className="accent-accent size-4"
            />
            <span className="sr-only">{published ? 'Published' : 'Draft'}</span>
            <span aria-hidden className="text-xs text-neutral-500">
              {published ? 'Live' : 'Draft'}
            </span>
          </label>
        </td>
      ) : null}

      <td className="px-3 py-3 text-right">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              onEdit(row)
            }}
            className="rounded-md border border-neutral-800 px-2.5 py-1 text-xs text-neutral-300 transition hover:bg-neutral-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete(row)
            }}
            className="rounded-md border border-neutral-800 px-2.5 py-1 text-xs text-neutral-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

export const ResourceTable = <T extends Identified>({
  rows,
  columns,
  isPending,
  error,
  errorMessage,
  onRetry,
  emptyTitle,
  emptyDescription,
  onEdit,
  onDelete,
  onTogglePublished,
  isPublished,
  onReorder,
  reorderable = false,
}: ResourceTableProps<T>) => {
  const tableId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !onReorder) return

    const oldIndex = rows.findIndex((row) => row.id === active.id)
    const newIndex = rows.findIndex((row) => row.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = [...rows]
    const [moved] = next.splice(oldIndex, 1)
    if (moved) next.splice(newIndex, 0, moved)
    onReorder(next.map((row) => row.id))
  }

  if (error) {
    return <ErrorState message={errorMessage ?? 'Could not load this list'} onRetry={onRetry} />
  }

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  const body = (
    <table id={tableId} className="w-full min-w-[32rem] border-collapse">
      <thead>
        <tr className="text-left">
          {reorderable ? <th className="w-8" /> : null}
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={`px-3 pb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 ${
                column.secondary ? 'hidden sm:table-cell' : ''
              }`}
            >
              {column.header}
            </th>
          ))}
          {onTogglePublished ? (
            <th
              scope="col"
              className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-neutral-500"
            >
              Status
            </th>
          ) : null}
          <th
            scope="col"
            className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide text-neutral-500"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="overflow-hidden rounded-xl">
        {rows.map((row) => (
          <Row
            key={row.id}
            row={row}
            columns={columns}
            reorderable={reorderable}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePublished={onTogglePublished}
            isPublished={isPublished}
          />
        ))}
      </tbody>
    </table>
  )

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800">
      {reorderable && onReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
            {body}
          </SortableContext>
        </DndContext>
      ) : (
        body
      )}
    </div>
  )
}
