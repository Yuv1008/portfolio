import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { pinoHttp } from 'pino-http'
import { env, isTest } from './env.js'
import { logger } from './logger.js'
import { routes } from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import { forbidden } from './lib/errors.js'

export const createApp = () => {
  const app = express()

  // Render and Vercel sit in front of this, so rate limiting needs the real client IP.
  app.set('trust proxy', 1)

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

  const allowedOrigins = new Set([env.ADMIN_URL, env.WEB_URL])
  app.use(
    cors({
      origin: (origin, callback) => {
        // Server-to-server calls (the web app's fetch, curl, Supertest) send no Origin.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true)
        // A plain Error here would surface as a 500; this is a refusal, not a fault.
        callback(forbidden(`Origin ${origin} is not allowed`))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )

  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(cookieParser())

  if (!isTest) {
    app.use(
      pinoHttp({
        logger,
        // Health checks would otherwise dominate the log.
        autoLogging: { ignore: (req) => req.url === '/health' },
      }),
    )
  }

  app.use(routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
