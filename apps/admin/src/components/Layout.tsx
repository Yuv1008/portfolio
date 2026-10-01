import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { useToast } from './Toast'
import { Sidebar } from './Sidebar'

const useUnreadCount = () =>
  useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: async () => {
      const res = await api.get<{ unread: number }>('/admin/messages/unread-count')
      return res.data.unread
    },
    // The badge should not be stale for long, but it is not worth a poll.
    staleTime: 60_000,
  })

export const Layout = () => {
  const { user, signOut } = useAuth()
  const { notify } = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: unread = 0 } = useUnreadCount()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      notify('Signed out locally, but the server did not confirm', 'error')
    }
  }

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      {/* Keyboard users should not have to tab the whole nav to reach content */}
      <a
        href="#main"
        className="focus:bg-accent sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Permanent rail from md up */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-neutral-800 md:block">
          <Sidebar unread={unread} />
        </aside>

        {/* Drawer below md */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => {
                setDrawerOpen(false)
              }}
              className="absolute inset-0 bg-black/60"
            />
            <aside className="absolute left-0 top-0 h-full w-64 border-r border-neutral-800 bg-neutral-950">
              <Sidebar
                unread={unread}
                onNavigate={() => {
                  setDrawerOpen(false)
                }}
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-800 bg-neutral-950/90 px-4 py-3 backdrop-blur">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(true)
              }}
              aria-label="Open navigation"
              className="rounded-md border border-neutral-800 px-2.5 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-900 md:hidden"
            >
              Menu
            </button>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm text-neutral-400 sm:inline">{user?.email}</span>
              <button
                type="button"
                onClick={() => {
                  void handleSignOut()
                }}
                className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-900 hover:text-neutral-100"
              >
                Log out
              </button>
            </div>
          </header>

          <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
