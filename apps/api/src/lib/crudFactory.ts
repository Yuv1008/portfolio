import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import type { ZodTypeAny } from 'zod'
import {
  adminListQuerySchema,
  idParamSchema,
  paginationQuerySchema,
  reorderSchema,
} from '@portfolio/shared'
import { prisma } from '../prisma.js'
import { notFound } from './errors.js'
import { withBody, withQuery, wrap } from './asyncHandler.js'
import { pageArgs, paginated, searchWhere } from './pagination.js'
import { revalidate } from './revalidate.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'

/** The six content models the factory serves. */
export type CrudModel = 'skill' | 'project' | 'blog' | 'experience' | 'testimonial' | 'service'

export type SortOrder = 'asc' | 'desc'
export type OrderBy = Record<string, SortOrder>[]

export interface CrudConfig {
  /** Prisma delegate key. */
  model: CrudModel
  /** URL segment, e.g. "projects" for /projects and /admin/projects. */
  resource: string
  createSchema: ZodTypeAny
  updateSchema: ZodTypeAny
  /** Applied to public reads only. Omit for resources with no `published` column. */
  publicFilter?: Record<string, unknown>
  /** Public sort. */
  orderBy: OrderBy
  /** Admin sort, when it differs (drafts have no publishedAt to sort by). */
  adminOrderBy?: OrderBy
  searchFields?: readonly string[]
  /** Public list returns a page envelope rather than a bare array. */
  paginate?: boolean
  /** Adds lookup by slug alongside id. */
  hasSlug?: boolean
  /** Enables PATCH /admin/:resource/reorder. */
  reorderable?: boolean
  /** Cache tag sent to the web app after a write. */
  tag: string
}

/**
 * Prisma generates a differently-typed delegate per model, and calling a method
 * on a union of those delegates is not expressible in TypeScript. Rather than
 * reach for `any`, the factory talks to this narrow structural view and casts
 * once, here. Input is validated by the resource's zod schema before anything
 * reaches these methods, and the web client parses responses against the same
 * schemas, so the untyped gap is bounded by checks at both ends.
 */
interface CrudDelegate {
  // PrismaPromise, not Promise: $transaction only accepts the former, and it is
  // what makes the reorder below commit as one unit.
  findMany(args?: Record<string, unknown>): Prisma.PrismaPromise<unknown[]>
  findFirst(args: Record<string, unknown>): Prisma.PrismaPromise<unknown>
  create(args: Record<string, unknown>): Prisma.PrismaPromise<unknown>
  update(args: Record<string, unknown>): Prisma.PrismaPromise<unknown>
  delete(args: Record<string, unknown>): Prisma.PrismaPromise<unknown>
  count(args?: Record<string, unknown>): Prisma.PrismaPromise<number>
}

const delegateFor = (model: CrudModel): CrudDelegate => prisma[model] as unknown as CrudDelegate

/** Matches a row by id, or by slug when the resource has one. */
const identityWhere = (idOrSlug: string, hasSlug: boolean): Record<string, unknown> =>
  hasSlug ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } : { id: idOrSlug }

const and = (...parts: (Record<string, unknown> | undefined)[]): Record<string, unknown> => {
  const present = parts.filter((p): p is Record<string, unknown> => p !== undefined)
  if (present.length === 0) return {}
  if (present.length === 1) return present[0] as Record<string, unknown>
  return { AND: present }
}

export interface CrudRouters {
  publicRouter: Router
  adminRouter: Router
}

export const createCrudRouter = (config: CrudConfig): CrudRouters => {
  const {
    model,
    resource,
    createSchema,
    updateSchema,
    publicFilter,
    orderBy,
    adminOrderBy,
    searchFields = [],
    paginate = false,
    hasSlug = false,
    reorderable = false,
    tag,
  } = config

  const delegate = delegateFor(model)
  const publicRouter = Router()
  const adminRouter = Router()

  // ---- public ----

  publicRouter.get(
    `/${resource}`,
    withQuery(paginationQuerySchema, async ({ page, limit, q }, _req, res) => {
      const where = and(publicFilter, searchWhere(q, searchFields))

      if (!paginate) {
        res.json(await delegate.findMany({ where, orderBy }))
        return
      }

      const [items, total] = await Promise.all([
        delegate.findMany({ where, orderBy, ...pageArgs(page, limit) }),
        delegate.count({ where }),
      ])
      res.json(paginated(items, total, page, limit))
    }),
  )

  publicRouter.get(
    `/${resource}/:idOrSlug`,
    wrap(async (req, res) => {
      const idOrSlug = req.params['idOrSlug'] ?? ''
      const row = await delegate.findFirst({
        where: and(publicFilter, identityWhere(idOrSlug, hasSlug)),
      })
      // An unpublished row is indistinguishable from a missing one in public.
      if (!row) throw notFound(`No ${resource.replace(/s$/, '')} with that identifier`)
      res.json(row)
    }),
  )

  // ---- admin ----

  adminRouter.use(requireAuth)

  adminRouter.get(
    `/${resource}`,
    withQuery(adminListQuerySchema, async ({ page, limit, q, published }, _req, res) => {
      const where = and(
        published === undefined ? undefined : { published },
        searchWhere(q, searchFields),
      )
      const sort = adminOrderBy ?? orderBy

      if (!paginate) {
        res.json(await delegate.findMany({ where, orderBy: sort }))
        return
      }

      const [items, total] = await Promise.all([
        delegate.findMany({ where, orderBy: sort, ...pageArgs(page, limit) }),
        delegate.count({ where }),
      ])
      res.json(paginated(items, total, page, limit))
    }),
  )

  // Registered before /:id so "reorder" is never parsed as an identifier.
  if (reorderable) {
    adminRouter.patch(
      `/${resource}/reorder`,
      withBody(reorderSchema, async ({ items }, _req, res) => {
        // One transaction, so a half-applied order can never be observed.
        await prisma.$transaction(
          items.map((item) =>
            delegate.update({ where: { id: item.id }, data: { order: item.order } }),
          ),
        )
        revalidate(tag)
        res.status(200).json({ updated: items.length })
      }),
    )
  }

  adminRouter.get(
    `/${resource}/:id`,
    validate({ params: idParamSchema }),
    wrap(async (req, res) => {
      const row = await delegate.findFirst({
        where: identityWhere(req.params['id'] ?? '', hasSlug),
      })
      if (!row) throw notFound('Not found')
      res.json(row)
    }),
  )

  adminRouter.post(
    `/${resource}`,
    withBody(createSchema, async (data, _req, res) => {
      const row = await delegate.create({ data })
      revalidate(tag)
      res.status(201).json(row)
    }),
  )

  adminRouter.put(
    `/${resource}/:id`,
    validate({ params: idParamSchema }),
    withBody(createSchema, async (data, req, res) => {
      const row = await delegate.update({ where: { id: req.params['id'] }, data })
      revalidate(tag)
      res.json(row)
    }),
  )

  adminRouter.patch(
    `/${resource}/:id`,
    validate({ params: idParamSchema }),
    withBody(updateSchema, async (data, req, res) => {
      const row = await delegate.update({ where: { id: req.params['id'] }, data })
      revalidate(tag)
      res.json(row)
    }),
  )

  adminRouter.delete(
    `/${resource}/:id`,
    validate({ params: idParamSchema }),
    wrap(async (req, res) => {
      await delegate.delete({ where: { id: req.params['id'] } })
      revalidate(tag)
      res.status(204).send()
    }),
  )

  return { publicRouter, adminRouter }
}
