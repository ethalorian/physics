import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createMazeVectorsEngine } from './engine'

export const mazeVectorsDef: SimDefinition = {
  slug: 'maze-vectors',
  title: 'Maze Navigator: Vector Addition',
  level: 'Core',
  summary: 'A winding route. One displacement. Explore a branching maze, predict signed vectors, and collect evidence for the difference between distance and displacement.',
  canvasHeight: 580,
  showPlay: false,
  showExport: true,
  params: [
    { key: 'size', label: 'Difficulty (changes reset the trial)', type: 'select', default: '21', live: true, options: [
      { value: '15', label: 'Explore · 15 × 15' }, { value: '21', label: 'Challenge · 21 × 21' }, { value: '27', label: 'Expert · 27 × 27' },
    ] },
    { key: 'trail', label: 'Show traveled route', type: 'toggle', default: true, live: true },
    { key: 'vectors', label: 'Show displacement vector', type: 'toggle', default: true, live: true },
    { key: 'components', label: 'Show component triangle (with vector)', type: 'toggle', default: true, live: true },
  ],
  readouts: [
    { key: 'distance', label: 'Distance traveled', unit: 'm', precision: 0, color: '#0f766e' },
    { key: 'magnitude', label: 'Displacement |Δr|', unit: 'm', precision: 2, color: '#7c3aed' },
    { key: 'x', label: 'Δx · east positive', unit: 'm', precision: 0, color: '#dc2626' },
    { key: 'y', label: 'Δy · north positive', unit: 'm', precision: 0, color: '#2563eb' },
    { key: 'shortest', label: 'Shortest route to G (m)', precision: 0 },
  ],
  createEngine: createMazeVectorsEngine,
  learning: {
    goal: 'Predict the goal displacement, solve the maze, and explain a round trip using evidence.',
    objectives: ['Distinguish distance traveled from the magnitude of displacement', 'Add signed horizontal and vertical components', 'Use |Δr| = √(Δx² + Δy²) and explain a zero-displacement round trip'],
    concepts: ['North is +y and east is +x; each passage cell is 1 m wide.', 'Displacement arrows can cross walls: they describe endpoint change, not a possible route.', 'Backtracking adds distance. Opposite displacement components cancel.'],
    tryThis: ['Click the maze for arrow keys / WASD. On touch screens, swipe or tap a neighboring passage.', 'Record at a junction, take a detour, and record at the same junction again.', 'Return to S after reaching G without resetting.'],
    whatToNotice: ['Distance counts every successful 1 m step, including backtracking.', 'Δr = Δx x̂ + Δy ŷ; its magnitude is √(Δx² + Δy²).', 'The purple arrow can pass through walls. Your route cannot.'],
    successMessage: 'Goal reached! Record your evidence, then return to S to test a zero-displacement round trip.',
  },
}
