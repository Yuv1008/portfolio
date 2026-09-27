import { z } from 'zod'

export const mediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  publicId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  createdAt: z.coerce.date(),
})

export const allowedImageTypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
] as const

export const maxUploadBytes = 5 * 1024 * 1024

export type Media = z.infer<typeof mediaSchema>
