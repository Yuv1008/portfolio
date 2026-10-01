import { z, type ZodTypeAny } from 'zod'
import {
  aboutSchema,
  blogSchema,
  experienceSchema,
  paginatedSchema,
  projectSchema,
  serviceSchema,
  skillSchema,
  testimonialSchema,
} from '@portfolio/shared'

const API_URL = process.env['API_URL'] ?? 'http://localhost:4000'

/** Cache tags, matched by the API's revalidation hook and /api/revalidate. */
export const TAGS = {
  about: 'about',
  skills: 'skills',
  projects: 'projects',
  blogs: 'blogs',
  experience: 'experience',
  testimonials: 'testimonials',
  services: 'services',
  media: 'media',
} as const

export type Tag = (typeof TAGS)[keyof typeof TAGS]

export const ALL_TAGS: readonly string[] = Object.values(TAGS)

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`GET ${path} failed with ${String(status)}`)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  tag: Tag
  /** Seconds. A backstop so content cannot go stale forever if a revalidation call is lost. */
  revalidate?: number
}

/**
 * One typed reader for the whole site.
 *
 * `cache: 'force-cache'` is not optional here: Next 16 does not cache fetch by
 * default, and an uncached request is never tagged — on-demand revalidation
 * would appear to work while actually just re-fetching every time.
 *
 * Responses are parsed with the same zod schema the API validates against, so
 * a drifted shape fails loudly in the server log instead of rendering blanks.
 */
const request = async <S extends ZodTypeAny>(
  path: string,
  schema: S,
  { tag, revalidate = 3600 }: RequestOptions,
): Promise<z.infer<S>> => {
  const res = await fetch(`${API_URL}${path}`, {
    cache: 'force-cache',
    next: { tags: [tag], revalidate },
  })

  if (!res.ok) throw new ApiError(res.status, path)

  const parsed = schema.safeParse(await res.json())
  if (!parsed.success) {
    console.error(`Response from ${path} did not match its schema`, parsed.error.issues)
    throw new Error(`Unexpected response shape from ${path}`)
  }
  return parsed.data as z.infer<S>
}

/** Returns null on 404 instead of throwing, for optional singletons and slugs. */
const optional = async <S extends ZodTypeAny>(
  path: string,
  schema: S,
  options: RequestOptions,
): Promise<z.infer<S> | null> => {
  try {
    return await request(path, schema, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export const getAbout = () => optional('/about', aboutSchema, { tag: TAGS.about })

export const getSkills = () => request('/skills', z.array(skillSchema), { tag: TAGS.skills })

export const getProjects = () =>
  request('/projects', z.array(projectSchema), { tag: TAGS.projects })

export const getFeaturedProjects = async () => {
  const projects = await getProjects()
  return projects.filter((project) => project.featured)
}

export const getProject = (slug: string) =>
  optional(`/projects/${encodeURIComponent(slug)}`, projectSchema, { tag: TAGS.projects })

export const getPosts = (page = 1, limit = 20) =>
  request(`/blogs?page=${String(page)}&limit=${String(limit)}`, paginatedSchema(blogSchema), {
    tag: TAGS.blogs,
  })

export const getPost = (slug: string) =>
  optional(`/blogs/${encodeURIComponent(slug)}`, blogSchema, { tag: TAGS.blogs })

export const getExperience = () =>
  request('/experience', z.array(experienceSchema), { tag: TAGS.experience })

export const getTestimonials = () =>
  request('/testimonials', z.array(testimonialSchema), { tag: TAGS.testimonials })

export const getServices = () =>
  request('/services', z.array(serviceSchema), { tag: TAGS.services })
