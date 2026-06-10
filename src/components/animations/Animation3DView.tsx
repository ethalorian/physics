'use client'

/**
 * Animation3DView — the `animation_3d` block's renderer.
 * Resolves the slug against the registry, lazy-loads the engine definition
 * (and with it Three.js), and mounts AnimationStage. Unknown slugs degrade to
 * a quiet notice so a typo never breaks a lesson.
 */

import { useEffect, useState } from 'react'
import type { AnimDefinition } from './contract'
import { ANIMATION_LOADERS } from './registry'
import AnimationStage from './AnimationStage'

export default function Animation3DView({ slug, caption }: { slug: string; caption?: string }) {
  const [def, setDef] = useState<AnimDefinition | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let alive = true
    const loader = ANIMATION_LOADERS[slug]
    if (!loader) { setMissing(true); return }
    setMissing(false)
    setDef(null)
    loader().then((d) => { if (alive) setDef(d) }).catch((e) => {
      console.error('animation failed to load', slug, e)
      if (alive) setMissing(true)
    })
    return () => { alive = false }
  }, [slug])

  if (missing) {
    return (
      <div className="text-sm rounded-lg border p-3" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}>
        Animation &ldquo;{slug}&rdquo; isn&apos;t available.
      </div>
    )
  }
  if (!def) {
    return (
      <div className="rounded-lg border grid place-items-center" style={{ borderColor: 'var(--border)', height: 280, background: 'var(--card)', color: 'var(--muted-foreground)', fontSize: 13 }}>
        Loading animation…
      </div>
    )
  }
  return <AnimationStage def={def} caption={caption} />
}
