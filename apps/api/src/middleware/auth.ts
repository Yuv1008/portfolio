import type { Request, RequestHandler } from 'express'
import { unauthorized } from '../lib/errors.js'
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload
    }
  }
}

/** Rejects anything without a valid, unexpired access token. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(unauthorized('Missing bearer token'))
    return
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    next(unauthorized('Missing bearer token'))
    return
  }

  try {
    req.user = verifyAccessToken(token)
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Handlers behind requireAuth always have a user, but the request type cannot
 * know that. This narrows it in one place instead of asserting at each call.
 */
export const requireUser = (req: Request): AccessTokenPayload => {
  if (!req.user) throw unauthorized('Not authenticated')
  return req.user
}
