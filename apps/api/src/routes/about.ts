import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getAbout, putAbout } from '../controllers/about.controller.js'

export const aboutRouter: Router = Router()

aboutRouter.get('/about', getAbout)
aboutRouter.put('/about', requireAuth, putAbout)
