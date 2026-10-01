import type { Metadata } from 'next'
import { getAbout } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch.',
}

export default async function ContactPage() {
  const about = await getAbout()

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">Get in touch</h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Tell me about your project, or just say hello.
      </p>

      {/* Phase 8 replaces this with the live, validated form. */}
      <p className="mt-10 rounded-xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center text-sm text-[var(--color-muted)]">
        The contact form arrives in phase 8. The API endpoint behind it is already live.
      </p>

      {about?.socials && Object.keys(about.socials).length > 0 ? (
        <div className="mt-8">
          <h2 className="text-sm font-medium">Elsewhere</h2>
          <ul className="mt-3 flex flex-wrap gap-4">
            {Object.entries(about.socials).map(([label, href]) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm capitalize text-[var(--color-accent)] hover:underline"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
