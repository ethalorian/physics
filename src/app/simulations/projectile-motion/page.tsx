"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { projectileDef } from './def'

// Thin route page — all chrome/controls/data/completion live in the shared
// SimLab shell. This sim contributes only its physics engine + definition.
export default function ProjectileMotionLab() {
  return <SimLab def={projectileDef} />
}
