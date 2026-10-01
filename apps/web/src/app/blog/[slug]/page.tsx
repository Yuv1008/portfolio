import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPost } from '@/lib/api'
import cloudinaryLoader from '@/lib/cloudinary'
import { Prose } from '@/components/Markdown'
import { fullDate, readingTime } from '@/lib/format'
import { JsonLd, blogPostingSchema, breadcrumbSchema } from '@/components/JsonLd'
import { getAbout } from '@/lib/api'

const SITE = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3010'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Post not found' }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      ...(post.publishedAt ? { publishedTime: new Date(post.publishedAt).toISOString() } : {}),
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    },
  }
}

export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const [post, about] = await Promise.all([getPost(slug), getAbout()])
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-2xl">
      <JsonLd
        data={blogPostingSchema({
          title: post.title,
          excerpt: post.excerpt,
          url: `${SITE}/blog/${post.slug}`,
          authorName: about?.name ?? 'Author',
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          coverImageUrl: post.coverImageUrl,
          tags: post.tags,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: SITE },
          { name: 'Blog', url: `${SITE}/blog` },
          { name: post.title, url: `${SITE}/blog/${post.slug}` },
        ])}
      />
      <Link href="/blog" className="text-sm text-[var(--color-muted)] hover:underline">
        ← All posts
      </Link>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-3 text-sm text-[var(--color-muted)]">
        {post.publishedAt ? (
          <time dateTime={new Date(post.publishedAt).toISOString()}>
            {fullDate(post.publishedAt)}
          </time>
        ) : null}
        <span>{readingTime(post.content)} min read</span>
      </div>

      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight">{post.title}</h1>
      <p className="mt-3 text-balance text-lg text-[var(--color-muted)]">{post.excerpt}</p>

      {post.coverImageUrl ? (
        <Image
          loader={cloudinaryLoader}
          src={post.coverImageUrl}
          alt=""
          width={1200}
          height={675}
          sizes="(min-width: 768px) 42rem, 100vw"
          className="mt-8 w-full rounded-xl border border-[var(--color-border)] object-cover"
          priority
        />
      ) : null}

      <div className="mt-10">
        <Prose>{post.content}</Prose>
      </div>

      {post.tags.length > 0 ? (
        <ul className="mt-10 flex flex-wrap gap-1.5 border-t border-[var(--color-border)] pt-6">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
