import type { Message } from '@prisma/client'
import type { ContactInput, Paginated } from '@portfolio/shared'
import { prisma } from '../prisma.js'
import { logger } from '../logger.js'
import { sendContactNotification } from '../lib/email.js'
import { pageArgs, paginated, searchWhere } from '../lib/pagination.js'

const SEARCH_FIELDS = ['name', 'email', 'subject', 'body'] as const

export interface ContactResult {
  message: Message
  emailed: boolean
}

/**
 * Saves first, mails second. If Resend is down the enquiry still exists in the
 * admin panel, which matters more than the notification.
 */
export const submitContact = async (input: ContactInput): Promise<ContactResult> => {
  const message = await prisma.message.create({
    data: {
      name: input.name,
      email: input.email,
      subject: input.subject,
      body: input.body,
    },
  })

  const emailed = await sendContactNotification({
    name: input.name,
    email: input.email,
    subject: input.subject,
    body: input.body,
  })

  if (!emailed) {
    logger.warn({ messageId: message.id }, 'Contact message saved but not emailed')
  }

  return { message, emailed }
}

export const listMessages = async (
  page: number,
  limit: number,
  q?: string,
): Promise<Paginated<Message>> => {
  const where = searchWhere(q, SEARCH_FIELDS) ?? {}
  const [items, total] = await Promise.all([
    prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, ...pageArgs(page, limit) }),
    prisma.message.count({ where }),
  ])
  return paginated(items, total, page, limit)
}

export const setRead = async (id: string, read: boolean): Promise<Message> =>
  prisma.message.update({ where: { id }, data: { read } })

export const deleteMessage = async (id: string): Promise<void> => {
  await prisma.message.delete({ where: { id } })
}

export const unreadCount = async (): Promise<number> =>
  prisma.message.count({ where: { read: false } })
