import { Resend } from 'resend'
import { env } from '../env.js'
import { logger } from '../logger.js'

export interface ContactNotification {
  name: string
  email: string
  subject: string
  body: string
}

export const isEmailConfigured = (): boolean => Boolean(env.RESEND_API_KEY && env.OWNER_EMAIL)

let client: Resend | null = null

const getClient = (apiKey: string): Resend => {
  client ??= new Resend(apiKey)
  return client
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Returns whether the mail went out rather than throwing. The Message row is
 * already saved by this point, so a Resend outage must not fail the request —
 * the enquiry is not lost, it just arrives by way of the admin panel.
 */
export const sendContactNotification = async (input: ContactNotification): Promise<boolean> => {
  const apiKey = env.RESEND_API_KEY
  const to = env.OWNER_EMAIL

  if (!apiKey || !to) {
    logger.warn(
      { subject: input.subject },
      'RESEND_API_KEY or OWNER_EMAIL is unset; the message was saved but no email was sent',
    )
    return false
  }

  const text = [
    `From: ${input.name} <${input.email}>`,
    `Subject: ${input.subject}`,
    '',
    input.body,
  ].join('\n')

  const html = [
    `<p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>`,
    `<p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>`,
    `<hr />`,
    `<p style="white-space:pre-wrap">${escapeHtml(input.body)}</p>`,
  ].join('\n')

  try {
    const { error } = await getClient(apiKey).emails.send({
      from: env.RESEND_FROM,
      to: [to],
      // Replying in a mail client then goes to the sender, not to Resend.
      replyTo: input.email,
      subject: `Portfolio enquiry: ${input.subject}`,
      text,
      html,
    })

    if (error) {
      logger.error({ err: error }, 'Resend refused the contact notification')
      return false
    }
    return true
  } catch (error) {
    logger.error({ err: error }, 'Could not reach Resend to send the contact notification')
    return false
  }
}
