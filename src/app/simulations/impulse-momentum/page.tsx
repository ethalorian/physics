"use client"
import SimLab from '@/components/simulations/lab/SimLab'
import { impulseMomentumDef } from './def'

export default function ImpulseMomentumSimulation() {
  return <SimLab def={impulseMomentumDef} />
}
