import type { ErrorRequestHandler, RequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { AppError } from '../lib/errors.js'
import { isProduction } from '../env.js'
import { logger } from '../logger.js'

/** Turns zod issues into `{ field: [messages] }` without depending on a zod major version. */
export const fieldErrorsFrom = (error: ZodError): Record<string, string[]> => {
  const fields: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_'
    const bucket = fields[key]
    if (bucket) bucket.push(issue.message)
    else fields[key] = [issue.message]
  }
  return fields
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `No route for ${req.method} ${req.originalUrl}`, 'not_found'))
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'validation_error',
      fields: fieldErrorsFrom(err),
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(err.details === undefined ? {} : { details: err.details }),
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.['target']
      const fields = Array.isArray(target) ? target.join(', ') : String(target ?? 'value')
      res.status(409).json({
        error: `That ${fields} is already taken`,
        code: 'conflict',
      })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Not found', code: 'not_found' })
      return
    }
  }

  // Multer's own errors arrive as plain objects with a code.
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code
    if (code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'That file is larger than 5 MB', code: 'payload_too_large' })
      return
    }
  }

  const message = err instanceof Error ? err.message : 'Unknown error'
  logger.error({ err }, `Unhandled error: ${message}`)

  res.status(500).json({
    error: 'Something went wrong',
    code: 'internal_error',
    // The stack stays in the log; only development gets it in the body.
    ...(isProduction ? {} : { message }),
  })
}
