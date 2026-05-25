"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { constantVelocityDef } from './def'

export default function ConstantVelocityLab() {
  return <SimLab def={constantVelocityDef} />
}
