import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { FullPageSpinner } from './Skeleton'

/**
 * Three states, not two. While the boot refresh is in flight the answer is
 * genuinely unknown, and redirecting then would flash the login page on every
 * browser refresh of an authenticated session.
 */
export const ProtectedRoute = () => {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner label="Restoring your session" />

  if (status === 'anon') {
    // Remember where they were headed, so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
