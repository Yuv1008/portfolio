import { ImageResponse } from 'next/og'
import { getAbout, getPost } from '@/lib/api'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Blog post'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, about] = await Promise.all([getPost(slug), getAbout()])

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px',
        background: 'linear-gradient(135deg, #0b1220 0%, #16233d 55%, #1d3a7a 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.6)' }}>
        {about?.name ?? 'Portfolio'} · Blog
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 'auto',
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
        }}
      >
        {post?.title ?? 'Post not found'}
      </div>
      {post?.excerpt ? (
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 28,
            color: 'rgba(255,255,255,0.7)',
            maxWidth: 980,
          }}
        >
          {post.excerpt.length > 120 ? `${post.excerpt.slice(0, 120)}…` : post.excerpt}
        </div>
      ) : null}
    </div>,
    size,
  )
}
