import crypto from 'node:crypto'
import type { User } from '@prisma/client'
import { prisma } from '../prisma.js'
import { env } from '../env.js'
import { logger } from '../logger.js'
import { unauthorized } from '../lib/errors.js'
import { burnPasswordComparison, verifyPassword } from '../lib/password.js'
import { signAccessToken } from '../lib/jwt.js'

export interface IssuedSession {
  accessToken: string
  refreshToken: string
  refreshExpiresAt: Date
  user: Pick<User, 'id' | 'email' | 'createdAt'>
}

const REFRESH_BYTES = 32

/** The database stores only this, so a dump of RefreshToken yields nothing usable. */
const hashToken = (raw: string): string => crypto.createHash('sha256').update(raw).digest('hex')

const refreshExpiry = (): Date =>
  new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

const issueRefreshToken = async (userId: string) => {
  const raw = crypto.randomBytes(REFRESH_BYTES).toString('base64url')
  const expiresAt = refreshExpiry()
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt },
  })
  return { raw, expiresAt }
}

const toSession = async (user: User): Promise<IssuedSession> => {
  const { raw, expiresAt } = await issueRefreshToken(user.id)
  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email }),
    refreshToken: raw,
    refreshExpiresAt: expiresAt,
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  }
}

export const login = async (email: string, password: string): Promise<IssuedSession> => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    // Same cost as a real comparison, so timing does not reveal which emails exist.
    await burnPasswordComparison()
    throw unauthorized('Invalid email or password')
  }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw unauthorized('Invalid email or password')

  return toSession(user)
}

/**
 * Rotation: every refresh issues a new token and revokes the one presented.
 * If an already-revoked token comes back, the cookie leaked — the whole family
 * is revoked so both the attacker and the victim have to sign in again.
 */
export const refresh = async (rawToken: string): Promise<IssuedSession> => {
  const tokenHash = hashToken(rawToken)
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!existing) throw unauthorized('Invalid refresh token')

  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    logger.warn(
      { userId: existing.userId },
      'Revoked refresh token was replayed; revoked every active token for this user',
    )
    throw unauthorized('Invalid refresh token')
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    throw unauthorized('Refresh token has expired')
  }

  const raw = crypto.randomBytes(REFRESH_BYTES).toString('base64url')
  const expiresAt = refreshExpiry()

  // One transaction, so a crash can never leave both tokens valid.
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: { userId: existing.userId, tokenHash: hashToken(raw), expiresAt },
    }),
  ])

  return {
    accessToken: signAccessToken({ sub: existing.user.id, email: existing.user.email }),
    refreshToken: raw,
    refreshExpiresAt: expiresAt,
    user: {
      id: existing.user.id,
      email: existing.user.email,
      createdAt: existing.user.createdAt,
    },
  }
}

/** Idempotent: logging out twice, or with a stale cookie, is not an error. */
export const logout = async (rawToken: string | undefined): Promise<void> => {
  if (!rawToken) return
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export const findUserById = async (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, createdAt: true },
  })
