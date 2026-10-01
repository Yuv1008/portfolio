import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as client from './api'

export interface AdminUser {
  id: string
  email: string
  createdAt: string
}

export type AuthStatus = 'loading' | 'authed' | 'anon'

interface AuthValue {
  status: AuthStatus
  user: AdminUser | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AdminUser | null>(null)

  // On boot the in-memory token is gone, so the refresh cookie decides whether
  // this is a returning session. Until that answers, status stays 'loading' —
  // rendering the login page first would flash it on every refresh.
  useEffect(() => {
    let cancelled = false

    client
      .refreshSession()
      .then((session) => {
        if (cancelled) return
        setUser(session.user)
        setStatus('authed')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('anon')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // The interceptor cannot navigate, so it tells the provider instead.
  useEffect(() => {
    client.setAuthFailureHandler(() => {
      setUser(null)
      setStatus('anon')
    })
    return () => {
      client.setAuthFailureHandler(null)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await client.login(email, password)
    setUser(session.user)
    setStatus('authed')
  }, [])

  const signOut = useCallback(async () => {
    await client.logout()
    setUser(null)
    setStatus('anon')
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export const useAuth = (): AuthValue => {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
