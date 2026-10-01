import type { RequestHandler } from 'express'
import { paginationQuerySchema } from '@portfolio/shared'
import { badRequest } from '../lib/errors.js'
import { withQuery, wrap } from '../lib/asyncHandler.js'
import { revalidate } from '../lib/revalidate.js'
import * as mediaService from '../services/media.service.js'

export const postUpload: RequestHandler = wrap(async (req, res) => {
  if (!req.file) throw badRequest('Attach an image as the "file" field')

  const media = await mediaService.createFromUpload(req.file)
  res.status(201).json(media)
})

export const getMedia: RequestHandler = withQuery(
  paginationQuerySchema,
  async ({ page, limit }, _req, res) => {
    res.json(await mediaService.listMedia(page, limit))
  },
)

export const deleteMedia: RequestHandler = wrap(async (req, res) => {
  await mediaService.deleteMedia(req.params['id'] ?? '')
  // A deleted image may have been a cover; let the site rebuild the pages using it.
  revalidate('media')
  res.status(204).send()
})
