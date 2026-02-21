import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

export async function generateViewport(): Promise<Viewport> {
  const cookieStore = await cookies()
  const theme = (cookieStore.get('crage-theme')?.value as 'dark' | 'light') ?? 'dark'
  return {
    themeColor: theme === 'light' ? '#ffffff' : '#000000',
    viewportFit: 'cover',
  }
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CRAGE — Design',
  description: 'Portfolio of Craig Betts',
  icons: {
    icon: '/favicon.svg',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const theme = (cookieStore.get('crage-theme')?.value as 'dark' | 'light') ?? 'dark'

  const bg = theme === 'light' ? '#ffffff' : '#000000'
  return (
    <Suspense>
      <html lang="en" style={{ backgroundColor: bg }}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          style={{ backgroundColor: bg }}
        >
          <ThemeProvider initialTheme={theme}>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </Suspense>
  )
}
