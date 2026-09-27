import { config } from 'dotenv'
import { z } from 'zod'

config()

/**
 * Core variables are required: the process exits rather than booting half-configured.
 * The third-party keys (Cloudinary, Resend, revalidation) are optional here and
 * checked where they are used, so phases 1 to 3 run without external accounts.
 * Their consumers in phase 4 fail loudly with a named variable.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  ADMIN_URL: z.string().url('ADMIN_URL must be a full URL'),
  WEB_URL: z.string().url('WEB_URL must be a full URL'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be an email'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default('Portfolio <onboarding@resend.dev>'),
  OWNER_EMAIL: z.string().email().optional(),

  REVALIDATE_SECRET: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const lines = parsed.error.issues.map((issue) => {
    const name = issue.path.join('.') || '(root)'
    return `  ${name}: ${issue.message}`
  })
  console.error(
    [
      '',
      'Invalid environment. The API will not start until these are fixed:',
      ...lines,
      '',
      'See .env.example for the full list.',
      '',
    ].join('\n'),
  )
  process.exit(1)
}

export const env = Object.freeze(parsed.data)

export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

export type Env = typeof env
