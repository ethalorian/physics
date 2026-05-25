"use client"

import { use } from 'react'
import { SIM_COMPONENTS } from '@/components/simulations/registry'
import { SimEmbedContext } from '@/components/simulations/embed-context'

// Chrome-free host for a simulation, loaded inside a lesson via <iframe>. Running
// the sim in its own document isolates its layout (no overflow into the lesson)
// and its React tree (a crash here can't take down the lesson page). The app
// navbar is suppressed for /embed/* paths (see navbar.tsx). SimEmbedContext hides
// the sim's own page chrome (back button, assignment editor).
export default function SimEmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const Sim = SIM_COMPONENTS[slug]

  if (!Sim) {
    return <div style={{ padding: 16, color: 'var(--muted-foreground)' }}>Simulation &ldquo;{slug}&rdquo; isn&apos;t available.</div>
  }

  return (
    <div className="sim-embed-clean">
      <style>{`.sim-embed-clean button:has(svg.lucide-arrow-left),.sim-embed-clean a:has(svg.lucide-arrow-left){display:none !important}`}</style>
      <SimEmbedContext.Provider value={true}>
        <Sim />
      </SimEmbedContext.Provider>
    </div>
  )
}
