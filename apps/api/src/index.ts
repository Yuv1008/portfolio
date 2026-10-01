import { createApp } from './app.js'
import { env } from './env.js'
import { logger } from './logger.js'
import { prisma } from './prisma.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
})

// Without this, a port clash surfaces as an unhandled 'error' event and a wall
// of node internals. It happens routinely in dev, when a watch restart begins
// before the previous process has let go of the port.
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${String(env.PORT)} is already in use. Stop the other process, or set PORT.`)
  } else {
    logger.error({ err: error }, 'The server could not start')
  }
  process.exit(1)
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
