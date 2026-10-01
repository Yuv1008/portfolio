import { env } from '../env.js'
import { logger } from '../logger.js'

const TIMEOUT_MS = 3000

/**
 * Tells the web app to drop a cache tag after an admin write.
 *
 * Deliberately fire-and-forget: in development the site is often not running,
 * and a failed revalidation must never turn a successful save into a 500. The
 * worst case is stale content until the next revalidate or the hourly refresh.
 */
export const revalidateTag = async (tag: string): Promise<void> => {
  if (!env.REVALIDATE_SECRET) {
    logger.debug({ tag }, 'REVALIDATE_SECRET is unset; skipping revalidation')
    return
  }

  try {
    const res = await fetch(`${env.WEB_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': env.REVALIDATE_SECRET,
      },
      body: JSON.stringify({ tag }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      logger.warn({ tag, status: res.status }, 'Revalidation was refused by the web app')
      return
    }

    logger.debug({ tag }, 'Revalidated')
  } catch (error) {
    logger.warn({ tag, err: error }, 'Could not reach the web app to revalidate')
  }
}

/** Queues revalidation without making the caller wait on it. */
export const revalidate = (tag: string): void => {
  void revalidateTag(tag)
}
