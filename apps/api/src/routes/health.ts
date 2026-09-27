import { Router } from 'express'
import { prisma } from '../prisma.js'
import { logger } from '../logger.js'

export const healthRouter = Router()

const startedAt = Date.now()

healthRouter.get('/health', async (_req, res) => {
  let db: 'up' | 'down' = 'down'
  try {
    await prisma.$queryRaw`SELECT 1`
    db = 'up'
  } catch (error) {
    logger.error({ err: error }, 'Health check could not reach the database')
  }

  // 200 only when the database answers; a load balancer should pull a node that cannot query.
  res.status(db === 'up' ? 200 : 503).json({
    status: db === 'up' ? 'ok' : 'degraded',
    db,
    uptime: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  })
})
