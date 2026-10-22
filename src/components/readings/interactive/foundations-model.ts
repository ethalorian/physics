/** Pure classroom models. SI except explicitly normalized relativistic quantities. */
export const EXACT_C = 299792458
export function cartPrediction(t: number, accelerated: boolean) { return 2 * t + (accelerated ? .25 * t * t : 0) }
export const cartMeasurements = [0.03, 2.22, 5.08, 8.19, 12.10] as const
export function compatibleCart(accelerated: boolean, halfWidth: number) {
  return cartMeasurements.every((x, i) => Math.abs(x - cartPrediction(i, accelerated)) <= halfWidth)
}
export function convertLength(value: number, fromPower: number, toPower: number, dimension = 1) {
  return value * 10 ** ((fromPower - toPower) * dimension)
}
export function speedToSI(kilometersPerHour: number) { return kilometersPerHour / 3.6 }
export function readings(bias: number, spread: number) {
  const pattern = [-1, -.5, 0, .5, 1]
  const values = pattern.map(p => 10 + bias + spread * p)
  return { values, mean: values.reduce((a, b) => a + b, 0) / values.length, span: 2 * spread }
}
export function boundedArea(length: number, width: number, lengthBound: number, widthBound: number) {
  if (lengthBound < 0 || widthBound < 0 || length <= lengthBound || width <= widthBound) throw new RangeError('Require positive length intervals')
  return { center: length * width, lower: (length - lengthBound) * (width - widthBound), upper: (length + lengthBound) * (width + widthBound), relativeLinearBound: lengthBound / length + widthBound / width }
}
export function boxEstimate(fill: number, length: number, width: number, height: number) {
  const room = 8 * 6 * 3, box = length * width * height
  return { room, box, count: room * fill / box }
}
export function lorentz(beta: number) {
  if (!Number.isFinite(beta) || Math.abs(beta) >= 1) throw new RangeError('Observer speed must be below c')
  return 1 / Math.sqrt(1 - beta * beta)
}
/** Coordinates use seconds and light-seconds; S′ moves at beta*c relative to S. */
export function transformEvent(x: number, t: number, beta: number) {
  const g = lorentz(beta)
  return { x: g * (x - beta * t), t: g * (t - beta * x) }
}
export function velocityInStation(uPrime: number, beta: number) {
  lorentz(beta)
  if (!Number.isFinite(uPrime) || Math.abs(uPrime) > 1) throw new RangeError('Object velocity must be at most c')
  return (uPrime + beta) / (1 + uPrime * beta)
}
/** Positive beta = source and receiver receding; flat-space longitudinal comparison. */
export function longitudinalDoppler(beta: number) {
  lorentz(beta)
  const frequency = Math.sqrt((1 - beta) / (1 + beta))
  return { frequency, wavelength: 1 / frequency }
}
export function relativisticParticle(beta: number) {
  const gamma = lorentz(beta)
  // Stable gamma−1 avoids catastrophic cancellation when beta is small.
  const kinetic = gamma * gamma * beta * beta / (gamma + 1)
  return { gamma, momentum: gamma * beta, kinetic, total: gamma }
}
/** Inputs and outputs use any one consistent energy unit. */
export function energyTriangle(momentumEnergy: number, restEnergy: number) {
  if (restEnergy < 0) throw new RangeError('Rest energy must be nonnegative')
  const total = Math.hypot(momentumEnergy, restEnergy)
  return { total, kinetic: total - restEnergy, beta: total === 0 ? 0 : momentumEnergy / total }
}
export function storageMass(energyJ: number) { return energyJ / EXACT_C ** 2 }
