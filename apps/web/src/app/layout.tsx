import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { getAbout } from '@/lib/api'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { themeScript } from '@/components/ThemeToggle'
import { JsonLd, personSchema } from '@/components/JsonLd'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' })

const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3010'

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout()
  const name = about?.name ?? 'Portfolio'
  const description = about?.headline ?? 'Full-stack developer portfolio.'

  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${name} · ${description}`, template: `%s · ${name}` },
    description,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', siteName: name, title: name, description, url: siteUrl },
    twitter: { card: 'summary_large_image', title: name, description },
    robots: { index: true, follow: true },
  }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const about = await getAbout()
  const name = about?.name ?? 'Portfolio'
  const socials = about?.socials ?? {}

  return (
    // suppressHydrationWarning: the head script sets .dark before React runs,
    // so the server and client markup differ on that class by design.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--color-accent)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--color-on-accent)]"
        >
          Skip to content
        </a>

        <Nav name={name} />

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
          {children}
        </main>

        <Footer name={name} socials={socials} />

        {about ? (
          <JsonLd
            data={personSchema({
              name: about.name,
              headline: about.headline,
              url: siteUrl,
              avatarUrl: about.avatarUrl,
              socials,
              location: about.location,
            })}
          />
        ) : null}
      </body>
    </html>
  )
}
