"use client"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Calculator } from 'lucide-react'
import { getUserRole } from '@/lib/permissions'
import VocabGameShell from '@/components/vocabulary/arcade/VocabGameShell'
import EquationVisualizer from '@/components/vocabulary/EquationVisualizer'

// Teacher/admin demo tool. Opens straight into the visualizer — the old
// three-card instruction wall now lives behind the shell's "?" toggle, and
// every color comes from the OKLCH tokens.

export default function EquationVisualizerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Check permissions
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    const userRole = getUserRole(session?.user?.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      router.push('/home')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userRole = getUserRole(session?.user?.email)
  if (userRole !== 'admin' && userRole !== 'teacher') {
    return null
  }

  const help = (
    <div className="space-y-3">
      <ul className="list-disc pl-4 space-y-1">
        <li>Pick an equation (F = ma, v = d/t, …), then drag the sliders — terms grow and shrink to show their impact on the result.</li>
        <li>Toggle between vocabulary terms, variables, and units to see the same relationship three ways.</li>
        <li>Units mode doubles as a dimensional-analysis lesson: both sides must match.</li>
        <li>Reset any time to try a new scenario.</li>
      </ul>
      <div>
        <div className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Teaching tips</div>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>F = ma:</strong> doubling mass doubles force; so does doubling acceleration — both relationships are linear.</li>
          <li><strong>KE = ½mv²:</strong> velocity is squared, so doubling velocity quadruples the energy — why high-speed crashes are so much worse.</li>
          <li><strong>P = W/t:</strong> the same work in less time takes more power.</li>
        </ul>
      </div>
    </div>
  )

  return (
    <VocabGameShell
      icon={Calculator}
      title="Physics Equation Visualizer"
      hint="Drag the sliders and watch each term's impact on the equation."
      help={help}
    >
      <EquationVisualizer />
    </VocabGameShell>
  )
}
