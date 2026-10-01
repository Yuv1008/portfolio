import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { prisma } from '../prisma.js'
import { resetRateLimits } from '../middleware/rateLimit.js'
import { app, createAdmin, disconnect, loginForToken, resetDb } from './helpers.js'

const uploadMock = vi.hoisted(() =>
  vi.fn(async (_buffer: Buffer, filename: string) => ({
    url: `https://res.cloudinary.com/demo/image/upload/portfolio/${filename}`,
    publicId: `portfolio/${filename.replace(/\.[^.]+$/, '')}`,
    width: 800,
    height: 600,
    bytes: 12345,
    format: 'png',
  })),
)
const destroyMock = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('../lib/cloudinary.js', () => ({
  uploadImage: uploadMock,
  destroyImage: destroyMock,
  isCloudinaryConfigured: () => true,
}))

/** A real 1x1 PNG, so multer sees genuine image bytes rather than a stub. */
const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

let token = ''
const auth = () => ({ Authorization: `Bearer ${token}` })

beforeEach(async () => {
  await resetDb()
  resetRateLimits()
  uploadMock.mockClear()
  destroyMock.mockClear()
  await createAdmin()
  token = await loginForToken()
})

afterAll(async () => {
  await disconnect()
})

describe('POST /admin/upload', () => {
  it('stores the Cloudinary URL and metadata, never the file itself', async () => {
    const res = await request(app)
      .post('/admin/upload')
      .set(auth())
      .attach('file', onePixelPng, { filename: 'avatar.png', contentType: 'image/png' })

    expect(res.status).toBe(201)
    expect(res.body.url).toContain('res.cloudinary.com')
    expect(res.body.filename).toBe('avatar.png')
    expect(res.body.mimeType).toBe('image/png')
    expect(res.body.width).toBe(800)
    expect(res.body.height).toBe(600)

    const row = await prisma.media.findFirstOrThrow()
    expect(row.publicId).toBe('portfolio/avatar')
    expect(uploadMock).toHaveBeenCalledOnce()
  })

  it('requires auth', async () => {
    const res = await request(app)
      .post('/admin/upload')
      .attach('file', onePixelPng, { filename: 'avatar.png', contentType: 'image/png' })

    expect(res.status).toBe(401)
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('rejects a non-image with 400 and uploads nothing', async () => {
    const res = await request(app)
      .post('/admin/upload')
      .set(auth())
      .attach('file', Buffer.from('%PDF-1.4 not really a pdf'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('unsupported_media_type')
    expect(uploadMock).not.toHaveBeenCalled()
    expect(await prisma.media.count()).toBe(0)
  })

  it('rejects a file over 5 MB with 413', async () => {
    const tooBig = Buffer.alloc(5 * 1024 * 1024 + 1024, 0)

    const res = await request(app)
      .post('/admin/upload')
      .set(auth())
      .attach('file', tooBig, { filename: 'huge.png', contentType: 'image/png' })

    expect(res.status).toBe(413)
    expect(res.body.code).toBe('payload_too_large')
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('400s when no file is attached', async () => {
    const res = await request(app).post('/admin/upload').set(auth())
    expect(res.status).toBe(400)
  })
})

describe('GET /admin/media', () => {
  it('lists newest first, paginated', async () => {
    for (const name of ['one.png', 'two.png', 'three.png']) {
      await request(app)
        .post('/admin/upload')
        .set(auth())
        .attach('file', onePixelPng, { filename: name, contentType: 'image/png' })
    }

    const res = await request(app).get('/admin/media?limit=2').set(auth())

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.total).toBe(3)
    expect(res.body.items[0].filename).toBe('three.png')
  })

  it('requires auth', async () => {
    expect((await request(app).get('/admin/media')).status).toBe(401)
  })
})

describe('DELETE /admin/media/:id', () => {
  it('removes the Cloudinary asset and then the row', async () => {
    const uploaded = await request(app)
      .post('/admin/upload')
      .set(auth())
      .attach('file', onePixelPng, { filename: 'gone.png', contentType: 'image/png' })

    const res = await request(app).delete(`/admin/media/${uploaded.body.id}`).set(auth())

    expect(res.status).toBe(204)
    expect(destroyMock).toHaveBeenCalledWith('portfolio/gone')
    expect(await prisma.media.count()).toBe(0)
  })

  it('keeps the row when Cloudinary refuses the delete', async () => {
    const uploaded = await request(app)
      .post('/admin/upload')
      .set(auth())
      .attach('file', onePixelPng, { filename: 'stuck.png', contentType: 'image/png' })

    destroyMock.mockRejectedValueOnce(new Error('Cloudinary is down'))

    const res = await request(app).delete(`/admin/media/${uploaded.body.id}`).set(auth())

    expect(res.status).toBe(500)
    // The row survives, so the file is not orphaned and the delete can be retried.
    expect(await prisma.media.count()).toBe(1)
  })

  it('404s for an unknown id', async () => {
    const res = await request(app).delete('/admin/media/does-not-exist').set(auth())
    expect(res.status).toBe(404)
  })
})
