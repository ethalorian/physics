'use client'

import SimLab from '@/components/simulations/lab/SimLab'
import { vacuumChamberDef } from './def'

export default function VacuumChamberPage() {
  return <SimLab def={vacuumChamberDef} />
}
