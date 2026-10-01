import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastValue {
  notify: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastValue | null>(null)

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  info: 'border-neutral-600 bg-neutral-800 text-neutral-200',
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, kind, message }])
      window.setTimeout(() => {
        dismiss(id)
      }, 4500)
    },
    [dismiss],
  )

  const value = useMemo<ToastValue>(() => ({ notify }), [notify])

  return (
    <ToastContext value={value}>
      {children}
      {/* aria-live so a screen reader announces results it cannot see appear */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => {
              dismiss(toast.id)
            }}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-left text-sm shadow-lg backdrop-blur transition hover:brightness-110 ${KIND_STYLES[toast.kind]}`}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext>
  )
}

export const useToast = (): ToastValue => {
  const value = use(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
