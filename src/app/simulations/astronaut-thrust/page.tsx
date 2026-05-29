"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { astronautThrustDef } from './def'

export default function AstronautThrustSimulation() {
  return <SimLab def={astronautThrustDef} />
}
