import { Router } from 'express'
import {
  blogCreateSchema,
  blogUpdateSchema,
  experienceCreateSchema,
  experienceUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  skillCreateSchema,
  skillUpdateSchema,
  testimonialCreateSchema,
  testimonialUpdateSchema,
} from '@portfolio/shared'
import { createCrudRouter, type CrudConfig } from '../lib/crudFactory.js'

/**
 * Every content type, in one place. Adding a seventh means one schema file in
 * packages/shared and one entry here — no new controller, service or route.
 *
 * Skill, Experience and Service have no `published` column in the spec's model
 * list, so they carry no publicFilter and their public lists return every row.
 */
export const resourceConfigs: CrudConfig[] = [
  {
    model: 'skill',
    resource: 'skills',
    createSchema: skillCreateSchema,
    updateSchema: skillUpdateSchema,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    searchFields: ['name', 'category'],
    reorderable: true,
    tag: 'skills',
  },
  {
    model: 'project',
    resource: 'projects',
    createSchema: projectCreateSchema,
    updateSchema: projectUpdateSchema,
    publicFilter: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    adminOrderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
    searchFields: ['title', 'summary'],
    hasSlug: true,
    reorderable: true,
    tag: 'projects',
  },
  {
    model: 'blog',
    resource: 'blogs',
    createSchema: blogCreateSchema,
    updateSchema: blogUpdateSchema,
    publicFilter: { published: true },
    // Blog has no `order` column, so posts sort newest-first instead.
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    adminOrderBy: [{ updatedAt: 'desc' }],
    searchFields: ['title', 'excerpt'],
    paginate: true,
    hasSlug: true,
    tag: 'blogs',
  },
  {
    model: 'experience',
    resource: 'experience',
    createSchema: experienceCreateSchema,
    updateSchema: experienceUpdateSchema,
    orderBy: [{ order: 'asc' }, { startDate: 'desc' }],
    searchFields: ['company', 'role'],
    reorderable: true,
    tag: 'experience',
  },
  {
    model: 'testimonial',
    resource: 'testimonials',
    createSchema: testimonialCreateSchema,
    updateSchema: testimonialUpdateSchema,
    publicFilter: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    searchFields: ['name', 'company'],
    reorderable: true,
    tag: 'testimonials',
  },
  {
    model: 'service',
    resource: 'services',
    createSchema: serviceCreateSchema,
    updateSchema: serviceUpdateSchema,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    searchFields: ['title', 'description'],
    reorderable: true,
    tag: 'services',
  },
]

export const contentRouter: Router = Router()

for (const config of resourceConfigs) {
  const { publicRouter, adminRouter } = createCrudRouter(config)
  contentRouter.use('/', publicRouter)
  contentRouter.use('/admin', adminRouter)
}
