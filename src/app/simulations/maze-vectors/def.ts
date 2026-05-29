import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createMazeVectorsEngine } from './engine'

export const mazeVectorsDef: SimDefinition = {
  slug: 'maze-vectors',
  title: 'Maze Navigator: Vector Addition',
  level: 'Intro',
  summary: 'Guide the mouse to the cheese and watch how position vectors are built from x and y components. The purple resultant r = x + y is the displacement from START.',
  canvasHeight: 600,
  params: [],
  readouts: [
    { key: 'x', label: 'X-Component', unit: 'm', precision: 2, color: '#ef4444' },
    { key: 'y', label: 'Y-Component', unit: 'm', precision: 2, color: '#3b82f6' },
    { key: 'magnitude', label: 'Magnitude |r|', unit: 'm', precision: 2, color: '#8b5cf6' },
    { key: 'moves', label: 'Moves', precision: 0 },
    { key: 'status', label: 'Status' },
  ],
  createEngine: createMazeVectorsEngine,
  learning: {
    objectives: [
      'See a position vector built from its x-component (red) and y-component (blue)',
      'Read the resultant r = x + y as the displacement from START',
      'Use the Pythagorean theorem: |r| = √(x² + y²)',
    ],
    concepts: [
      'The x-component is the horizontal distance from the origin, parallel to the x-axis',
      'The y-component is the vertical distance from the origin, parallel to the y-axis',
      'The resultant (dashed purple arrow) is the direct path from START to the current position — the sum of the x and y components',
      'To add vectors, add their components separately: r = (x₁ + x₂)x̂ + (y₁ + y₂)ŷ',
    ],
    tryThis: [
      'Use the arrow keys or WASD to move; watch the vectors change as you go',
      'Notice how the purple vector shows your displacement straight from START',
      'Calculate: if x = 3m and y = 4m, what is |r|? (Answer: 5m!)',
      'Navigate from top-left (0,0) to bottom-right to reach the cheese',
      'Try moving in just the x-direction, then just the y-direction, to isolate each component',
    ],
  },
}
