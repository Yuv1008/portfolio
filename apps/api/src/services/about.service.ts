import type { Prisma } from '@prisma/client'
import type { AboutUpdateInput } from '@portfolio/shared'
import { prisma } from '../prisma.js'

/** There is exactly one About row, pinned to this id. */
export const ABOUT_ID = 'singleton'

export const getAbout = async () => prisma.about.findUnique({ where: { id: ABOUT_ID } })

export const upsertAbout = async (input: AboutUpdateInput) => {
  const data = {
    name: input.name,
    headline: input.headline,
    bio: input.bio,
    avatarUrl: input.avatarUrl ?? null,
    resumeUrl: input.resumeUrl ?? null,
    socials: (input.socials ?? {}) as Prisma.InputJsonValue,
    location: input.location ?? null,
  }

  return prisma.about.upsert({
    where: { id: ABOUT_ID },
    update: data,
    create: { id: ABOUT_ID, ...data },
  })
}
