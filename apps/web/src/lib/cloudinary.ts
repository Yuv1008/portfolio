'use client'

import type { ImageLoaderProps } from 'next/image'

/**
 * Resizes at the CDN rather than shipping full-size originals. Anything that
 * is not a Cloudinary upload URL passes through untouched, so a stray image
 * from elsewhere still renders.
 */
const cloudinaryLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  const marker = '/image/upload/'
  const index = src.indexOf(marker)
  if (!src.includes('res.cloudinary.com') || index === -1) return src

  const transforms = ['f_auto', 'q_' + String(quality ?? 'auto'), 'c_limit', `w_${String(width)}`]
  return `${src.slice(0, index + marker.length)}${transforms.join(',')}/${src.slice(index + marker.length)}`
}

export default cloudinaryLoader
