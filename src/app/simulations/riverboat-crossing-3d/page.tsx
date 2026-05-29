"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { riverboatCrossing3DDef } from './def'

export default function RiverboatCrossing3DSimulation() {
  return <SimLab def={riverboatCrossing3DDef} />
}
