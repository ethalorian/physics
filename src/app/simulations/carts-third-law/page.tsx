"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { cartsThirdLawDef } from './def'

export default function CartsThirdLawSimulation() {
  return <SimLab def={cartsThirdLawDef} />
}
