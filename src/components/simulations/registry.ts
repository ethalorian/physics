"use client"

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Maps a simulation slug to its interactive component, rendered INLINE inside a
// lesson (no iframe). Each sim's page default-export is a self-contained client
// component; ssr:false because the sims are fully interactive/client-only.
const load = (importer: () => Promise<{ default: ComponentType }>): ComponentType =>
  dynamic(importer, { ssr: false, loading: () => null })

export const SIM_COMPONENTS: Record<string, ComponentType> = {
  'area-under-curve': load(() => import('@/app/simulations/area-under-curve/page')),
  'astronaut-thrust': load(() => import('@/app/simulations/astronaut-thrust/page')),
  'atwood-machine': load(() => import('@/app/simulations/atwood-machine/page')),
  'car-race': load(() => import('@/app/simulations/car-race/page')),
  'carts-third-law': load(() => import('@/app/simulations/carts-third-law/page')),
  'constant-velocity': load(() => import('@/app/simulations/constant-velocity/page')),
  'dart-deflection': load(() => import('@/app/simulations/dart-deflection/page')),
  'distance-displacement': load(() => import('@/app/simulations/distance-displacement/page')),
  'free-body-diagram': load(() => import('@/app/simulations/free-body-diagram/page')),
  'freefall-cliff': load(() => import('@/app/simulations/freefall-cliff/page')),
  'maze-vectors': load(() => import('@/app/simulations/maze-vectors/page')),
  'measurement-precision': load(() => import('@/app/simulations/measurement-precision/page')),
  'monkey-hunter': load(() => import('@/app/simulations/monkey-hunter/page')),
  'projectile-motion': load(() => import('@/app/simulations/projectile-motion/page')),
  'race-track': load(() => import('@/app/simulations/race-track/page')),
  'riverboat-crossing': load(() => import('@/app/simulations/riverboat-crossing/page')),
  'riverboat-crossing-3d': load(() => import('@/app/simulations/riverboat-crossing-3d/page')),
  'slope-calculator': load(() => import('@/app/simulations/slope-calculator/page')),
  'sumo-forces': load(() => import('@/app/simulations/sumo-forces/page')),
  'uniformly-accelerated-motion': load(() => import('@/app/simulations/uniformly-accelerated-motion/page')),
  'vacuum-chamber': load(() => import('@/app/simulations/vacuum-chamber/page')),
}
