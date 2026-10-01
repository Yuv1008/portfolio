import path from 'node:path'
import { config } from 'dotenv'

/**
 * Runs in every test worker before anything else is imported, so src/env.ts
 * sees the test database rather than the development one. `override` matters:
 * a stray DATABASE_URL in the shell would otherwise win.
 */
config({ path: path.resolve(process.cwd(), '.env.test'), override: true })
