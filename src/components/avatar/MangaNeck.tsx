import React from 'react'
import type { AvatarTraits } from '@/lib/avatar/types'
import type { NecklineFit } from '@/lib/avatar/neckline-fit'
import { necklinePath } from '@/lib/avatar/neckline-fit'
import { Sprite } from './MangaParts'
import { headFit } from '@/lib/avatar/anatomy-fit'

// Each face painting has a different lower canvas margin. Stretch only the neck
// texture below the jaw, keeping the head and facial landmarks unchanged.
const NECK_BOTTOM: Record<AvatarTraits['face'], number> = { round: 218, egg: 218, square: 211, heart: 213 }
export function NeckTexture({ traits, filter, fit }: { traits: AvatarTraits; filter: string; fit?: NecklineFit }) {
  const end = fit ? fit[3] + 2 : NECK_BOTTOM[traits.face]
  const start = headFit(fit).jawY - 7
  const stretch = (end - start) / (NECK_BOTTOM[traits.face] - 170)
  return <g transform={`translate(200 ${start}) scale(.80 ${stretch}) translate(-200 -170)`}><Sprite name={traits.face} rect={[104, 37, 192, 192]} filter={filter} /></g>
}
export function NeckOpeningMask({ fit, id }: { fit?: NecklineFit; id: string }) {
  if (!fit) return null
  return <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="800" style={{ maskType: 'luminance' }}><rect width="400" height="800" fill="white" /><path d={necklinePath(fit)} fill="black" /></mask>
}
