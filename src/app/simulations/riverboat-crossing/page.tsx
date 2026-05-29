"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { riverboatCrossingDef } from './def'

export default function RiverboatCrossingSimulation() {
  return <SimLab def={riverboatCrossingDef} />
}
