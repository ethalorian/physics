"use client"
import SimLab from '@/components/simulations/lab/SimLab'
import { cartCollisionsDef } from './def'

export default function CartCollisionsSimulation() {
  return <SimLab def={cartCollisionsDef} />
}
