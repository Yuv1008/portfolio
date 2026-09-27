import pino from 'pino'
import { env, isProduction, isTest } from './env.js'

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  // Structured JSON in production, readable lines in development.
  transport:
    isProduction || isTest
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'passwordHash',
      '*.password',
    ],
    censor: '[redacted]',
  },
})
