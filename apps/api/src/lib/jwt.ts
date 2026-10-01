import jwt from 'jsonwebtoken'
import { env } from '../env.js'
import { unauthorized } from './errors.js'

export interface AccessTokenPayload {
  sub: string
  email: string
}

// env.ACCESS_TOKEN_TTL is validated as a duration string ("15m") at boot; the
// cast narrows a plain string to the ms duration type jsonwebtoken expects.
const expiresIn = env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn']

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign({ email: payload.email }, env.JWT_SECRET, {
    subject: payload.sub,
    expiresIn,
  })

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  let decoded: string | jwt.JwtPayload
  try {
    decoded = jwt.verify(token, env.JWT_SECRET)
  } catch {
    // Expired, wrong signature and malformed all look the same to the caller.
    throw unauthorized('Invalid or expired token')
  }

  if (typeof decoded === 'string') throw unauthorized('Invalid or expired token')

  const sub = decoded.sub
  const email = decoded['email']
  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw unauthorized('Invalid or expired token')
  }

  return { sub, email }
}
