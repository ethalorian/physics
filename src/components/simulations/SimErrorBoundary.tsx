"use client"

import { Component, type ReactNode } from 'react'

// Contains a crash inside the simulation iframe so it degrades to a friendly card
// instead of a raw client-side error. Sims run in their own document (see
// /embed/sim/[slug]), so the lesson's BlockBoundary can't catch their throws —
// this is the in-frame net. Two common causes are handled: a runtime sim error,
// and a ChunkLoadError (a tab open across a redeploy requests a code chunk that no
// longer exists) — the latter is fixed by a reload, which we surface prominently.

function isChunkError(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | null
  const name = e?.name ?? ''
  const msg = e?.message ?? ''
  return name === 'ChunkLoadError' || /loading chunk|importing a module|dynamically imported module|failed to fetch dynamically/i.test(msg)
}

interface Props { slug?: string; children: ReactNode }
interface State { failed: boolean; chunk: boolean }

export default class SimErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, chunk: false }

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, chunk: isChunkError(error) }
  }

  componentDidCatch(error: unknown) {
    console.error('Simulation crashed', this.props.slug, error)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="grid place-items-center" style={{ minHeight: 220, padding: 16 }}>
        <div className="rounded-2xl border p-5 text-center max-w-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
          <div className="text-sm font-semibold">This simulation couldn&apos;t load</div>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {this.state.chunk
              ? 'The page was updated since this tab opened. Reload to get the latest version.'
              : 'Something went wrong while running the simulation. You can try loading it again.'}
          </p>
          <button
            onClick={() => { if (typeof window !== 'undefined') window.location.reload() }}
            className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)' }}
          >
            Reload simulation
          </button>
        </div>
      </div>
    )
  }
}
