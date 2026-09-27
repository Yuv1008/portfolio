import { z } from 'zod'
import { messageSchema } from './message.js'

export const statsSchema = z.object({
  counts: z.object({
    projects: z.number().int(),
    blogs: z.number().int(),
    skills: z.number().int(),
    experience: z.number().int(),
    testimonials: z.number().int(),
    services: z.number().int(),
    media: z.number().int(),
    messages: z.number().int(),
  }),
  unreadMessages: z.number().int(),
  recentMessages: z.array(messageSchema),
})

export type Stats = z.infer<typeof statsSchema>
