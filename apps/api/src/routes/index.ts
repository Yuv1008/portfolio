import { Router } from 'express'
import { healthRouter } from './health.js'

/**
 * Every route the API serves is mounted here. Phases 2 to 4 add the auth,
 * content, media, contact and message routers alongside health.
 */
export const routes = Router()

routes.use(healthRouter)
