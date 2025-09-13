import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/auth-provider'
import Navbar from '@/components/navbar'
import { AssignmentProvider } from '@/contexts/AssignmentContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Antocci Physics',
  description: 'Online Physics Classroom',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body 
        className={`${inter.variable} font-sans bg-gradient-to-br from-background via-secondary/20 to-muted/30 min-h-screen antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <AssignmentProvider>
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
              {children}
            </main>
          </AssignmentProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
