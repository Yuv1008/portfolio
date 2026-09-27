import { PrismaClient } from '@prisma/client'
import { isProduction } from './env.js'

/**
 * One client for the process. In dev, tsx watch reloads this module on every
 * change, so the instance is cached on globalThis to avoid exhausting the
 * connection pool with an orphaned client per reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['warn', 'error'] : ['warn', 'error'],
  })

if (!isProduction) globalForPrisma.prisma = prisma
