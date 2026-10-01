import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { loginRateLimit } from '../middleware/rateLimit.js'
import { getMe, postLogin, postLogout, postRefresh } from '../controllers/auth.controller.js'

export const authRouter: Router = Router()

authRouter.post('/auth/login', loginRateLimit, postLogin)
authRouter.post('/auth/refresh', postRefresh)
authRouter.post('/auth/logout', postLogout)
authRouter.get('/auth/me', requireAuth, getMe)
