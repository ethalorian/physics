"use client"
import SimLab from '@/components/simulations/lab/SimLab'
import { closingSpeedDef } from './def'

export default function ClosingSpeedSimulation() {
  return <SimLab def={closingSpeedDef} />
}
