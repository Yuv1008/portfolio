import { Router } from 'express'
import { idParamSchema } from '@portfolio/shared'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { uploadSingleImage } from '../middleware/upload.js'
import { deleteMedia, getMedia, postUpload } from '../controllers/media.controller.js'

export const mediaRouter: Router = Router()

mediaRouter.use('/admin', requireAuth)

mediaRouter.post('/admin/upload', uploadSingleImage, postUpload)
mediaRouter.get('/admin/media', getMedia)
mediaRouter.delete('/admin/media/:id', validate({ params: idParamSchema }), deleteMedia)
