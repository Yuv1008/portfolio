import { z } from 'zod'

/** Slugs are lowercase, hyphen-separated, no leading or trailing hyphen. */
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(120)
  .regex(slugPattern, 'Use lowercase letters, numbers and single hyphens')

export const cuidSchema = z.string().min(1, 'An id is required')

export const idParamSchema = z.object({ id: cuidSchema })

export const slugParamSchema = z.object({ slug: slugSchema })

/** Matches either, so one route can serve /projects/:idOrSlug. */
export const idOrSlugParamSchema = z.object({ idOrSlug: z.string().min(1) })

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
})

/** Admin list views may ask for unpublished rows too. */
export const adminListQuerySchema = paginationQuerySchema.extend({
  published: z
    .enum(['true', 'false', 'all'])
    .default('all')
    .transform((v) => (v === 'all' ? undefined : v === 'true')),
})

export const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: cuidSchema,
        order: z.number().int().min(0),
      }),
    )
    .min(1, 'Send at least one item'),
})

/**
 * An optional URL, as a form can actually express it.
 *
 * A cleared <input> yields "", never null, and "" is not a valid URL — so
 * without this preprocess, leaving an optional field blank made the whole form
 * unsubmittable. Empty becomes null, which is what the column stores.
 */
export const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().trim().url('Must be a valid URL').max(2048).nullable().optional(),
)

/** Same reasoning as optionalUrl: a cleared input stores null, not "". */
export const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(max).nullable().optional(),
  )

export const markdownSchema = z.string().min(1, 'Content is required')

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type ReorderPayload = z.infer<typeof reorderSchema>

/** Shape every paginated list endpoint returns. */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    pages: z.number().int(),
  })
