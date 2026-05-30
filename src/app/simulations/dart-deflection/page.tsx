"use client"
import SimLab from '@/components/simulations/lab/SimLab'
import { dartDeflectionDef } from './def'

export default function DartDeflectionSimulation() {
  return <SimLab def={dartDeflectionDef} />
}
