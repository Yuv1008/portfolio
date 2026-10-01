import type { Express } from 'express'
import type { Response } from 'supertest'
import { createApp } from '../app.js'
import { prisma } from '../prisma.js'
import { hashPassword } from '../lib/password.js'
import { REFRESH_COOKIE } from '../controllers/auth.controller.js'

export const testAdmin = {
  email: 'admin@test.local',
  password: 'test-password-123',
}

export const app: Express = createApp()

/** Every table, child rows first. CASCADE covers the rest. */
export const resetDb = async (): Promise<void> => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "RefreshToken", "User", "About", "Skill", "Project", "Blog",
     "Experience", "Testimonial", "Service", "Message", "Media" RESTART IDENTITY CASCADE`,
  )
}

export const createAdmin = async (email = testAdmin.email, password = testAdmin.password) =>
  prisma.user.create({
    data: { email, passwordHash: await hashPassword(password) },
  })

/** Pulls the refresh cookie's value out of a response, or null if none was set. */
export const refreshCookieFrom = (res: Response): string | null => {
  const header = res.headers['set-cookie']
  const cookies = Array.isArray(header) ? header : header ? [header] : []
  for (const cookie of cookies) {
    const match = new RegExp(`^${REFRESH_COOKIE}=([^;]*)`).exec(cookie)
    if (match?.[1]) return decodeURIComponent(match[1])
  }
  return null
}

/** The raw Set-Cookie string, for asserting on its attributes. */
export const refreshCookieHeader = (res: Response): string | undefined => {
  const header = res.headers['set-cookie']
  const cookies = Array.isArray(header) ? header : header ? [header] : []
  return cookies.find((c) => c.startsWith(`${REFRESH_COOKIE}=`))
}

export const disconnect = async (): Promise<void> => {
  await prisma.$disconnect()
}
