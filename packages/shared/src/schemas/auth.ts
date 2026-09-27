import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.coerce.date(),
})

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
})

export type LoginInput = z.infer<typeof loginSchema>
export type AuthUser = z.infer<typeof userSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
