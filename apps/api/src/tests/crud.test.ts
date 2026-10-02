import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../prisma.js'
import { resetRateLimits } from '../middleware/rateLimit.js'
import { app, createAdmin, disconnect, loginForToken, resetDb } from './helpers.js'

let token = ''

const auth = () => ({ Authorization: `Bearer ${token}` })

const projectBody = (overrides: Record<string, unknown> = {}) => ({
  title: 'Relay Queue',
  slug: 'relay-queue',
  summary: 'A distributed job queue.',
  content: '## What it does\n\nRuns jobs.',
  techStack: ['TypeScript', 'Postgres'],
  featured: true,
  order: 0,
  published: true,
  ...overrides,
})

beforeEach(async () => {
  await resetDb()
  resetRateLimits()
  await createAdmin()
  token = await loginForToken()
})

afterAll(async () => {
  await disconnect()
})

describe('admin CRUD over projects', () => {
  it('creates, reads, updates and deletes', async () => {
    const created = await request(app).post('/admin/projects').set(auth()).send(projectBody())
    expect(created.status).toBe(201)
    expect(created.body.title).toBe('Relay Queue')
    expect(created.body.techStack).toEqual(['TypeScript', 'Postgres'])
    const id = created.body.id

    const read = await request(app).get(`/admin/projects/${id}`).set(auth())
    expect(read.status).toBe(200)
    expect(read.body.id).toBe(id)

    const updated = await request(app)
      .patch(`/admin/projects/${id}`)
      .set(auth())
      .send({ title: 'Relay Queue v2' })
    expect(updated.status).toBe(200)
    expect(updated.body.title).toBe('Relay Queue v2')
    // A partial update must not blank the fields it left out.
    expect(updated.body.summary).toBe('A distributed job queue.')
    expect(new Date(updated.body.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.body.updatedAt).getTime(),
    )

    const removed = await request(app).delete(`/admin/projects/${id}`).set(auth())
    expect(removed.status).toBe(204)

    const gone = await request(app).delete(`/admin/projects/${id}`).set(auth())
    expect(gone.status).toBe(404)
  })

  it('returns 409 on a duplicate slug rather than 500', async () => {
    await request(app).post('/admin/projects').set(auth()).send(projectBody())
    const dupe = await request(app).post('/admin/projects').set(auth()).send(projectBody())

    expect(dupe.status).toBe(409)
    expect(dupe.body.code).toBe('conflict')
  })

  it('rejects an invalid body with field errors', async () => {
    const res = await request(app)
      .post('/admin/projects')
      .set(auth())
      .send(projectBody({ title: '', slug: 'Not A Slug' }))

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('validation_error')
    expect(Object.keys(res.body.fields).sort()).toEqual(['slug', 'title'])
  })

  it('refuses every admin verb without a token', async () => {
    const created = await request(app).post('/admin/projects').set(auth()).send(projectBody())
    const id = created.body.id

    const calls = [
      request(app).get('/admin/projects'),
      request(app).get(`/admin/projects/${id}`),
      request(app)
        .post('/admin/projects')
        .send(projectBody({ slug: 'another' })),
      request(app).put(`/admin/projects/${id}`).send(projectBody()),
      request(app).patch(`/admin/projects/${id}`).send({ title: 'x' }),
      request(app)
        .patch('/admin/projects/reorder')
        .send({ items: [{ id, order: 0 }] }),
      request(app).delete(`/admin/projects/${id}`),
    ]

    for (const res of await Promise.all(calls)) {
      expect(res.status).toBe(401)
    }
  })
})

describe('public reads only show published rows', () => {
  beforeEach(async () => {
    await request(app).post('/admin/projects').set(auth()).send(projectBody())
    await request(app)
      .post('/admin/projects')
      .set(auth())
      .send(projectBody({ title: 'Draft', slug: 'draft', published: false, order: 1 }))
  })

  it('omits unpublished rows from the public list but keeps them for admin', async () => {
    const pub = await request(app).get('/projects')
    expect(pub.status).toBe(200)
    expect(pub.body).toHaveLength(1)
    expect(pub.body[0].slug).toBe('relay-queue')

    const admin = await request(app).get('/admin/projects').set(auth())
    expect(admin.body).toHaveLength(2)
  })

  it('404s on a public fetch of an unpublished slug', async () => {
    expect((await request(app).get('/projects/draft')).status).toBe(404)
    expect((await request(app).get('/projects/relay-queue')).status).toBe(200)
  })

  it('serves a public row by id as well as by slug', async () => {
    const list = await request(app).get('/projects')
    const { id, slug } = list.body[0]

    expect((await request(app).get(`/projects/${id}`)).status).toBe(200)
    expect((await request(app).get(`/projects/${slug}`)).status).toBe(200)
  })

  it('lets admin filter by published state', async () => {
    const drafts = await request(app).get('/admin/projects?published=false').set(auth())
    expect(drafts.body).toHaveLength(1)
    expect(drafts.body[0].slug).toBe('draft')
  })
})

describe('reorder', () => {
  it('applies a new order and the public list reflects it', async () => {
    const slugs = ['first', 'second', 'third']
    const ids: string[] = []
    for (const [index, slug] of slugs.entries()) {
      const res = await request(app)
        .post('/admin/projects')
        .set(auth())
        .send(projectBody({ slug, title: slug, order: index }))
      ids.push(res.body.id)
    }

    const before = await request(app).get('/projects')
    expect(before.body.map((p: { slug: string }) => p.slug)).toEqual(slugs)

    const reordered = await request(app)
      .patch('/admin/projects/reorder')
      .set(auth())
      .send({
        items: [
          { id: ids[2], order: 0 },
          { id: ids[1], order: 1 },
          { id: ids[0], order: 2 },
        ],
      })
    expect(reordered.status).toBe(200)
    expect(reordered.body.updated).toBe(3)

    const after = await request(app).get('/projects')
    expect(after.body.map((p: { slug: string }) => p.slug)).toEqual(['third', 'second', 'first'])
  })

  it('applies nothing when one id in the batch is unknown', async () => {
    const created = await request(app).post('/admin/projects').set(auth()).send(projectBody())

    const res = await request(app)
      .patch('/admin/projects/reorder')
      .set(auth())
      .send({
        items: [
          { id: created.body.id, order: 7 },
          { id: 'does-not-exist', order: 8 },
        ],
      })

    expect(res.status).toBe(404)

    // The transaction rolled back, so the valid half did not land either.
    const row = await prisma.project.findUniqueOrThrow({ where: { id: created.body.id } })
    expect(row.order).toBe(0)
  })
})

describe('pagination and search on blogs', () => {
  beforeEach(async () => {
    for (let i = 1; i <= 5; i += 1) {
      await request(app)
        .post('/admin/blogs')
        .set(auth())
        .send({
          title: i === 1 ? 'Testing the factory' : `Post ${i}`,
          slug: `post-${i}`,
          excerpt: `Excerpt ${i}`,
          content: `Body ${i}`,
          tags: ['tag'],
          published: true,
          publishedAt: new Date(2026, 0, i).toISOString(),
        })
    }
  })

  it('returns a page envelope with a correct total', async () => {
    const res = await request(app).get('/blogs?page=2&limit=2')

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.total).toBe(5)
    expect(res.body.page).toBe(2)
    expect(res.body.pages).toBe(3)
  })

  it('sorts newest first, since blogs have no order column', async () => {
    const res = await request(app).get('/blogs?limit=5')
    expect(res.body.items.map((b: { slug: string }) => b.slug)).toEqual([
      'post-5',
      'post-4',
      'post-3',
      'post-2',
      'post-1',
    ])
  })

  it('filters by ?q across title and excerpt, case-insensitively', async () => {
    const res = await request(app).get('/blogs?q=testing')
    expect(res.body.total).toBe(1)
    expect(res.body.items[0].slug).toBe('post-1')
  })

  it('rejects a limit above the cap', async () => {
    const res = await request(app).get('/blogs?limit=500')
    expect(res.status).toBe(400)
  })
})

describe('published filtering on every resource', () => {
  const samples: [string, Record<string, unknown>][] = [
    ['skills', { name: 'TypeScript', category: 'Languages', level: 5, order: 0 }],
    [
      'experience',
      {
        company: 'Acme',
        role: 'Engineer',
        location: 'Remote',
        startDate: '2025-01-01',
        current: true,
        description: 'Did things.',
        order: 0,
      },
    ],
    ['services', { title: 'Consulting', description: 'Advice.', order: 0 }],
  ]

  it.each(samples)('defaults %s to published, so nothing disappears', async (resource, body) => {
    const created = await request(app).post(`/admin/${resource}`).set(auth()).send(body)
    expect(created.status).toBe(201)
    expect(created.body.published).toBe(true)

    const res = await request(app).get(`/${resource}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it.each(samples)('hides unpublished %s from the public list', async (resource, body) => {
    const created = await request(app)
      .post(`/admin/${resource}`)
      .set(auth())
      .send({ ...body, published: false })
    expect(created.status).toBe(201)

    expect((await request(app).get(`/${resource}`)).body).toHaveLength(0)
    // Still visible to the admin, which is the whole point of the flag.
    expect((await request(app).get(`/admin/${resource}`).set(auth())).body).toHaveLength(1)
    expect((await request(app).get(`/${resource}/${created.body.id}`)).status).toBe(404)
  })
})

describe('/about', () => {
  const aboutBody = {
    name: 'Yuvraj Goraya',
    headline: 'Full-stack developer',
    bio: '## Hello\n\nSome markdown.',
    socials: { github: 'https://github.com/x' },
    location: 'Canada',
  }

  it('404s before anything is saved', async () => {
    expect((await request(app).get('/about')).status).toBe(404)
  })

  it('creates on first PUT and updates on the second, staying a singleton', async () => {
    const first = await request(app).put('/about').set(auth()).send(aboutBody)
    expect(first.status).toBe(200)
    expect(first.body.id).toBe('singleton')

    const second = await request(app)
      .put('/about')
      .set(auth())
      .send({ ...aboutBody, headline: 'Changed' })
    expect(second.body.headline).toBe('Changed')

    expect(await prisma.about.count()).toBe(1)

    const read = await request(app).get('/about')
    expect(read.body.headline).toBe('Changed')
    expect(read.body.socials).toEqual({ github: 'https://github.com/x' })
  })

  it('requires auth to write but not to read', async () => {
    expect((await request(app).put('/about').send(aboutBody)).status).toBe(401)
    await request(app).put('/about').set(auth()).send(aboutBody)
    expect((await request(app).get('/about')).status).toBe(200)
  })

  it('rejects a social value that is not a URL', async () => {
    const res = await request(app)
      .put('/about')
      .set(auth())
      .send({ ...aboutBody, socials: { github: 'not-a-url' } })

    expect(res.status).toBe(400)
  })
})
