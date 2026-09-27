/** Anything thrown with a status the client is allowed to see. */
export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, message: string, code = 'error', details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, 'bad_request', details)

export const unauthorized = (message = 'Not authenticated') =>
  new AppError(401, message, 'unauthorized')

export const forbidden = (message = 'Not allowed') => new AppError(403, message, 'forbidden')

export const notFound = (message = 'Not found') => new AppError(404, message, 'not_found')

export const conflict = (message: string, details?: unknown) =>
  new AppError(409, message, 'conflict', details)

export const payloadTooLarge = (message: string) => new AppError(413, message, 'payload_too_large')
