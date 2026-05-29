"use client"
import SimLab from '@/components/simulations/lab/SimLab'
import { sumoForcesDef } from './def'

export default function SumoForcesSimulation() {
  return <SimLab def={sumoForcesDef} />
}
