"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { atwoodMachineDef } from './def'

export default function AtwoodMachineSimulation() {
  return <SimLab def={atwoodMachineDef} />
}
