import { z } from 'zod'
import { markdownSchema } from '../common.js'

export const experienceCreateSchema = z
  .object({
    company: z.string().trim().min(1, 'Company is required').max(120),
    role: z.string().trim().min(1, 'Role is required').max(120),
    location: z.string().trim().min(1, 'Location is required').max(120),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    current: z.boolean().default(false),
    description: markdownSchema,
    order: z.coerce.number().int().min(0).default(0),
  })
  .refine((v) => v.current || v.endDate != null, {
    message: 'Give an end date, or mark the role as current',
    path: ['endDate'],
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: 'End date cannot precede the start date',
    path: ['endDate'],
  })

/** The refinements above need the whole object, so partial updates drop them. */
export const experienceUpdateSchema = z
  .object({
    company: z.string().trim().min(1).max(120),
    role: z.string().trim().min(1).max(120),
    location: z.string().trim().min(1).max(120),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable(),
    current: z.boolean(),
    description: markdownSchema,
    order: z.coerce.number().int().min(0),
  })
  .partial()

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  current: z.boolean(),
  description: z.string(),
  order: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ExperienceCreateInput = z.infer<typeof experienceCreateSchema>
export type ExperienceUpdateInput = z.infer<typeof experienceUpdateSchema>
export type Experience = z.infer<typeof experienceSchema>
