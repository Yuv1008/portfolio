import { NavLink } from 'react-router-dom'

export interface NavItem {
  to: string
  label: string
}

/** Phase 6 fills in the content pages; the links exist now so the shape is real. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/about', label: 'About' },
  { to: '/skills', label: 'Skills' },
  { to: '/projects', label: 'Projects' },
  { to: '/blogs', label: 'Blog' },
  { to: '/experience', label: 'Experience' },
  { to: '/testimonials', label: 'Testimonials' },
  { to: '/services', label: 'Services' },
  { to: '/media', label: 'Media' },
  { to: '/messages', label: 'Messages' },
]

interface SidebarProps {
  unread: number
  onNavigate?: () => void
}

export const Sidebar = ({ unread, onNavigate }: SidebarProps) => (
  <nav aria-label="Sections" className="flex h-full flex-col gap-1 p-3">
    <div className="px-3 py-4">
      <p className="text-sm font-semibold tracking-tight text-neutral-100">Portfolio CMS</p>
      <p className="text-xs text-neutral-500">Content management</p>
    </div>

    {NAV_ITEMS.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${
            isActive
              ? 'bg-neutral-800 font-medium text-neutral-100'
              : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
          }`
        }
      >
        {item.label}
        {item.to === '/messages' && unread > 0 ? (
          <span className="bg-accent rounded-full px-2 py-0.5 text-xs font-medium text-white">
            {unread}
          </span>
        ) : null}
      </NavLink>
    ))}
  </nav>
)
