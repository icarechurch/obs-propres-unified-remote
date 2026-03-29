import { randomUUID } from 'node:crypto'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  deleteCookie,
  getCookie,
  setResponseStatus,
  setCookie,
} from '@tanstack/react-start/server'
import z from 'zod'

const SESSION_COOKIE_NAME = 'session-token'
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000

type StoredUser = {
  id: string
  email: string
  password: string
}

export type AuthUser = {
  id: string
  email: string
}

const usersById = new Map<string, StoredUser>()
const usersByEmail = new Map<string, StoredUser>()
const sessionTokens = new Map<string, string>()
const resetTokens = new Map<string, { userId: string; expiresAt: number }>()

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const setSessionCookie = (token: string) => {
  setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  })
}

const clearSessionCookie = () => {
  deleteCookie(SESSION_COOKIE_NAME)
}

const createSessionForUser = (userId: string) => {
  const token = randomUUID()
  sessionTokens.set(token, userId)
  setSessionCookie(token)
}

const readCurrentUserFromSession = (): AuthUser | null => {
  const token = getCookie(SESSION_COOKIE_NAME)
  if (!token) {
    return null
  }

  const userId = sessionTokens.get(token)
  if (!userId) {
    return null
  }

  const user = usersById.get(userId)
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
  }
}

export const getSessionTokenFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = getCookie(SESSION_COOKIE_NAME)

    if (!session) {
      return null
    }

    return session
  },
)

const authCredentialsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  redirect: z.string().optional(),
})

export const signUpFn = createServerFn({ method: 'POST' })
  .inputValidator(authCredentialsSchema)
  .handler(async ({ data }) => {
    const { email, password, redirect: redirectUrl } = data
    const normalizedEmail = normalizeEmail(email)

    if (usersByEmail.has(normalizedEmail)) {
      setResponseStatus(409)
      throw {
        message: 'An account with this email already exists',
        status: 409,
      }
    }

    const user: StoredUser = {
      id: randomUUID(),
      email: normalizedEmail,
      password,
    }

    usersById.set(user.id, user)
    usersByEmail.set(user.email, user)
    createSessionForUser(user.id)

    if (redirectUrl) {
      throw redirect({ to: redirectUrl })
    } else {
      throw redirect({ to: '/' })
    }
  })

export const signInFn = createServerFn({ method: 'POST' })
  .inputValidator(authCredentialsSchema)
  .handler(async ({ data }) => {
    const { email, password, redirect: redirectUrl } = data
    const normalizedEmail = normalizeEmail(email)
    const user = usersByEmail.get(normalizedEmail)

    if (!user || user.password !== password) {
      setResponseStatus(401)
      throw {
        message: 'Invalid email or password',
        status: 401,
      }
    }

    createSessionForUser(user.id)

    if (redirectUrl) {
      throw redirect({ to: redirectUrl })
    } else {
      throw redirect({ to: '/' })
    }
  })

export const signOutFn = createServerFn({ method: 'GET' }).handler(async () => {
  const token = getCookie(SESSION_COOKIE_NAME)
  if (token) {
    sessionTokens.delete(token)
  }
  clearAuthCookies()
})

export const authMiddleware = createServerFn({ method: 'GET' }).handler(
  async () => {
    const currentUser = await getCurrentUser()

    return {
      currentUser,
    }
  },
)

const clearAuthCookies = () => {
  clearSessionCookie()
}

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    return readCurrentUserFromSession()
  },
)

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const forgotPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator(forgotPasswordSchema)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email)
    const user = usersByEmail.get(email)

    if (user) {
      const token = randomUUID()
      resetTokens.set(token, {
        userId: user.id,
        expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
      })
      console.info(
        `[auth] Password reset link: /reset-password?userId=${user.id}&secret=${token}`,
      )
    }

    return {
      success: true,
      message: 'Password recovery email sent successfully',
    }
  })

const resetPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  secret: z.string().min(1, 'Secret is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export const resetPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator(resetPasswordSchema)
  .handler(async ({ data }) => {
    const { userId, secret, password, confirmPassword } = data

    if (password !== confirmPassword) {
      setResponseStatus(400)
      throw {
        message: 'Passwords do not match',
        status: 400,
      }
    }

    const tokenRecord = resetTokens.get(secret)
    if (!tokenRecord || tokenRecord.userId !== userId) {
      setResponseStatus(400)
      throw {
        message: 'Invalid or expired recovery link',
        status: 400,
      }
    }

    if (tokenRecord.expiresAt < Date.now()) {
      resetTokens.delete(secret)
      setResponseStatus(400)
      throw {
        message: 'Recovery link has expired',
        status: 400,
      }
    }

    const user = usersById.get(userId)
    if (!user) {
      setResponseStatus(404)
      throw {
        message: 'User account not found',
        status: 404,
      }
    }

    user.password = password
    resetTokens.delete(secret)

    return {
      success: true,
      message: 'Password reset successfully',
    }
  })
