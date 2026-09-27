import { createApp } from './app.js'
import { env } from './env.js'
import { logger } from './logger.js'
import { prisma } from './prisma.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
})

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`)
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0))
  })
  // Do not let a hung connection hold the process open forever.
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
