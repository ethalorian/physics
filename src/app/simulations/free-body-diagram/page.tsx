'use client'

import SimLab from '@/components/simulations/lab/SimLab'
import { freeBodyDiagramDef } from './def'

export default function FreeBodyDiagramPage() {
  return <SimLab def={freeBodyDiagramDef} />
}
