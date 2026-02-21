'use server'

import { cookies } from 'next/headers'

const AUTH_COOKIE = 'crage-auth'

export async function validatePassword(password: string): Promise<boolean> {
  const trimmed = password.trim()
  const expected = process.env.SITE_PASSWORD
  if (!expected) return false
  const valid = trimmed === expected.trim()
  if (valid) {
    const store = await cookies()
    store.set(AUTH_COOKIE, '1', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  }
  return valid
}

export async function clearAuthCookie() {
  const store = await cookies()
  store.delete(AUTH_COOKIE)
}

export async function getAuthStatus(): Promise<boolean> {
  const store = await cookies()
  return !!store.get(AUTH_COOKIE)?.value
}
