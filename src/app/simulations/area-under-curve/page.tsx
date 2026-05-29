'use client'

import SimLab from '@/components/simulations/lab/SimLab'
import { areaUnderCurveDef } from './def'

export default function AreaUnderCurvePage() {
  return <SimLab def={areaUnderCurveDef} />
}
