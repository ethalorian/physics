/** A planted foot travels backwards at a constant speed relative to the hips.
 * Two-bone IK supplies the knee bend; the swing foot clears the floor. */
export const WALK = { thigh: 150, shin: 118, hipY: 436, ankleY: 701, stride: 42, stance: .6 }
// The older vector legs place the ankle lower than the painted high-top shoes.
export const LEGACY_WALK = { ...WALK, shin: 150, ankleY: 733 }
const degrees = (radians: number) => radians * 180 / Math.PI
export function walkFrame(phase: number, rig = WALK) {
  const p = ((phase % 1) + 1) % 1
  const bob = 2 * Math.cos(p * Math.PI * 4)
  const stance = p <= rig.stance
  const swing = (p - rig.stance) / (1 - rig.stance)
  const velocity = -2 * rig.stride / rig.stance
  // Match the foot's velocity at toe-off and heel strike. The swing starts with
  // a small follow-through, then clears the ground without a sudden knee snap.
  const x = stance ? rig.stride * (1 - 2 * p / rig.stance)
    : -rig.stride + 2 * rig.stride * (3*swing*swing - 2*swing*swing*swing)
      + velocity * (1-rig.stance) * (2*swing*swing*swing - 3*swing*swing + swing)
  const lift = stance ? 0 : 28 * Math.sin(swing * Math.PI) ** 2
  const y = rig.ankleY - rig.hipY - bob - lift
  const distance = Math.hypot(x, y)
  const clamp = (value: number) => Math.max(-1, Math.min(1, value))
  const bend = Math.acos(clamp((rig.thigh**2 + distance**2 - rig.shin**2) / (2*rig.thigh*distance)))
  const thigh = -degrees(Math.atan2(x, y) + bend)
  const knee = 180 - degrees(Math.acos(clamp((rig.thigh**2 + rig.shin**2 - distance**2) / (2*rig.thigh*rig.shin))))
  // Level soles through support; gentle toe clearance through swing.
  const foot = -thigh - knee + (stance ? 0 : -8 * Math.sin(swing * Math.PI) ** 2)
  return { x, y: rig.ankleY - lift, bob, thigh, knee, foot, stance,
    arm: 14 * x / rig.stride, elbow: -9 + 3 * x / rig.stride }
}

/** CSS runs the shared rig without React rerenders or a second model clock. */
export const buildWalkKeyframes = () => ([['manga-walk',WALK],['manga-legacy-walk',LEGACY_WALK]] as const).flatMap(([prefix,rig]) => (['near','far'] as const).flatMap((side, index) => {
  return (['thigh','knee','foot','arm','elbow'] as const).map(joint => {
    const frames = Array.from({length:81}, (_,i) => {
      const frame=walkFrame(i/80 + index/2,rig)
      return `${i*1.25}%{transform:rotate(${frame[joint].toFixed(3)}deg)}`
    }).join('')
    return `@keyframes ${prefix}-${side}-${joint}{${frames}}`
  })
})).join('') + `@keyframes manga-walk-weight{${Array.from({length:81},(_,i)=>`${i*1.25}%{transform:translateY(${walkFrame(i/80).bob.toFixed(3)}px)}`).join('')}}`
