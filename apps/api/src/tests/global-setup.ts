import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

/**
 * Creates the test database if it is missing, then brings it up to the current
 * migration. Runs once per `vitest` invocation, before any worker starts, so a
 * fresh clone can run `pnpm test` with nothing but Postgres up.
 */
export default async function globalSetup(): Promise<void> {
  config({ path: path.resolve(process.cwd(), '.env.test'), override: true })

  const raw = process.env['DATABASE_URL']
  if (!raw) throw new Error('apps/api/.env.test is missing DATABASE_URL')

  const url = new URL(raw)
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!database) throw new Error(`No database name in DATABASE_URL: ${raw}`)

  if (!/test/i.test(database)) {
    // Guard rail: the suite truncates every table, so it must never point at dev data.
    throw new Error(`Refusing to run tests against "${database}" — the name must contain "test"`)
  }

  const maintenance = new URL(url.toString())
  maintenance.pathname = '/postgres'

  const admin = new PrismaClient({ datasourceUrl: maintenance.toString() })
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${database}"`)
    console.log(`Created test database "${database}"`)
  } catch {
    // Already there, which is the normal case after the first run.
  } finally {
    await admin.$disconnect()
  }

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: raw },
    stdio: 'pipe',
  })
}
