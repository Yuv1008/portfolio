import type { MetadataRoute } from 'next'
import { getAllPosts, getProjects } from '@/lib/api'

const BASE = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3010'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), getAllPosts()])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`, changeFrequency: 'yearly', priority: 0.5 },
  ]

  // Only published rows reach these readers, so drafts never enter the sitemap.
  return [
    ...staticRoutes,
    ...projects.map((project) => ({
      url: `${BASE}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
