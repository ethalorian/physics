"use client"
import SimLab from '@/components/simulations/lab/SimLab'
import { asteroidTrajectoryDef } from './def'

export default function AsteroidTrajectorySimulation() {
  return <SimLab def={asteroidTrajectoryDef} />
}
