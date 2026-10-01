import { Router } from 'express'
import { healthRouter } from './health.js'
import { authRouter } from './auth.js'
import { aboutRouter } from './about.js'
import { contentRouter } from './content.js'

/**
 * Every route the API serves is mounted here. Phase 4 adds media, contact and
 * messages alongside these.
 */
export const routes: Router = Router()

routes.use(healthRouter)
routes.use(authRouter)
routes.use(aboutRouter)
routes.use(contentRouter)
