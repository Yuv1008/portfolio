import type { Paginated } from '@portfolio/shared'

export interface PageArgs {
  skip: number
  take: number
}

export const pageArgs = (page: number, limit: number): PageArgs => ({
  skip: (page - 1) * limit,
  take: limit,
})

export const paginated = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> => ({
  items,
  total,
  page,
  limit,
  pages: total === 0 ? 0 : Math.ceil(total / limit),
})

/** Case-insensitive OR across the fields a resource declares searchable. */
export const searchWhere = (
  q: string | undefined,
  fields: readonly string[],
): Record<string, unknown> | undefined => {
  const term = q?.trim()
  if (!term || fields.length === 0) return undefined
  return {
    OR: fields.map((field) => ({ [field]: { contains: term, mode: 'insensitive' } })),
  }
}
