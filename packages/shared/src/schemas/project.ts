import { z } from 'zod'
import { markdownSchema, optionalUrl, slugSchema } from '../common.js'

export const projectCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  slug: slugSchema,
  summary: z.string().trim().min(1, 'Summary is required').max(300),
  content: markdownSchema,
  coverImageUrl: optionalUrl,
  techStack: z.array(z.string().trim().min(1)).max(30).default([]),
  githubUrl: optionalUrl,
  liveUrl: optionalUrl,
  featured: z.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0),
  published: z.boolean().default(false),
})

export const projectUpdateSchema = projectCreateSchema.partial()

export const projectSchema = projectCreateSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>
export type Project = z.infer<typeof projectSchema>
