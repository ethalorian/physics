"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { raceTrackDef } from './def'

export default function RaceTrackSimulation() {
  return <SimLab def={raceTrackDef} />
}
