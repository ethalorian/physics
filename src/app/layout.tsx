import './globals.css'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/auth-provider'
import Navbar from '@/components/navbar'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-gradient-to-br from-[#F7F5F3] via-[#C5B9E8] to-[#B19CD9] min-h-screen antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto px-6 py-12">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
