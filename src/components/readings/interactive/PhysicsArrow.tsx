/** A vector drawn to its actual endpoint; callers choose and disclose the scale. */
export default function PhysicsArrow({ x, y, dx, dy, color = '#236751', width = 4 }: { x: number; y: number; dx: number; dy: number; color?: string; width?: number }) {
  const length = Math.hypot(dx, dy)
  if (length < 1) return null
  const ux = dx / length, uy = dy / length, endX = x + dx, endY = y + dy
  return <g stroke={color} strokeWidth={width} strokeLinecap="round"><line x1={x} y1={y} x2={endX - ux * 5} y2={endY - uy * 5} /><path d={`M${endX - ux * 10 - uy * 5},${endY - uy * 10 + ux * 5} L${endX},${endY} L${endX - ux * 10 + uy * 5},${endY - uy * 10 - ux * 5}`} fill="none" /></g>
}
