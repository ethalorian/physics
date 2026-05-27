"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { carRaceDef } from './def'

export default function CarRaceSimulation() {
  return <SimLab def={carRaceDef} />
}
