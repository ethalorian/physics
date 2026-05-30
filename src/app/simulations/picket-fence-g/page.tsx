"use client"
import SimLab from '@/components/simulations/lab/SimLab'
import { picketFenceGDef } from './def'

export default function PicketFenceGSimulation() {
  return <SimLab def={picketFenceGDef} />
}
