import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Media as MediaRow } from '@portfolio/shared'
import { api, errorMessage } from '../lib/api'
import { useMediaList, useUploadImage } from '../components/ImagePicker'
import { useToast } from '../components/Toast'
import { Skeleton } from '../components/Skeleton'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/Modal'

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Media() {
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const { data, isPending, error, refetch } = useMediaList()
  const upload = useUploadImage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [deleting, setDeleting] = useState<MediaRow | null>(null)

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/media/${id}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['media'] })
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
      notify('Image deleted', 'success')
      setDeleting(null)
    },
    onError: (err) => {
      notify(errorMessage(err), 'error')
      setDeleting(null)
    },
  })

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    upload.mutate(file, {
      onSuccess: (media) => {
        notify(`Uploaded ${media.filename}`, 'success')
      },
      onError: (err) => {
        notify(errorMessage(err), 'error')
      },
    })
  }

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      notify('URL copied', 'success')
    } catch {
      notify('Could not copy to the clipboard', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Media</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {data
            ? `${String(data.total)} ${data.total === 1 ? 'image' : 'images'}`
            : 'Uploaded images'}
          , stored on Cloudinary.
        </p>
      </header>

      <div
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => {
          setDragging(false)
        }}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? 'border-accent bg-accent/5' : 'border-neutral-800'
        }`}
      >
        <p className="text-sm text-neutral-300">Drop an image here to upload</p>
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
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No images yet" description="Upload one above to get started." />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.items.map((media) => (
            <li
              key={media.id}
              className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
            >
              <img
                src={media.url}
                alt={media.filename}
                loading="lazy"
                className="aspect-square w-full bg-neutral-950 object-cover"
              />
              <div className="space-y-2 p-3">
                <p className="truncate text-sm text-neutral-200" title={media.filename}>
                  {media.filename}
                </p>
                <p className="text-xs text-neutral-500">
                  {media.width && media.height
                    ? `${String(media.width)}×${String(media.height)} · `
                    : ''}
                  {formatBytes(media.size)}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      void copyUrl(media.url)
                    }}
                    className="flex-1 rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-300 transition hover:bg-neutral-800"
                  >
                    Copy URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleting(media)
                    }}
                    className="rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this image?"
        message={
          deleting
            ? `"${deleting.filename}" will be removed from Cloudinary permanently. Anything still pointing at it — a project cover, an avatar — will show a broken image.`
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
