'use server'

export async function validatePassword(password: string): Promise<boolean> {
  const trimmed = password.trim()
  const expected = process.env.SITE_PASSWORD
  if (!expected) return false
  return trimmed === expected.trim()
}
