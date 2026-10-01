import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { getAbout } from '@/lib/api'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3010'

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout()
  const name = about?.name ?? 'Portfolio'

  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${name} · ${about?.headline ?? 'Developer'}`, template: `%s · ${name}` },
    description: about?.headline ?? 'Full-stack developer portfolio.',
  }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // The nav and footer need the About record, so the layout fetches it once.
  const about = await getAbout()
  const name = about?.name ?? 'Portfolio'
  const socials = about?.socials ?? {}

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--color-accent)] focus:px-3 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <Nav name={name} />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
          {children}
        </main>
        <Footer name={name} socials={socials} />
      </body>
    </html>
  )
}
