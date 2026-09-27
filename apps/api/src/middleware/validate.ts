import type { RequestHandler } from 'express'
import type { ZodTypeAny } from 'zod'

interface ValidateShape {
  body?: ZodTypeAny
  query?: ZodTypeAny
  params?: ZodTypeAny
}

/**
 * Parses the request with zod and writes the parsed output back, so handlers
 * receive coerced, defaulted, typed data rather than raw strings. A failure is
 * handed to the central error handler, which renders it as a 400 with fields.
 */
export const validate =
  (shape: ValidateShape): RequestHandler =>
  (req, _res, next) => {
    try {
      if (shape.params) req.params = shape.params.parse(req.params)
      if (shape.query) {
        // req.query has only a getter on Express 5; assigning to a copy keeps both versions happy.
        const parsedQuery: unknown = shape.query.parse(req.query)
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          writable: true,
          configurable: true,
        })
      }
      if (shape.body) req.body = shape.body.parse(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
