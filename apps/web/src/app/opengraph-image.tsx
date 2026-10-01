import { ImageResponse } from 'next/og'
import { getAbout } from '@/lib/api'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Portfolio'

/**
 * Rendered at build time from the live About record, so the card matches the
 * site rather than drifting from it.
 */
export default async function Image() {
  const about = await getAbout()

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #0b1220 0%, #16233d 55%, #1d3a7a 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 72, fontWeight: 700, letterSpacing: '-0.03em' }}>
        {about?.name ?? 'Portfolio'}
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 20,
          fontSize: 34,
          color: 'rgba(255,255,255,0.72)',
          maxWidth: 900,
        }}
      >
        {about?.headline ?? 'Full-stack developer'}
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 'auto',
          fontSize: 24,
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        {about?.location ?? ''}
      </div>
    </div>,
    size,
  )
}
