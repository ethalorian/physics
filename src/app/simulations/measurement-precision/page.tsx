'use client'

import SimLab from '@/components/simulations/lab/SimLab'
import { measurementPrecisionDef } from './def'

export default function MeasurementPrecisionSimulation() {
  return <SimLab def={measurementPrecisionDef} />
}
