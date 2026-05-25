"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { uamDef } from './def'

export default function UniformlyAcceleratedMotion() {
  return <SimLab def={uamDef} />
}
