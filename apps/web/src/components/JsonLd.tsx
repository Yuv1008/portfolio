/**
 * Structured data. Emitted as a script tag rather than through metadata so the
 * shape stays explicit and validates against schema.org as written.
 */
export const JsonLd = ({ data }: { data: Record<string, unknown> }) => (
  <script
    type="application/ld+json"
    // The payload is built from our own data, never from user HTML.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
  />
)

interface PersonInput {
  name: string
  headline: string
  url: string
  avatarUrl?: string | null
  socials: Record<string, string>
  location?: string | null
}

export const personSchema = ({
  name,
  headline,
  url,
  avatarUrl,
  socials,
  location,
}: PersonInput): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name,
  description: headline,
  jobTitle: headline,
  url,
  ...(avatarUrl ? { image: avatarUrl } : {}),
  ...(location ? { address: { '@type': 'PostalAddress', addressLocality: location } } : {}),
  sameAs: Object.values(socials),
})

interface PostInput {
  title: string
  excerpt: string
  url: string
  authorName: string
  publishedAt?: Date | string | null
  updatedAt: Date | string
  coverImageUrl?: string | null
  tags: string[]
}

export const blogPostingSchema = ({
  title,
  excerpt,
  url,
  authorName,
  publishedAt,
  updatedAt,
  coverImageUrl,
  tags,
}: PostInput): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description: excerpt,
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  author: { '@type': 'Person', name: authorName },
  ...(publishedAt ? { datePublished: new Date(publishedAt).toISOString() } : {}),
  dateModified: new Date(updatedAt).toISOString(),
  ...(coverImageUrl ? { image: coverImageUrl } : {}),
  keywords: tags.join(', '),
})

export const breadcrumbSchema = (
  crumbs: { name: string; url: string }[],
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url,
  })),
})
