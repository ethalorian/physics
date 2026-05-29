import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createMeasurementPrecisionEngine } from './engine'

export const measurementPrecisionDef: SimDefinition = {
  slug: 'measurement-precision',
  title: 'Measurement, precision & accuracy',
  level: 'Intro',
  summary:
    'Read a scale to the limit of the instrument. Drag the blue marker to line it up with the red object, then take a reading — recorded at the device’s precision. The precision of a measuring device is half the smallest marked division.',
  canvasHeight: 320,
  params: [
    {
      key: 'device',
      label: 'Measuring device',
      type: 'select',
      options: [
        { value: 'ruler_mm', label: 'Ruler (mm) — ±0.5 mm' },
        { value: 'ruler_cm', label: 'Ruler (cm) — ±0.5 cm' },
      ],
      default: 'ruler_mm',
      live: true,
    },
  ],
  readouts: [
    { key: 'reading', label: 'Current reading', unit: '', precision: 1, color: 'var(--primary)' },
    { key: 'precision', label: 'Precision (±)', unit: '', precision: 1 },
    { key: 'readings', label: 'Readings taken', precision: 0 },
    { key: 'correct', label: 'Correct', precision: 0, color: 'var(--success)' },
    { key: 'accuracy', label: 'Accuracy', unit: '%', precision: 0 },
  ],
  createEngine: createMeasurementPrecisionEngine,
  showPlay: false,
  showExport: true,
  learning: {
    objectives: [
      'Read all digits that are certain (marked on the scale)',
      'Estimate one additional, uncertain digit beyond the smallest marking',
      'Record a measurement with the appropriate number of decimal places',
    ],
    concepts: [
      'The precision of a measuring device is typically half the smallest marked division',
      'A ruler with millimeter markings lets you estimate to ±0.5 mm',
      'Recording too many decimal places claims more precision than the device allows',
    ],
    tryThis: [
      'Switch from the mm ruler to the cm ruler and notice how the precision changes',
      'Line the marker up exactly with the object, then take a reading',
      'Take at least 5 readings and aim for 60% correct to finish the lab',
    ],
  },
}
