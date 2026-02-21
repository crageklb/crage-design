'use server'

export async function validatePassword(password: string): Promise<boolean> {
  return password === process.env.SITE_PASSWORD
}
