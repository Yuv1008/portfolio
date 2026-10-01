import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { z, ZodTypeAny } from 'zod'

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

type Handler<T> = (data: T, req: Request, res: Response) => Promise<unknown>

/**
 * Parses the body once and hands the handler the typed result.
 *
 * The earlier shape — a validate() middleware that rewrote req.body, then a
 * second .parse() inside the handler — ran every schema twice. That is wrong
 * for any schema whose output differs from its input: parsing "false" to a
 * boolean works once and fails the second time. Parsing in exactly one place
 * also means the handler needs no cast to know the type.
 */
export const withBody = <S extends ZodTypeAny>(
  schema: S,
  handler: Handler<z.output<S>>,
): RequestHandler =>
  wrap(async (req, res) => {
    await handler(schema.parse(req.body) as z.output<S>, req, res)
  })

export const withQuery = <S extends ZodTypeAny>(
  schema: S,
  handler: Handler<z.output<S>>,
): RequestHandler =>
  wrap(async (req, res) => {
    await handler(schema.parse(req.query) as z.output<S>, req, res)
  })
