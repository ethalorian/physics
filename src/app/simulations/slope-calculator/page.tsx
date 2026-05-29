'use client'

import SimLab from '@/components/simulations/lab/SimLab'
import { slopeCalculatorDef } from './def'

export default function SlopeCalculatorPage() {
  return <SimLab def={slopeCalculatorDef} />
}
