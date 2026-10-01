import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

/** The same pipeline the admin preview uses, plus syntax highlighting. */
export const Prose = ({ children }: { children: string }) => (
  <div className="prose">
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      components={{
        a: ({ href, children: inner, ...props }) => {
          const external = typeof href === 'string' && /^https?:\/\//.test(href)
          return (
            <a
              href={href}
              {...props}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {inner}
            </a>
          )
        },
      }}
    >
      {children}
    </Markdown>
  </div>
)
