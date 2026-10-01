import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { ALL_TAGS } from '@/lib/api'

const SECRET = process.env['REVALIDATE_SECRET']

/** Constant time, so the endpoint cannot be used to guess the secret byte by byte. */
const secretMatches = (provided: string, expected: string): boolean => {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  if (!SECRET) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET is not set on the web app' },
      { status: 503 },
    )
  }

  const provided = request.headers.get('x-revalidate-secret')
  if (!provided || !secretMatches(provided, SECRET)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  let tag: unknown
  try {
    const body: unknown = await request.json()
    tag = typeof body === 'object' && body !== null ? (body as { tag?: unknown }).tag : undefined
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  if (typeof tag !== 'string' || !ALL_TAGS.includes(tag)) {
    return NextResponse.json(
      { error: `Unknown tag. Expected one of: ${ALL_TAGS.join(', ')}` },
      { status: 400 },
    )
  }

  // { expire: 0 } makes the next request a blocking revalidate instead of
  // serving the stale copy. The 'max' profile is faster, but it costs a
  // one-edit lag: after saving, the editor's next load still shows the old
  // content. updateTag would be ideal here and is Server Actions only, so
  // this is the documented alternative for a route handler.
  revalidateTag(tag, { expire: 0 })

  return NextResponse.json({ revalidated: tag, at: new Date().toISOString() })
}
