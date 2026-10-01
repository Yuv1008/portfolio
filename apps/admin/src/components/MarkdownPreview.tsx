import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * The editor preview. Phase 7 gives the site the same remark-gfm pipeline, so
 * what is previewed here matches what visitors see.
 */
export const MarkdownPreview = ({ source }: { source: string }) => {
  if (!source.trim()) {
    return <p className="text-sm text-neutral-600">Nothing to preview yet.</p>
  }

  return (
    <div className="prose-admin text-sm text-neutral-300">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {source}
      </Markdown>
    </div>
  )
}
