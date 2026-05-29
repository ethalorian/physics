"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { mazeVectorsDef } from './def'

export default function MazeVectorsSimulation() {
  return <SimLab def={mazeVectorsDef} />
}
