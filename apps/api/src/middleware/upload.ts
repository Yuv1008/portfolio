import multer from 'multer'
import { allowedImageTypes, maxUploadBytes } from '@portfolio/shared'
import { AppError } from '../lib/errors.js'

const allowed: readonly string[] = allowedImageTypes

/**
 * Memory storage, never disk: the buffer goes straight to Cloudinary and the
 * database keeps only the URL. A multer LIMIT_FILE_SIZE error is translated to
 * a 413 by the central error handler.
 */
export const uploadSingleImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowed.includes(file.mimetype)) {
      callback(
        new AppError(
          400,
          `${file.mimetype} is not an image this API accepts (${allowed.join(', ')})`,
          'unsupported_media_type',
        ),
      )
      return
    }
    callback(null, true)
  },
}).single('file')
