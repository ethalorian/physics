// React/Next.js imports
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

// Styles
import './globals.css'

// Internal components and providers
import AuthProvider from '@/components/auth-provider'
import Navbar from '@/components/navbar'
import { AssignmentProvider } from '@/contexts/AssignmentContext'
import { AssignmentSystemProvider } from '@/contexts/AssignmentSystemContext'
import { QuestionBankProvider } from '@/contexts/QuestionBankContext'
import { VocabularyProvider } from '@/contexts/VocabularyContext'
import { StudentActivityProvider } from '@/contexts/StudentActivityContext'
import { ViewModeProvider } from '@/contexts/ViewModeContext'
import { SimulationProvider } from '@/contexts/SimulationContext'
import { ToastProvider } from '@/providers/toast-provider'

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
          <ToastProvider>
            <ViewModeProvider>
              <QuestionBankProvider>
                <VocabularyProvider>
                  <SimulationProvider>
                    <StudentActivityProvider>
                      <AssignmentProvider>
                        <AssignmentSystemProvider>
                          <Navbar />
                          <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
                            {children}
                          </main>
                        </AssignmentSystemProvider>
                      </AssignmentProvider>
                    </StudentActivityProvider>
                  </SimulationProvider>
                </VocabularyProvider>
              </QuestionBankProvider>
            </ViewModeProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
