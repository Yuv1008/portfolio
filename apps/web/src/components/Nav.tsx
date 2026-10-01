'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

export const Nav = ({ name }: { name: string }) => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const linkClass = (href: string) =>
    `text-sm transition hover:text-[var(--color-fg)] ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'text-[var(--color-fg)] font-medium'
        : 'text-[var(--color-muted)]'
    }`

  return (
    <header className="bg-[var(--color-bg)]/85 sticky top-0 z-40 border-b border-[var(--color-border)] backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          {name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 sm:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => {
            setOpen((v) => !v)
          }}
          className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-sm sm:hidden"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-[var(--color-border)] px-6 py-3 sm:hidden"
        >
          <ul className="space-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => {
                    setOpen(false)
                  }}
                  className={`${linkClass(link.href)} block py-1`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
