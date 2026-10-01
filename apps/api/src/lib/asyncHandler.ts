import type { NextFunction, Request, RequestHandler, Response } from 'express'

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

/**
 * Express 4 ignores a rejected promise from a handler: the request hangs and
 * the error never reaches the central handler. Every async route goes through
 * this, which forwards the rejection to next() instead.
 */
export const wrap =
  (handler: AsyncRequestHandler): RequestHandler =>
  (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next)
  }
