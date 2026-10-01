import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { prisma } from '../prisma.js'
import { resetRateLimits } from '../middleware/rateLimit.js'
import { app, createAdmin, disconnect, loginForToken, resetDb } from './helpers.js'

/**
 * Annotated rather than inferred: without this the return type narrows to the
 * happy-path shape, and the failure cases below cannot be mocked.
 */
interface SendResult {
  data: { id: string } | null
  error: { message: string } | null
}

const sendMock = vi.hoisted(() =>
  vi.fn(async (): Promise<SendResult> => ({ data: { id: 'mail_1' }, error: null })),
)

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

const validMessage = {
  name: 'Sample Visitor',
  email: 'visitor@example.com',
  subject: 'Freelance enquiry',
  body: 'I saw your portfolio and wanted to ask about availability next quarter.',
}

let token = ''
const auth = () => ({ Authorization: `Bearer ${token}` })

beforeEach(async () => {
  await resetDb()
  resetRateLimits()
  sendMock.mockClear()
  await createAdmin()
  token = await loginForToken()
})

afterAll(async () => {
  await disconnect()
})

describe('POST /contact', () => {
  it('saves the message and returns 201', async () => {
    const res = await request(app).post('/contact').send(validMessage)

    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)

    const saved = await prisma.message.findFirstOrThrow()
    expect(saved.email).toBe('visitor@example.com')
    expect(saved.subject).toBe('Freelance enquiry')
    expect(saved.read).toBe(false)
  })

  it('rejects a filled honeypot without writing a row', async () => {
    const res = await request(app)
      .post('/contact')
      .send({ ...validMessage, company: 'Spam Corp' })

    // 201 on purpose: a bot should not learn that it was caught.
    expect(res.status).toBe(201)
    expect(await prisma.message.count()).toBe(0)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid body with field errors', async () => {
    const res = await request(app)
      .post('/contact')
      .send({ name: 'x', email: 'nope', subject: 'hi', body: 'too short' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('validation_error')
    expect(Object.keys(res.body.fields).sort()).toEqual(['body', 'email', 'name', 'subject'])
    expect(await prisma.message.count()).toBe(0)
  })

  it('normalises the email and trims whitespace', async () => {
    await request(app)
      .post('/contact')
      .send({ ...validMessage, email: '  Visitor@Example.COM  ', name: '  Sample Visitor  ' })

    const saved = await prisma.message.findFirstOrThrow()
    expect(saved.email).toBe('visitor@example.com')
    expect(saved.name).toBe('Sample Visitor')
  })

  it('returns 429 on the fourth submission in an hour', async () => {
    for (let i = 0; i < 3; i += 1) {
      const res = await request(app)
        .post('/contact')
        .send({ ...validMessage, subject: `Enquiry ${i}` })
      expect(res.status).toBe(201)
    }

    const fourth = await request(app).post('/contact').send(validMessage)
    expect(fourth.status).toBe(429)
    expect(fourth.body.code).toBe('rate_limited')
    expect(await prisma.message.count()).toBe(3)
  })

  it('still saves the message when the mail provider fails', async () => {
    sendMock.mockRejectedValueOnce(new Error('Resend is down'))

    const res = await request(app).post('/contact').send(validMessage)

    expect(res.status).toBe(201)
    expect(res.body.emailed).toBe(false)
    expect(await prisma.message.count()).toBe(1)
  })

  it('reports emailed:false when Resend returns an error object', async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'Invalid from address' } })

    const res = await request(app).post('/contact').send(validMessage)

    expect(res.status).toBe(201)
    expect(res.body.emailed).toBe(false)
    expect(await prisma.message.count()).toBe(1)
  })
})

describe('admin messages', () => {
  const seedMessages = async (count: number) => {
    for (let i = 1; i <= count; i += 1) {
      await prisma.message.create({
        data: {
          name: i === 1 ? 'Findable Person' : `Visitor ${i}`,
          email: `visitor${i}@example.com`,
          subject: `Subject ${i}`,
          body: `Body ${i}`,
          read: i % 2 === 0,
        },
      })
    }
  }

  it('requires auth', async () => {
    expect((await request(app).get('/admin/messages')).status).toBe(401)
    expect((await request(app).get('/admin/messages/unread-count')).status).toBe(401)
  })

  it('paginates newest first', async () => {
    await seedMessages(5)
    const res = await request(app).get('/admin/messages?page=1&limit=2').set(auth())

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.total).toBe(5)
    expect(res.body.pages).toBe(3)
    expect(res.body.items[0].subject).toBe('Subject 5')
  })

  it('searches across name, email and subject', async () => {
    await seedMessages(5)
    const res = await request(app).get('/admin/messages?q=findable').set(auth())

    expect(res.body.total).toBe(1)
    expect(res.body.items[0].name).toBe('Findable Person')
  })

  it('counts unread', async () => {
    await seedMessages(5)
    const res = await request(app).get('/admin/messages/unread-count').set(auth())

    // 1, 3 and 5 are unread.
    expect(res.body.unread).toBe(3)
  })

  it('toggles read and back', async () => {
    await seedMessages(1)
    const message = await prisma.message.findFirstOrThrow()

    const read = await request(app)
      .patch(`/admin/messages/${message.id}/read`)
      .set(auth())
      .send({ read: true })
    expect(read.status).toBe(200)
    expect(read.body.read).toBe(true)

    const unread = await request(app)
      .patch(`/admin/messages/${message.id}/read`)
      .set(auth())
      .send({ read: false })
    expect(unread.body.read).toBe(false)
  })

  it('deletes, and 404s on a second delete', async () => {
    await seedMessages(1)
    const message = await prisma.message.findFirstOrThrow()

    expect((await request(app).delete(`/admin/messages/${message.id}`).set(auth())).status).toBe(
      204,
    )
    expect((await request(app).delete(`/admin/messages/${message.id}`).set(auth())).status).toBe(
      404,
    )
  })
})
