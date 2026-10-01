import { z } from 'zod'

/**
 * `company` is the honeypot: hidden in the form, so a human never fills it.
 * Kept in the shared schema so the site and the API agree on the field name.
 *
 * It is deliberately NOT validated as empty here. A schema error would answer
 * a bot with 400 and a field error naming `company`, which teaches it exactly
 * what to omit next time. The API accepts the field, replies 201 as if all is
 * well, and silently discards the submission instead.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  body: z.string().trim().min(10, 'Tell me a little more').max(5000),
  company: z.string().max(200).optional(),
})

export const messageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  subject: z.string(),
  body: z.string(),
  read: z.boolean(),
  createdAt: z.coerce.date(),
})

export const messageReadSchema = z.object({ read: z.boolean() })

export type ContactInput = z.infer<typeof contactSchema>
export type Message = z.infer<typeof messageSchema>
