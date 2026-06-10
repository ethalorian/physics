/**
 * Animation registry — single source of truth for `animation_3d` blocks.
 * Mirrors SIM_COMPONENTS' registry pattern (one map, no DB row to drift), but
 * loads DEFINITIONS lazily so Three.js + engines only download when a lesson
 * actually contains an animation block.
 */

import type { AnimDefinition } from './contract'

export const ANIMATION_LOADERS: Record<string, () => Promise<AnimDefinition>> = {
  'approach-geometry': () => import('./engines/approach-geometry').then((m) => m.approachGeometryDef),
  'velocity-vector-3d': () => import('./engines/velocity-vector-3d').then((m) => m.velocityVector3DDef),
  'prediction-cone': () => import('./engines/prediction-cone').then((m) => m.predictionConeDef),
  'inertia-coast': () => import('./engines/inertia-coast').then((m) => m.inertiaCoastDef),
  'push-the-asteroid': () => import('./engines/push-the-asteroid').then((m) => m.pushTheAsteroidDef),
}

export const ANIMATION_SLUGS = Object.keys(ANIMATION_LOADERS)
