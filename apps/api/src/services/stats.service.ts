import type { Stats } from '@portfolio/shared'
import { prisma } from '../prisma.js'

/**
 * One round trip for the whole dashboard. Nine separate count endpoints would
 * mean nine requests on every page load.
 */
export const getStats = async (): Promise<Stats> => {
  const [
    projects,
    blogs,
    skills,
    experience,
    testimonials,
    services,
    media,
    messages,
    unreadMessages,
    recentMessages,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.blog.count(),
    prisma.skill.count(),
    prisma.experience.count(),
    prisma.testimonial.count(),
    prisma.service.count(),
    prisma.media.count(),
    prisma.message.count(),
    prisma.message.count({ where: { read: false } }),
    prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  return {
    counts: { projects, blogs, skills, experience, testimonials, services, media, messages },
    unreadMessages,
    recentMessages,
  }
}
