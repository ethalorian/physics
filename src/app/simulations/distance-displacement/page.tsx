"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { distanceDisplacementDef } from './def'

export default function DistanceDisplacementSimulation() {
  return <SimLab def={distanceDisplacementDef} />
}
