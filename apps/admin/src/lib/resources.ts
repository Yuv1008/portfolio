import type { ZodTypeAny } from 'zod'
import {
  blogCreateSchema,
  experienceCreateSchema,
  field,
  projectCreateSchema,
  serviceCreateSchema,
  skillCreateSchema,
  testimonialCreateSchema,
  type FieldDescriptor,
} from '@portfolio/shared'
import type { Column } from '../components/ResourceTable'

export interface ResourceDefinition<T extends { id: string } = { id: string }> {
  key: string
  label: string
  singular: string
  endpoint: string
  schema: ZodTypeAny
  fields: readonly FieldDescriptor[]
  columns: Column<T>[]
  defaults: Record<string, unknown>
  reorderable?: boolean
  paginated?: boolean
  publishedKey?: 'published'
  searchPlaceholder?: string
}

const truncate = (value: string, max = 70): string =>
  value.length > max ? `${value.slice(0, max)}…` : value

const text = (value: unknown): string => (typeof value === 'string' ? value : '')

const dateLabel = (value: unknown): string =>
  value
    ? new Date(String(value)).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : '—'

/* eslint-disable @typescript-eslint/no-explicit-any -- see note below */
/*
 * Rows arrive as the API returned them and are rendered through columns the
 * definition owns. Typing each definition against its own row type would mean
 * a discriminated union here and a cast at every use site; the column
 * renderers below are the only place row shape is touched, and each one reads
 * exactly the fields its own resource has.
 */
type Row = any
/* eslint-enable @typescript-eslint/no-explicit-any */

export const resources: Record<string, ResourceDefinition> = {
  skills: {
    key: 'skills',
    label: 'Skills',
    singular: 'skill',
    endpoint: '/admin/skills',
    schema: skillCreateSchema,
    reorderable: true,
    searchPlaceholder: 'Search by name or category',
    fields: [
      field({ name: 'name', label: 'Name', type: 'text', placeholder: 'TypeScript' }),
      field({ name: 'category', label: 'Category', type: 'text', placeholder: 'Languages' }),
      field({ name: 'level', label: 'Level', type: 'number', min: 1, max: 5, help: '1 to 5' }),
      field({
        name: 'icon',
        label: 'Icon',
        type: 'text',
        help: 'A simple-icons slug, e.g. typescript',
      }),
      field({ name: 'order', label: 'Order', type: 'number', min: 0 }),
    ],
    columns: [
      { key: 'name', header: 'Name', render: (r: Row) => text(r.name) },
      {
        key: 'category',
        header: 'Category',
        render: (r: Row) => text(r.category),
        secondary: true,
      },
      {
        key: 'level',
        header: 'Level',
        render: (r: Row) => `${String(r.level)}/5`,
        secondary: true,
      },
    ],
    defaults: { name: '', category: '', level: 3, icon: '', order: 0 },
  },

  projects: {
    key: 'projects',
    label: 'Projects',
    singular: 'project',
    endpoint: '/admin/projects',
    schema: projectCreateSchema,
    reorderable: true,
    publishedKey: 'published',
    searchPlaceholder: 'Search by title or summary',
    fields: [
      field({ name: 'title', label: 'Title', type: 'text' }),
      field({
        name: 'slug',
        label: 'Slug',
        type: 'slug',
        derivesFrom: 'title',
        help: 'Appears in the URL',
      }),
      field({
        name: 'summary',
        label: 'Summary',
        type: 'textarea',
        help: 'One or two lines for the card',
      }),
      field({ name: 'content', label: 'Content', type: 'markdown' }),
      field({ name: 'coverImageUrl', label: 'Cover image', type: 'image' }),
      field({
        name: 'techStack',
        label: 'Tech stack',
        type: 'tags',
        placeholder: 'Type and press Enter',
      }),
      field({ name: 'githubUrl', label: 'Repository URL', type: 'url' }),
      field({ name: 'liveUrl', label: 'Live URL', type: 'url' }),
      field({
        name: 'featured',
        label: 'Featured',
        type: 'boolean',
        placeholder: 'Show on the home page',
      }),
      field({ name: 'order', label: 'Order', type: 'number', min: 0 }),
      field({
        name: 'published',
        label: 'Published',
        type: 'boolean',
        placeholder: 'Visible on the site',
      }),
    ],
    columns: [
      { key: 'title', header: 'Title', render: (r: Row) => text(r.title) },
      { key: 'slug', header: 'Slug', render: (r: Row) => text(r.slug), secondary: true },
      {
        key: 'featured',
        header: 'Featured',
        render: (r: Row) => (r.featured ? 'Yes' : '—'),
        secondary: true,
      },
    ],
    defaults: {
      title: '',
      slug: '',
      summary: '',
      content: '',
      coverImageUrl: null,
      techStack: [],
      githubUrl: null,
      liveUrl: null,
      featured: false,
      order: 0,
      published: false,
    },
  },

  blogs: {
    key: 'blogs',
    label: 'Blog',
    singular: 'post',
    endpoint: '/admin/blogs',
    schema: blogCreateSchema,
    paginated: true,
    publishedKey: 'published',
    searchPlaceholder: 'Search by title or excerpt',
    fields: [
      field({ name: 'title', label: 'Title', type: 'text' }),
      field({ name: 'slug', label: 'Slug', type: 'slug', derivesFrom: 'title' }),
      field({ name: 'excerpt', label: 'Excerpt', type: 'textarea' }),
      field({ name: 'content', label: 'Content', type: 'markdown' }),
      field({ name: 'coverImageUrl', label: 'Cover image', type: 'image' }),
      field({ name: 'tags', label: 'Tags', type: 'tags', placeholder: 'Type and press Enter' }),
      field({ name: 'publishedAt', label: 'Published on', type: 'date' }),
      field({
        name: 'published',
        label: 'Published',
        type: 'boolean',
        placeholder: 'Visible on the site',
      }),
    ],
    columns: [
      { key: 'title', header: 'Title', render: (r: Row) => text(r.title) },
      {
        key: 'publishedAt',
        header: 'Date',
        render: (r: Row) => dateLabel(r.publishedAt),
        secondary: true,
      },
      {
        key: 'tags',
        header: 'Tags',
        render: (r: Row) => (Array.isArray(r.tags) && r.tags.length ? r.tags.join(', ') : '—'),
        secondary: true,
      },
    ],
    defaults: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImageUrl: null,
      tags: [],
      publishedAt: null,
      published: false,
    },
  },

  experience: {
    key: 'experience',
    label: 'Experience',
    singular: 'role',
    endpoint: '/admin/experience',
    schema: experienceCreateSchema,
    reorderable: true,
    searchPlaceholder: 'Search by company or role',
    fields: [
      field({ name: 'company', label: 'Company', type: 'text' }),
      field({ name: 'role', label: 'Role', type: 'text' }),
      field({ name: 'location', label: 'Location', type: 'text' }),
      field({ name: 'startDate', label: 'Start date', type: 'date' }),
      field({
        name: 'endDate',
        label: 'End date',
        type: 'date',
        help: 'Leave empty if this is current',
      }),
      field({ name: 'current', label: 'Current role', type: 'boolean', placeholder: 'Still here' }),
      field({ name: 'description', label: 'Description', type: 'markdown' }),
      field({ name: 'order', label: 'Order', type: 'number', min: 0 }),
    ],
    columns: [
      { key: 'role', header: 'Role', render: (r: Row) => text(r.role) },
      { key: 'company', header: 'Company', render: (r: Row) => text(r.company) },
      {
        key: 'period',
        header: 'Period',
        render: (r: Row) =>
          `${dateLabel(r.startDate)} – ${r.current ? 'now' : dateLabel(r.endDate)}`,
        secondary: true,
      },
    ],
    defaults: {
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: null,
      current: false,
      description: '',
      order: 0,
    },
  },

  testimonials: {
    key: 'testimonials',
    label: 'Testimonials',
    singular: 'testimonial',
    endpoint: '/admin/testimonials',
    schema: testimonialCreateSchema,
    reorderable: true,
    publishedKey: 'published',
    searchPlaceholder: 'Search by name or company',
    fields: [
      field({ name: 'name', label: 'Name', type: 'text' }),
      field({ name: 'role', label: 'Role', type: 'text' }),
      field({ name: 'company', label: 'Company', type: 'text' }),
      field({ name: 'quote', label: 'Quote', type: 'textarea' }),
      field({ name: 'avatarUrl', label: 'Avatar', type: 'image' }),
      field({ name: 'order', label: 'Order', type: 'number', min: 0 }),
      field({
        name: 'published',
        label: 'Published',
        type: 'boolean',
        placeholder: 'Visible on the site',
      }),
    ],
    columns: [
      { key: 'name', header: 'Name', render: (r: Row) => text(r.name) },
      { key: 'company', header: 'Company', render: (r: Row) => text(r.company), secondary: true },
      {
        key: 'quote',
        header: 'Quote',
        render: (r: Row) => truncate(text(r.quote)),
        secondary: true,
      },
    ],
    defaults: {
      name: '',
      role: '',
      company: '',
      quote: '',
      avatarUrl: null,
      order: 0,
      published: true,
    },
  },

  services: {
    key: 'services',
    label: 'Services',
    singular: 'service',
    endpoint: '/admin/services',
    schema: serviceCreateSchema,
    reorderable: true,
    searchPlaceholder: 'Search by title',
    fields: [
      field({ name: 'title', label: 'Title', type: 'text' }),
      field({ name: 'description', label: 'Description', type: 'textarea' }),
      field({ name: 'icon', label: 'Icon', type: 'text', help: 'A lucide icon name, e.g. layers' }),
      field({ name: 'order', label: 'Order', type: 'number', min: 0 }),
    ],
    columns: [
      { key: 'title', header: 'Title', render: (r: Row) => text(r.title) },
      {
        key: 'description',
        header: 'Description',
        render: (r: Row) => truncate(text(r.description)),
        secondary: true,
      },
    ],
    defaults: { title: '', description: '', icon: '', order: 0 },
  },
}
