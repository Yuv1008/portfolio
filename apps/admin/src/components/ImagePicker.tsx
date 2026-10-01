import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Media, Paginated } from '@portfolio/shared'
import { api, errorMessage } from '../lib/api'
import { useToast } from './Toast'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { Modal } from './Modal'

export const useMediaList = (enabled = true) =>
  useQuery({
    queryKey: ['media'],
    enabled,
    queryFn: async ({ signal }) => {
      const res = await api.get<Paginated<Media>>('/admin/media', { signal, params: { limit: 60 } })
      return res.data
    },
  })

export const useUploadImage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post<Media>('/admin/upload', form)
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['media'] })
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

interface ImagePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export const ImagePicker = ({ open, onClose, onSelect }: ImagePickerProps) => {
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const { data, isPending } = useMediaList(open)
  const { notify } = useToast()
  const upload = useUploadImage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    upload.mutate(file, {
      onSuccess: (media) => {
        notify(`Uploaded ${media.filename}`, 'success')
        onSelect(media.url)
        onClose()
      },
      onError: (error) => {
        notify(errorMessage(error), 'error')
      },
    })
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    handleFile(event.dataTransfer.files[0])
  }

  return (
    <Modal open={open} onClose={onClose} title="Choose an image" wide>
      <div className="mb-4 flex gap-1">
        {(['library', 'upload'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setTab(option)
            }}
            aria-pressed={tab === option}
            className={`rounded-md px-3 py-1.5 text-sm capitalize transition ${
              tab === option
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {option === 'library' ? 'Media library' : 'Upload new'}
          </button>
        ))}
      </div>

      {tab === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => {
            setDragging(false)
          }}
          onDrop={onDrop}
          className={`rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
            dragging ? 'border-accent bg-accent/5' : 'border-neutral-800'
          }`}
        >
          <p className="text-sm text-neutral-300">Drop an image here</p>
          <p className="mt-1 text-xs text-neutral-500">PNG, JPEG, WebP, AVIF or GIF, up to 5 MB</p>
          <button
            type="button"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
            className="bg-accent hover:bg-accent-strong mt-4 rounded-md px-3 py-1.5 text-sm text-white transition disabled:opacity-60"
          >
            {upload.isPending ? 'Uploading…' : 'Choose a file'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      ) : isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No images yet"
          description="Upload one from the other tab, or from the Media page."
        />
      ) : (
        <ul className="grid max-h-[26rem] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
          {data.items.map((media) => (
            <li key={media.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(media.url)
                  onClose()
                }}
                className="hover:border-accent group w-full overflow-hidden rounded-lg border border-neutral-800 transition"
              >
                <img
                  src={media.url}
                  alt={media.filename}
                  loading="lazy"
                  className="aspect-square w-full bg-neutral-900 object-cover"
                />
                <span className="block truncate px-2 py-1.5 text-left text-xs text-neutral-400">
                  {media.filename}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

interface ImageFieldProps {
  id: string
  value: string | null
  onChange: (next: string | null) => void
}

export const ImageField = ({ id, value, onChange }: ImageFieldProps) => {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="mt-1.5">
      <div className="flex items-start gap-3">
        <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-neutral-600">
              None
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            id={id}
            type="button"
            onClick={() => {
              setPickerOpen(true)
            }}
            className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-900"
          >
            {value ? 'Replace' : 'Choose image'}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange(null)
              }}
              className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-200"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <ImagePicker
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false)
        }}
        onSelect={onChange}
      />
    </div>
  )
}
