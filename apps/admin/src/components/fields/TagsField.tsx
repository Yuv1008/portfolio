import { useState, type KeyboardEvent } from 'react'

interface TagsFieldProps {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  describedBy?: string
  invalid?: boolean
}

/**
 * Chip input for techStack and tags. Commits on Enter or comma, and Backspace
 * on an empty input removes the last chip — the behaviour people expect from
 * a token field.
 */
export const TagsField = ({
  id,
  value,
  onChange,
  placeholder,
  describedBy,
  invalid,
}: TagsFieldProps) => {
  const [draft, setDraft] = useState('')

  const commit = (raw: string) => {
    const tag = raw.trim()
    if (!tag) return
    if (value.includes(tag)) {
      setDraft('')
      return
    }
    onChange([...value, tag])
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit(draft)
      return
    }
    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={`mt-1.5 flex flex-wrap items-center gap-1.5 rounded-md border bg-neutral-900 px-2 py-1.5 focus-within:ring-1 ${
        invalid
          ? 'border-red-500/50 focus-within:border-red-500 focus-within:ring-red-500'
          : 'focus-within:border-accent focus-within:ring-accent border-neutral-800'
      }`}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-neutral-800 py-0.5 pl-2 pr-1 text-xs text-neutral-200"
        >
          {tag}
          <button
            type="button"
            onClick={() => {
              onChange(value.filter((t) => t !== tag))
            }}
            aria-label={`Remove ${tag}`}
            className="rounded px-1 text-neutral-500 transition hover:text-neutral-200"
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        aria-describedby={describedBy}
        aria-invalid={invalid ? 'true' : undefined}
        onChange={(e) => {
          setDraft(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        // Losing focus should not silently discard what was typed.
        onBlur={() => {
          commit(draft)
        }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
      />
    </div>
  )
}
