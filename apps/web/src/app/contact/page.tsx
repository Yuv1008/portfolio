import type { Metadata } from 'next'
import { getAbout } from '@/lib/api'
import { ContactForm } from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch about a project, a role, or anything else.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const about = await getAbout()

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">Get in touch</h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Tell me about your project, or just say hello.
      </p>

      <div className="mt-10">
        <ContactForm />
      </div>

      {about?.socials && Object.keys(about.socials).length > 0 ? (
        <div className="mt-12 border-t border-[var(--color-border)] pt-6">
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
