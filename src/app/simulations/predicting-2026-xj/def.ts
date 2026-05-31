import type { SimDefinition } from '@/components/simulations/lab/contract'
import { asteroidTrajectoryDef } from '../asteroid-trajectory/def'

// Capstone framing of the SAME trajectory engine used early in Unit 1
// (Motion graphs). By the end of the unit students own slope=velocity and
// linear extrapolation; this is the assessed TRANSFER task — produce a
// defensible impact-day prediction for 2026-XJ and justify it under
// measurement uncertainty. Reuses the engine; only the framing changes.
export const predicting2026XJDef: SimDefinition = {
  ...asteroidTrajectoryDef,
  slug: 'predicting-2026-xj',
  title: 'Transfer Task: Predicting 2026-XJ’s Position',
  summary:
    "Unit 1's transfer task. You now have every tool: a distance-time graph, slope as velocity, and linear extrapolation. NASA hands you the tracking data for 2026-XJ — produce a predicted impact day, state how confident you are, and justify it from the graph. Turn the measurement scatter up and decide how many observations you'd demand before you'd stake a real decision on the number.",
  learning: {
    objectives: [
      'Produce a defensible impact-day prediction from real trajectory data',
      'Quantify and communicate the uncertainty in that prediction',
      'Justify a claim using slope and extrapolation evidence from the graph',
      'Decide how much data is enough before acting on a prediction',
    ],
    concepts: ['Transfer task', 'Slope = velocity', 'Linear extrapolation', 'Evidence-based claim', 'Measurement uncertainty'],
    tryThis: [
      'Predict at 4% scatter, then re-run several times. How much does the impact day move? Report your prediction as a range, not a single day.',
      'Your decision-maker needs the impact day to ±5 days. At 8% scatter, is one run enough — or do you need several observations averaged?',
      'Defend it: point to the slope and the zero-crossing and explain, in two sentences, why your predicted day follows from the data.',
      'Compare to the early lab (Motion graphs): same skill, real stakes. What changed about how carefully you read the graph?',
    ],
  },
}
