import type { CookieOptions, RequestHandler, Response } from 'express'
import { loginSchema } from '@portfolio/shared'
import { env, isProduction } from '../env.js'
import { notFound, unauthorized } from '../lib/errors.js'
import { withBody, wrap } from '../lib/asyncHandler.js'
import { requireUser } from '../middleware/auth.js'
import * as authService from '../services/auth.service.js'

export const REFRESH_COOKIE = 'refresh_token'

/**
 * Scoped to /auth, so the cookie rides only on refresh and logout and is never
 * attached to ordinary content requests. SameSite=None needs Secure, which is
 * what production uses once the admin and the API sit on different domains.
 */
const cookieOptions = (expiresAt?: Date): CookieOptions => ({
  httpOnly: true,
  secure: isProduction || env.COOKIE_SAMESITE === 'none',
  sameSite: env.COOKIE_SAMESITE,
  path: '/auth',
  ...(expiresAt ? { expires: expiresAt } : {}),
})

const setRefreshCookie = (res: Response, token: string, expiresAt: Date): void => {
  res.cookie(REFRESH_COOKIE, token, cookieOptions(expiresAt))
}

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE, cookieOptions())
}

export const postLogin: RequestHandler = withBody(
  loginSchema,
  async ({ email, password }, _req, res) => {
    const session = await authService.login(email, password)

    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt)
    res.status(200).json({ accessToken: session.accessToken, user: session.user })
  },
)

export const postRefresh: RequestHandler = wrap(async (req, res) => {
  const raw: unknown = req.cookies[REFRESH_COOKIE]
  if (typeof raw !== 'string' || raw.length === 0) {
    throw unauthorized('No refresh token')
  }

  let session
  try {
    session = await authService.refresh(raw)
  } catch (error) {
    // A refused refresh should also drop the dead cookie from the browser.
    clearRefreshCookie(res)
    throw error
  }

  setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt)
  res.status(200).json({ accessToken: session.accessToken, user: session.user })
})

export const postLogout: RequestHandler = wrap(async (req, res) => {
  const raw: unknown = req.cookies[REFRESH_COOKIE]
  await authService.logout(typeof raw === 'string' ? raw : undefined)
  clearRefreshCookie(res)
  res.status(204).send()
})

export const getMe: RequestHandler = wrap(async (req, res) => {
  const { sub } = requireUser(req)
  const user = await authService.findUserById(sub)
  // The token verified, but the row is gone — a deleted admin with a live token.
  if (!user) throw notFound('User no longer exists')
  res.status(200).json(user)
})
