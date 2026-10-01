import { Router } from 'express'
import { healthRouter } from './health.js'
import { authRouter } from './auth.js'
import { aboutRouter } from './about.js'
import { contentRouter } from './content.js'
import { mediaRouter } from './media.js'
import { contactRouter } from './contact.js'

/** Every route the API serves is mounted here. */
export const routes: Router = Router()

routes.use(healthRouter)
routes.use(authRouter)
routes.use(aboutRouter)
routes.use(contentRouter)
routes.use(mediaRouter)
routes.use(contactRouter)
