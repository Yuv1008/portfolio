import type { Media } from '@prisma/client'
import type { Paginated } from '@portfolio/shared'
import { prisma } from '../prisma.js'
import { notFound } from '../lib/errors.js'
import { destroyImage, uploadImage } from '../lib/cloudinary.js'
import { pageArgs, paginated } from '../lib/pagination.js'

export const createFromUpload = async (file: Express.Multer.File): Promise<Media> => {
  const uploaded = await uploadImage(file.buffer, file.originalname)

  return prisma.media.create({
    data: {
      url: uploaded.url,
      publicId: uploaded.publicId,
      filename: file.originalname,
      mimeType: file.mimetype,
      // Cloudinary's byte count is the stored size, which may differ from the upload.
      size: uploaded.bytes,
      width: uploaded.width,
      height: uploaded.height,
    },
  })
}

export const listMedia = async (page: number, limit: number): Promise<Paginated<Media>> => {
  const [items, total] = await Promise.all([
    prisma.media.findMany({ orderBy: { createdAt: 'desc' }, ...pageArgs(page, limit) }),
    prisma.media.count(),
  ])
  return paginated(items, total, page, limit)
}

/**
 * Cloudinary first, then the row. Doing it the other way round would leave an
 * orphaned file nothing points at if the remote delete failed.
 */
export const deleteMedia = async (id: string): Promise<void> => {
  const media = await prisma.media.findUnique({ where: { id } })
  if (!media) throw notFound('No such media')

  await destroyImage(media.publicId)
  await prisma.media.delete({ where: { id } })
}
