import type { Metadata } from 'next'
import Link from 'next/link'
import { getPosts } from '@/lib/api'
import { fullDate, readingTime } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Notes on building things.',
}

export default async function BlogPage() {
  const { items: posts, total } = await getPosts(1, 50)

  return (
    <>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          {total === 0 ? 'Nothing published yet.' : 'Notes on building things.'}
        </p>
      </header>

      <ul className="mt-10 divide-y divide-[var(--color-border)]">
        {posts.map((post) => (
          <li key={post.id} className="py-6 first:pt-0">
            <article>
              <div className="flex flex-wrap items-baseline gap-x-3 text-sm text-[var(--color-muted)]">
                {post.publishedAt ? (
                  <time dateTime={new Date(post.publishedAt).toISOString()}>
                    {fullDate(post.publishedAt)}
                  </time>
                ) : null}
                <span>{readingTime(post.content)} min read</span>
              </div>

              <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
                <Link href={`/blog/${post.slug}`} className="hover:text-[var(--color-accent)]">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {post.excerpt}
              </p>

              {post.tags.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
    </>
  )
}
