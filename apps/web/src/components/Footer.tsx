import Link from 'next/link'

interface FooterProps {
  name: string
  socials: Record<string, string>
}

export const Footer = ({ name, socials }: FooterProps) => (
  <footer className="mt-24 border-t border-[var(--color-border)]">
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--color-muted)]">
        © {new Date().getFullYear()} {name}
      </p>

      <div className="flex flex-wrap gap-4">
        {Object.entries(socials).map(([label, href]) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm capitalize text-[var(--color-muted)] transition hover:text-[var(--color-fg)]"
          >
            {label}
          </a>
        ))}
        <Link
          href="/contact"
          className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-fg)]"
        >
          Contact
        </Link>
      </div>
    </div>
  </footer>
)
