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
const About = lazy(() => import('./pages/About'))
const Skills = lazy(() => import('./pages/Skills'))
const Projects = lazy(() => import('./pages/Projects'))
const Blogs = lazy(() => import('./pages/Blogs'))
const Experience = lazy(() => import('./pages/Experience'))
const Testimonials = lazy(() => import('./pages/Testimonials'))
const Services = lazy(() => import('./pages/Services'))
const Media = lazy(() => import('./pages/Media'))
const Messages = lazy(() => import('./pages/Messages'))

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
                    <Route path="about" element={<About />} />
                    <Route path="skills" element={<Skills />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="blogs" element={<Blogs />} />
                    <Route path="experience" element={<Experience />} />
                    <Route path="testimonials" element={<Testimonials />} />
                    <Route path="services" element={<Services />} />
                    <Route path="media" element={<Media />} />
                    <Route path="messages" element={<Messages />} />
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
