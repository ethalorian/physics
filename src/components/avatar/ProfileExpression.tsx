import React from 'react'
import type { AvatarTraits } from '@/lib/avatar/types'
import { HAIR } from '@/lib/avatar/palette'
import { PaintedEye, PaintedMouth } from './MangaExpression'

export const profileEyeOffset = (spacing: AvatarTraits['eye_spacing']) => ({ close: 1.5, normal: 0, wide: -1.5 })[spacing]

// Landmarks belong to the painted head, rather than the former vector profile.
const LANDMARKS = {
  button: { eye: [225, 116], mouth: [231, 160] },
  narrow: { eye: [225, 119], mouth: [231, 164] },
  broad: { eye: [227, 117], mouth: [234, 159] },
  hook: { eye: [225, 119], mouth: [230, 157] },
} as const

/** Same saved controls as the portrait, registered to the near side of the face. */
export function ProfileEyes({ traits: t, id }: { traits: AvatarTraits; id: string }) {
  const [x, y] = LANDMARKS[t.nose].eye
  const brow = {
    straight: 'M-10-1 9-3 9 0-10 1Z',
    arched: 'M-10 1Q-2-7 10-2L10 0Q0-4-10 2Z',
    bushy: 'M-11 0-8-3-5-2-2-4 2-3 5-4 10-2 9 2 3 1-3 2-8 1Z',
    thin: 'M-10 0Q0-4 10-1',
  }[t.brows]
  return <g transform={`translate(${profileEyeOffset(t.eye_spacing)} 0)`}>
    <g transform={`translate(${x} ${y}) scale(${{ small: .87, normal: 1, large: 1.12 }[t.eye_scale]}) rotate(${{ down: 5, level: 0, up: -5 }[t.eye_tilt]})`}>
      <g transform="scale(.48 .7)"><PaintedEye traits={t} side={1} id={id}/></g>
    </g>
    <path d={brow} transform={`translate(${x-1} ${y + { low: -9, normal: -12, high: -15 }[t.brow_height]}) scale(.8 1)`} fill={t.brows === 'thin' ? 'none' : HAIR[t.hair_color].dark} stroke={HAIR[t.hair_color].dark} strokeWidth="1" strokeLinecap="round" />
  </g>
}

export function ProfileMouth({ traits: t, fangs = false }: { traits: AvatarTraits; fangs?: boolean }) {
  const [x, baseline] = LANDMARKS[t.nose].mouth
  const y = baseline + (fangs || t.mouth === 'grin' || t.mouth === 'joy' ? 1 : t.mouth === 'smirk' ? -4 : -6)
  return <g transform={`translate(${x} ${y}) scale(${{ narrow: .82, normal: 1, wide: 1.2 }[t.mouth_width]} 1)`}>
    <g transform="scale(.45 .65)"><PaintedMouth style={t.mouth} fangs={fangs} /></g>
  </g>
}
