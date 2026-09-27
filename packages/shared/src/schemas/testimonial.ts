import { z } from 'zod'
import { optionalUrl } from '../common.js'

export const testimonialCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  role: z.string().trim().min(1, 'Role is required').max(120),
  company: z.string().trim().min(1, 'Company is required').max(120),
  quote: z.string().trim().min(1, 'Quote is required').max(1000),
  avatarUrl: optionalUrl,
  order: z.coerce.number().int().min(0).default(0),
  published: z.boolean().default(true),
})

export const testimonialUpdateSchema = testimonialCreateSchema.partial()

export const testimonialSchema = testimonialCreateSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TestimonialCreateInput = z.infer<typeof testimonialCreateSchema>
export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>
export type Testimonial = z.infer<typeof testimonialSchema>
