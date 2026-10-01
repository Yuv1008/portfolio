import { rateLimit, MemoryStore } from 'express-rate-limit'

const minutes = (n: number) => n * 60 * 1000

// Held so the test suite can clear counters between cases.
const loginStore = new MemoryStore()
const contactStore = new MemoryStore()

/** 5 attempts per 15 minutes per IP, per the spec. */
export const loginRateLimit = rateLimit({
  windowMs: minutes(15),
  limit: 5,
  store: loginStore,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Every attempt counts, successful or not, as the spec reads.
  message: { error: 'Too many login attempts. Try again in 15 minutes.', code: 'rate_limited' },
})

/** 3 submissions per hour per IP. */
export const contactRateLimit = rateLimit({
  windowMs: minutes(60),
  limit: 3,
  store: contactStore,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages. Try again later.', code: 'rate_limited' },
})

export const resetRateLimits = (): void => {
  loginStore.resetAll()
  contactStore.resetAll()
}
