import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './lib/auth-context'
import { ToastProvider } from './components/Toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { FullPageSpinner } from './components/Skeleton'
import { EmptyState } from './components/EmptyState'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

/** Stands in for the pages phase 6 builds, so every nav link resolves. */
const ComingSoon = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
    <EmptyState
      title={`${title} arrives in phase 6`}
      description="The API behind it is already live."
    />
  </div>
)

const PLACEHOLDER_ROUTES = [
  ['about', 'About'],
  ['skills', 'Skills'],
  ['projects', 'Projects'],
  ['blogs', 'Blog'],
  ['experience', 'Experience'],
  ['testimonials', 'Testimonials'],
  ['services', 'Services'],
  ['media', 'Media'],
  ['messages', 'Messages'],
] as const

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<FullPageSpinner />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    {PLACEHOLDER_ROUTES.map(([path, label]) => (
                      <Route key={path} path={path} element={<ComingSoon title={label} />} />
                    ))}
                    <Route
                      path="*"
                      element={
                        <EmptyState
                          title="Page not found"
                          description="That route does not exist."
                        />
                      }
                    />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
