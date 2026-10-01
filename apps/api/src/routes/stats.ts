import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { wrap } from '../lib/asyncHandler.js'
import { getStats } from '../services/stats.service.js'

export const statsRouter: Router = Router()

statsRouter.get(
  '/admin/stats',
  requireAuth,
  wrap(async (_req, res) => {
    res.json(await getStats())
  }),
)
