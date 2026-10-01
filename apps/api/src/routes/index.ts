import { Router } from 'express'
import { healthRouter } from './health.js'
import { authRouter } from './auth.js'

/**
 * Every route the API serves is mounted here. Phases 3 and 4 add the content,
 * media, contact and message routers alongside these.
 */
export const routes: Router = Router()

routes.use(healthRouter)
routes.use(authRouter)
