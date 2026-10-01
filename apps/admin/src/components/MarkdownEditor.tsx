import { useState } from 'react'
import { MarkdownPreview } from './MarkdownPreview'

interface MarkdownEditorProps {
  id: string
  value: string
  onChange: (next: string) => void
  describedBy?: string
  invalid?: boolean
  rows?: number
}

type Pane = 'write' | 'preview'

export const MarkdownEditor = ({
  id,
  value,
  onChange,
  describedBy,
  invalid,
  rows = 16,
}: MarkdownEditorProps) => {
  // Side by side on a wide screen; tabbed when there is no room for both.
  const [pane, setPane] = useState<Pane>('write')

  return (
    <div className="mt-1.5">
      <div className="mb-2 flex gap-1 lg:hidden">
        {(['write', 'preview'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setPane(option)
            }}
            aria-pressed={pane === option}
            className={`rounded-md px-3 py-1 text-xs capitalize transition ${
              pane === option
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <textarea
          id={id}
          value={value}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid ? 'true' : undefined}
          onChange={(e) => {
            onChange(e.target.value)
          }}
          spellCheck
          className={`focus:ring-accent w-full resize-y rounded-md border bg-neutral-900 px-3 py-2 font-mono text-sm leading-relaxed text-neutral-100 outline-none transition focus:ring-1 ${
            invalid
              ? 'border-red-500/50 focus:border-red-500'
              : 'focus:border-accent border-neutral-800'
          } ${pane === 'preview' ? 'hidden lg:block' : ''}`}
        />

        <div
          className={`max-h-[32rem] overflow-y-auto rounded-md border border-neutral-800 bg-neutral-950 px-4 py-3 ${
            pane === 'write' ? 'hidden lg:block' : ''
          }`}
        >
          <MarkdownPreview source={value} />
        </div>
      </div>
    </div>
  )
}
