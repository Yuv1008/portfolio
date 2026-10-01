import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../prisma.js'
import { resetRateLimits } from '../middleware/rateLimit.js'
import { REFRESH_COOKIE } from '../controllers/auth.controller.js'
import { signAccessToken } from '../lib/jwt.js'
import {
  app,
  createAdmin,
  disconnect,
  refreshCookieFrom,
  refreshCookieHeader,
  resetDb,
  testAdmin,
} from './helpers.js'

const loginBody = { email: testAdmin.email, password: testAdmin.password }

const login = () => request(app).post('/auth/login').send(loginBody)

beforeEach(async () => {
  await resetDb()
  resetRateLimits()
  await createAdmin()
})

afterAll(async () => {
  await disconnect()
})

describe('POST /auth/login', () => {
  it('returns an access token and sets an httpOnly refresh cookie', async () => {
    const res = await login()

    expect(res.status).toBe(200)
    expect(typeof res.body.accessToken).toBe('string')
    expect(res.body.user.email).toBe(testAdmin.email)
    // The hash must never travel to the client.
    expect(res.body.user).not.toHaveProperty('passwordHash')

    const cookie = refreshCookieHeader(res)
    expect(cookie).toBeDefined()
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Lax/i)
    expect(cookie).toMatch(/Path=\/auth/i)

    // What is stored is a hash, not the token itself.
    const stored = await prisma.refreshToken.findFirst()
    expect(stored).not.toBeNull()
    expect(stored?.tokenHash).not.toBe(refreshCookieFrom(res))
    expect(stored?.revokedAt).toBeNull()
  })

  it('rejects a wrong password without a cookie, and does not say which field was wrong', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testAdmin.email, password: 'wrong-password-entirely' })

    expect(res.status).toBe(401)
    expect(refreshCookieHeader(res)).toBeUndefined()
    expect(res.body.error).toBe('Invalid email or password')
  })

  it('gives an unknown email the identical response to a wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.local', password: testAdmin.password })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid email or password')
  })

  it('rejects a malformed body with 400 and field errors', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'x' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('validation_error')
    expect(Object.keys(res.body.fields).sort()).toEqual(['email', 'password'])
  })
})

describe('POST /auth/refresh', () => {
  it('rotates the token and refuses the one it replaced', async () => {
    const first = await login()
    const firstToken = refreshCookieFrom(first)
    expect(firstToken).toBeTruthy()

    const rotated = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=${firstToken}`)

    expect(rotated.status).toBe(200)
    expect(typeof rotated.body.accessToken).toBe('string')

    const secondToken = refreshCookieFrom(rotated)
    expect(secondToken).toBeTruthy()
    expect(secondToken).not.toBe(firstToken)

    // The replaced token is revoked, not deleted, so a replay can be detected.
    expect(await prisma.refreshToken.count()).toBe(2)
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(1)

    const replay = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=${firstToken}`)

    expect(replay.status).toBe(401)
  })

  it('revokes every active token for the user when a revoked one is replayed', async () => {
    const first = await login()
    const firstToken = refreshCookieFrom(first)

    await request(app).post('/auth/refresh').set('Cookie', `${REFRESH_COOKIE}=${firstToken}`)

    // One token is live at this point; replaying the dead one should kill it too.
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(1)

    await request(app).post('/auth/refresh').set('Cookie', `${REFRESH_COOKIE}=${firstToken}`)

    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(0)
  })

  it('rejects a request with no cookie at all', async () => {
    const res = await request(app).post('/auth/refresh')
    expect(res.status).toBe(401)
  })

  it('rejects a token that is not in the database', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=completely-made-up-token`)

    expect(res.status).toBe(401)
  })

  it('rejects an expired token', async () => {
    const res = await login()
    const token = refreshCookieFrom(res)

    await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })

    const expired = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=${token}`)

    expect(expired.status).toBe(401)
    expect(expired.body.error).toMatch(/expired/i)
  })
})

describe('POST /auth/logout', () => {
  it('revokes the token and clears the cookie', async () => {
    const res = await login()
    const token = refreshCookieFrom(res)

    const out = await request(app).post('/auth/logout').set('Cookie', `${REFRESH_COOKIE}=${token}`)

    expect(out.status).toBe(204)
    expect(refreshCookieHeader(out)).toMatch(/refresh_token=;/)
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(0)

    const after = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=${token}`)

    expect(after.status).toBe(401)
  })

  it('is harmless without a cookie', async () => {
    const res = await request(app).post('/auth/logout')
    expect(res.status).toBe(204)
  })
})

describe('GET /auth/me', () => {
  it('returns the signed-in admin', async () => {
    const res = await login()
    const me = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)

    expect(me.status).toBe(200)
    expect(me.body.email).toBe(testAdmin.email)
    expect(me.body).not.toHaveProperty('passwordHash')
  })

  it('rejects a missing token', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })

  it('rejects a malformed token', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer not.a.jwt')
    expect(res.status).toBe(401)
  })

  it('rejects a token signed with the wrong secret', async () => {
    // Shape is right, signature is not.
    const forged =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4IiwiZW1haWwiOiJhQGIuY29tIn0.' +
      'ZmFrZS1zaWduYXR1cmUtdGhhdC13aWxsLW5vdC12ZXJpZnk'
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${forged}`)
    expect(res.status).toBe(401)
  })

  it('rejects a header that is not a bearer token', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Basic abc123')
    expect(res.status).toBe(401)
  })

  it('404s when the token is valid but the user row is gone', async () => {
    const admin = await prisma.user.findFirstOrThrow()
    const token = signAccessToken({ sub: admin.id, email: admin.email })
    await prisma.user.delete({ where: { id: admin.id } })

    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('login rate limiting', () => {
  it('returns 429 on the sixth attempt from one IP', async () => {
    // Long enough to pass validation, so each attempt reaches the auth check.
    const attempt = () =>
      request(app)
        .post('/auth/login')
        .send({ email: testAdmin.email, password: 'wrong-password-entirely' })

    for (let i = 0; i < 5; i += 1) {
      const res = await attempt()
      expect(res.status).toBe(401)
    }

    const sixth = await attempt()
    expect(sixth.status).toBe(429)
    expect(sixth.body.code).toBe('rate_limited')
  })

  it('counts successful attempts against the same budget', async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await login()).status).toBe(200)
    }
    expect((await login()).status).toBe(429)
  })
})
