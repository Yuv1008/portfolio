import { z } from 'zod'
import { markdownSchema, optionalText, optionalUrl } from '../common.js'

export const socialsSchema = z.record(z.string(), z.string().url('Each social must be a URL'))

export const aboutUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  headline: z.string().trim().min(1, 'Headline is required').max(200),
  bio: markdownSchema,
  avatarUrl: optionalUrl,
  resumeUrl: optionalUrl,
  socials: socialsSchema.default({}),
  location: optionalText(120),
})

export const aboutSchema = aboutUpdateSchema.extend({
  id: z.string(),
  updatedAt: z.coerce.date(),
})

export type AboutUpdateInput = z.infer<typeof aboutUpdateSchema>
export type About = z.infer<typeof aboutSchema>
