import { Router } from 'express'
import { idParamSchema } from '@portfolio/shared'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { contactRateLimit } from '../middleware/rateLimit.js'
import {
  deleteMessage,
  getMessages,
  getUnreadCount,
  patchRead,
  postContact,
} from '../controllers/contact.controller.js'

export const contactRouter: Router = Router()

contactRouter.post('/contact', contactRateLimit, postContact)

contactRouter.use('/admin', requireAuth)
contactRouter.get('/admin/messages', getMessages)
// Before /:id, so "unread-count" is never read as an identifier.
contactRouter.get('/admin/messages/unread-count', getUnreadCount)
contactRouter.patch('/admin/messages/:id/read', validate({ params: idParamSchema }), patchRead)
contactRouter.delete('/admin/messages/:id', validate({ params: idParamSchema }), deleteMessage)
