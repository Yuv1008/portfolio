import type { RequestHandler } from 'express'
import { contactSchema, messageReadSchema, paginationQuerySchema } from '@portfolio/shared'
import { withBody, withQuery, wrap } from '../lib/asyncHandler.js'
import { logger } from '../logger.js'
import * as messageService from '../services/message.service.js'

export const postContact: RequestHandler = withBody(contactSchema, async (input, req, res) => {
  // The honeypot is hidden in the form, so only a bot fills it. Answer 201 so
  // the bot cannot tell it was caught, and write nothing.
  if (input.company) {
    logger.info({ ip: req.ip }, 'Contact submission rejected by the honeypot')
    res.status(201).json({ ok: true })
    return
  }

  const { emailed } = await messageService.submitContact(input)
  res.status(201).json({ ok: true, emailed })
})

export const getMessages: RequestHandler = withQuery(
  paginationQuerySchema,
  async ({ page, limit, q }, _req, res) => {
    res.json(await messageService.listMessages(page, limit, q))
  },
)

export const getUnreadCount: RequestHandler = wrap(async (_req, res) => {
  res.json({ unread: await messageService.unreadCount() })
})

export const patchRead: RequestHandler = withBody(messageReadSchema, async ({ read }, req, res) => {
  res.json(await messageService.setRead(req.params['id'] ?? '', read))
})

export const deleteMessage: RequestHandler = wrap(async (req, res) => {
  await messageService.deleteMessage(req.params['id'] ?? '')
  res.status(204).send()
})
