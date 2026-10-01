import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const baseURL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:4000'

/**
 * The access token lives here and nowhere else — not localStorage, not
 * sessionStorage. A refresh of the browser loses it, and the httpOnly cookie
 * is what restores the session on boot. That keeps the token out of reach of
 * any script that manages to run on this origin.
 */
let accessToken: string | null = null

export const setAccessToken = (token: string | null): void => {
  accessToken = token
}

export const getAccessToken = (): string | null => accessToken

export const api = axios.create({ baseURL, withCredentials: true })

/**
 * Refresh goes through its own client. Using `api` would run the response
 * interceptor on the refresh call itself, so a failed refresh would try to
 * refresh again.
 */
const refreshClient = axios.create({ baseURL, withCredentials: true })

let onAuthFailure: (() => void) | null = null

export const setAuthFailureHandler = (handler: (() => void) | null): void => {
  onAuthFailure = handler
}

interface SessionResponse {
  accessToken: string
  user: { id: string; email: string; createdAt: string }
}

/**
 * Shared between concurrent callers: ten requests failing with 401 at once
 * cause one refresh, not ten. Cleared when it settles so the next 401 starts
 * a fresh attempt.
 */
let refreshPromise: Promise<SessionResponse> | null = null

export const refreshSession = async (): Promise<SessionResponse> => {
  refreshPromise ??= refreshClient
    .post<SessionResponse>('/auth/refresh')
    .then((res) => {
      setAccessToken(res.data.accessToken)
      return res.data
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

/**
 * The auth endpoints opt out of refresh-and-retry. A failed login already
 * means "those credentials are wrong"; refreshing afterwards adds a pointless
 * request and, worse, replaces the real message with the refresh failure —
 * a mistyped password used to report "No refresh token".
 */
const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout']

const isAuthPath = (url: string | undefined): boolean =>
  Boolean(url && AUTH_PATHS.some((path) => url.startsWith(path)))

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    // `_retried` is the loop guard: a request is retried at most once, so a
    // refresh that succeeds against an endpoint that keeps 401ing cannot spin.
    if (error.response?.status !== 401 || !config || config._retried || isAuthPath(config.url)) {
      return Promise.reject(error)
    }

    config._retried = true

    try {
      const { accessToken: fresh } = await refreshSession()
      config.headers.Authorization = `Bearer ${fresh}`
      return await api(config)
    } catch (refreshError) {
      setAccessToken(null)
      onAuthFailure?.()
      return Promise.reject(refreshError)
    }
  },
)

export const login = async (email: string, password: string): Promise<SessionResponse> => {
  const res = await api.post<SessionResponse>('/auth/login', { email, password })
  setAccessToken(res.data.accessToken)
  return res.data
}

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout')
  } finally {
    // Even if the call fails, the local session is over.
    setAccessToken(null)
  }
}

/** Turns an axios failure into something worth showing a person. */
export const errorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
    if (error.code === 'ERR_NETWORK') return 'Could not reach the API. Is it running?'
    return error.message
  }
  return error instanceof Error ? error.message : 'Something went wrong'
}
