import { z } from 'zod'
import { optionalText } from '../common.js'

export const skillCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  category: z.string().trim().min(1, 'Category is required').max(80),
  level: z.coerce.number().int().min(1, 'Level runs 1 to 5').max(5),
  icon: optionalText(80),
  order: z.coerce.number().int().min(0).default(0),
})

export const skillUpdateSchema = skillCreateSchema.partial()

export const skillSchema = skillCreateSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type SkillCreateInput = z.infer<typeof skillCreateSchema>
export type SkillUpdateInput = z.infer<typeof skillUpdateSchema>
export type Skill = z.infer<typeof skillSchema>
