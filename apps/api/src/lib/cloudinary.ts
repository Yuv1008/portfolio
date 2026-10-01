import { v2 as cloudinary } from 'cloudinary'
import { env } from '../env.js'
import { AppError } from './errors.js'

export interface UploadedImage {
  url: string
  publicId: string
  width: number | null
  height: number | null
  bytes: number
  format: string
}

let configured = false

/**
 * Configured on first use rather than at boot, so phases without media keys
 * still start. The error names the missing variables instead of failing deep
 * inside the SDK with "Must supply api_key".
 */
const ensureConfigured = (): void => {
  if (configured) return

  const missing = (
    [
      ['CLOUDINARY_CLOUD_NAME', env.CLOUDINARY_CLOUD_NAME],
      ['CLOUDINARY_API_KEY', env.CLOUDINARY_API_KEY],
      ['CLOUDINARY_API_SECRET', env.CLOUDINARY_API_SECRET],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new AppError(
      503,
      `Image uploads are not configured. Set ${missing.join(', ')} in apps/api/.env.`,
      'media_not_configured',
    )
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  configured = true
}

export const isCloudinaryConfigured = (): boolean =>
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)

export const uploadImage = (buffer: Buffer, filename: string): Promise<UploadedImage> => {
  ensureConfigured()

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'portfolio',
        resource_type: 'image',
        // Keeps a readable name in the Cloudinary dashboard without risking a
        // collision. A buffer carries no name, so the original is passed through.
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(
            new AppError(502, `Cloudinary rejected the upload: ${error.message}`, 'upload_failed'),
          )
          return
        }
        if (!result) {
          reject(new AppError(502, 'Cloudinary returned no result', 'upload_failed'))
          return
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width ?? null,
          height: result.height ?? null,
          bytes: result.bytes,
          format: result.format,
        })
      },
    )

    stream.on('error', (error: Error) => {
      reject(new AppError(502, `Upload stream failed: ${error.message}`, 'upload_failed'))
    })

    stream.end(buffer)
  })
}

export const destroyImage = async (publicId: string): Promise<void> => {
  ensureConfigured()
  const result: unknown = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })

  const outcome =
    typeof result === 'object' && result !== null && 'result' in result
      ? String((result as { result: unknown }).result)
      : 'unknown'

  // "not found" is fine: the asset is already gone, which is what we wanted.
  if (outcome !== 'ok' && outcome !== 'not found') {
    throw new AppError(502, `Cloudinary could not delete the file (${outcome})`, 'delete_failed')
  }
}
