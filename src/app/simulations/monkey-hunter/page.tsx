"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { monkeyHunterDef } from './def'

export default function MonkeyHunterSimulation() {
  return <SimLab def={monkeyHunterDef} />
}
