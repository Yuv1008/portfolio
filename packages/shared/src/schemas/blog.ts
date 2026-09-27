import { z } from 'zod'
import { markdownSchema, optionalUrl, slugSchema } from '../common.js'

export const blogCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  slug: slugSchema,
  excerpt: z.string().trim().min(1, 'Excerpt is required').max(300),
  content: markdownSchema,
  coverImageUrl: optionalUrl,
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  published: z.boolean().default(false),
  publishedAt: z.coerce.date().nullable().optional(),
})

export const blogUpdateSchema = blogCreateSchema.partial()

export const blogSchema = blogCreateSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type BlogCreateInput = z.infer<typeof blogCreateSchema>
export type BlogUpdateInput = z.infer<typeof blogUpdateSchema>
export type Blog = z.infer<typeof blogSchema>
