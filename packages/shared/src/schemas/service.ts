import { z } from 'zod'
import { optionalText } from '../common.js'

export const serviceCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().trim().min(1, 'Description is required').max(1000),
  icon: optionalText(80),
  order: z.coerce.number().int().min(0).default(0),
})

export const serviceUpdateSchema = serviceCreateSchema.partial()

export const serviceSchema = serviceCreateSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>
export type Service = z.infer<typeof serviceSchema>
