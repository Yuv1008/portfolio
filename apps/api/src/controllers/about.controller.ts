import type { RequestHandler } from 'express'
import { aboutUpdateSchema } from '@portfolio/shared'
import { withBody, wrap } from '../lib/asyncHandler.js'
import { notFound } from '../lib/errors.js'
import { revalidate } from '../lib/revalidate.js'
import * as aboutService from '../services/about.service.js'

export const getAbout: RequestHandler = wrap(async (_req, res) => {
  const about = await aboutService.getAbout()
  // Before the first save there is no row; say so rather than returning null.
  if (!about) throw notFound('About has not been set up yet')
  res.json(about)
})

export const putAbout: RequestHandler = withBody(aboutUpdateSchema, async (input, _req, res) => {
  const about = await aboutService.upsertAbout(input)
  revalidate('about')
  res.json(about)
})
