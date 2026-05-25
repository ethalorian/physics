"use client"

import SimLab from '@/components/simulations/lab/SimLab'
import { freefallDef } from './def'

export default function FreefallCliffLab() {
  return <SimLab def={freefallDef} />
}
