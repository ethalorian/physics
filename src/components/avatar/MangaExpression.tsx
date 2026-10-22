import React from 'react'
import type { AvatarTraits } from '@/lib/avatar/types'
import { EYE } from '@/lib/avatar/palette'
import { Sprite, Tint } from './MangaParts'

/** Painted eyelids and iris texture share the portrait's saved expression controls. */
export function PaintedEye({ traits: t, side, id }: { traits: AvatarTraits; side: -1 | 1; id: string }) {
  const centerY = {small:560,big:560,narrow:520,wide:520}[t.eyes]
  const window = [side === -1 ? 70 : 520, centerY - 225, 410, 450] as const
  const irisX = {small:0,big:-.1,narrow:0,wide:0}[t.eyes]
  const eye = <Sprite name={`expression-eyes-${t.eyes}`} sourceWindow={window} rect={[-19,-13.5,38,27]} />
  const irisId = `${id}-painted-iris-${side}`
  return <g data-manga-expression={`eyes-${t.eyes}`}>
    <defs>
      <Tint id={`${irisId}-color`} color={EYE[t.eye_color]} />
      <clipPath id={irisId}><ellipse cx={irisX} cy="0" rx="5.7" ry={t.eyes === 'narrow' ? 6 : 8} /></clipPath>
    </defs>
    {eye}
    <g clipPath={`url(#${irisId})`} filter={`url(#${irisId}-color)`}>{eye}</g>
  </g>
}

export function PaintedNose({ traits: t, skinFilter }: { traits: AvatarTraits; skinFilter: string }) {
  return <g data-manga-nose={t.nose}>
    <Sprite name={`expression-nose-${t.nose}`} rect={[182,117,36,36]} filter={skinFilter} />
  </g>
}

export function PaintedMouth({ style, fangs = false, profile = false }: { style: AvatarTraits['mouth']; fangs?: boolean; profile?: boolean }) {
  // The open grin is also the joyful expression's art; reserve pointed canines
  // for the equipped vampire item.
  const name = fangs ? profile ? 'fangs-profile' : 'fangs' : style === 'joy' ? 'grin' : style
  return <g data-manga-mouth={fangs ? 'vampire-fangs' : style}>
    <Sprite name={`expression-mouth-${name}`} rect={style === 'joy' && !fangs ? [-22,-15,44,32] : [-22,-13,44,26]} />
  </g>
}
