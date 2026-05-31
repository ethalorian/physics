// React/Next.js imports
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

// Styles
import './globals.css'

// Internal components and providers
import AuthProvider from '@/components/auth-provider'
import Navbar from '@/components/navbar'
import { QuickTestAccountSwitcher } from '@/components/QuickTestAccountSwitcher'
import { ConsolidatedAssignmentProvider } from '@/contexts/ConsolidatedAssignmentContext'
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
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Antocci Physics',
  description: 'Online Physics Classroom',
}

export const viewport: Viewport = {
  // Mobile browser status-bar tint. Kept as static sRGB approximations of the
  // --background tokens (oklch) in globals.css, since metadata can't read CSS
  // vars. Update both together if --background changes.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9fb' },
    { media: '(prefers-color-scheme: dark)', color: '#17141f' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body 
        className={`${inter.variable} font-sans bg-background min-h-screen antialiased selection:bg-primary/20 selection:text-primary`}
        suppressHydrationWarning={true}
      >
        {/* Subtle gradient mesh background - Earth tones */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-40 w-80 h-80 bg-accent/6 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>
        
        <AuthProvider>
          <ToastProvider>
            <ViewModeProvider>
              <QuestionBankProvider>
                <VocabularyProvider>
                  <SimulationProvider>
                    <StudentActivityProvider>
                      <ConsolidatedAssignmentProvider>
                        <Navbar />
                        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
                          {children}
                        </main>
                        <QuickTestAccountSwitcher />
                      </ConsolidatedAssignmentProvider>
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
