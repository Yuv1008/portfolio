import { useState } from 'react'

interface KeyValueFieldProps {
  id: string
  value: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

/** Editor for the About page's `socials` JSON: a label and a URL per row. */
export const KeyValueField = ({ id, value, onChange }: KeyValueFieldProps) => {
  const [newKey, setNewKey] = useState('')
  const entries = Object.entries(value)

  const setEntry = (key: string, next: string) => {
    onChange({ ...value, [key]: next })
  }

  const removeEntry = (key: string) => {
    const { [key]: _removed, ...rest } = value
    onChange(rest)
  }

  const addEntry = () => {
    const key = newKey.trim().toLowerCase()
    if (!key || key in value) return
    onChange({ ...value, [key]: '' })
    setNewKey('')
  }

  return (
    <div className="mt-1.5 space-y-2">
      {entries.length === 0 ? (
        <p className="text-xs text-neutral-500">No links yet.</p>
      ) : (
        entries.map(([key, url]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-xs text-neutral-400">{key}</span>
            <input
              value={url}
              onChange={(e) => {
                setEntry(key, e.target.value)
              }}
              placeholder="https://"
              aria-label={`${key} URL`}
              className="focus:border-accent focus:ring-accent flex-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 outline-none transition focus:ring-1"
            />
            <button
              type="button"
              onClick={() => {
                removeEntry(key)
              }}
              aria-label={`Remove ${key}`}
              className="rounded-md px-2 py-1 text-neutral-500 transition hover:text-neutral-200"
            >
              ×
            </button>
          </div>
        ))
      )}

      <div className="flex items-center gap-2">
        <input
          id={id}
          value={newKey}
          onChange={(e) => {
            setNewKey(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addEntry()
            }
          }}
          placeholder="github, linkedin, x…"
          className="focus:border-accent focus:ring-accent w-40 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 outline-none transition focus:ring-1"
        />
        <button
          type="button"
          onClick={addEntry}
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-900"
        >
          Add link
        </button>
      </div>
    </div>
  )
}
