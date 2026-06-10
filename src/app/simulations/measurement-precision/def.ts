import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createMeasurementPrecisionEngine } from './engine'

export const measurementPrecisionDef: SimDefinition = {
  slug: 'measurement-precision',
  title: 'Measurement, precision & sig figs',
  level: 'Intro',
  summary:
    'Random measurement problems for practice. In "Read the instrument", a value appears on a random instrument and you TYPE the reading with exactly the digits the device justifies — value and sig figs are scored separately. In "Count the sig figs", a recorded value appears and you type how many significant figures it has.',
  canvasHeight: 470,
  params: [
    {
      key: 'mode',
      label: 'Practice mode',
      type: 'select',
      options: [
        { value: 'read', label: 'Read the instrument' },
        { value: 'count', label: 'Count the sig figs' },
      ],
      default: 'read',
      live: true,
    },
    {
      key: 'device',
      label: 'Instrument (read mode)',
      type: 'select',
      options: [
        { value: 'random', label: 'Random instrument' },
        { value: 'ruler_mm', label: 'Ruler (mm) — ±0.5 mm' },
        { value: 'ruler_cm', label: 'Ruler (cm) — ±0.5 cm' },
        { value: 'cylinder', label: 'Graduated cylinder — ±1 mL' },
        { value: 'thermometer', label: 'Thermometer — ±0.5 °C' },
        { value: 'balance', label: 'Digital balance — ±0.01 g' },
      ],
      default: 'random',
      live: true,
    },
  ],
  readouts: [
    { key: 'attempts', label: 'Attempts', precision: 0 },
    { key: 'correct', label: 'Fully correct', precision: 0, color: 'var(--success)' },
    { key: 'valueOk', label: 'Value right', precision: 0 },
    { key: 'digitsOk', label: 'Sig figs right', precision: 0, color: 'var(--primary)' },
    { key: 'accuracy', label: 'Accuracy', unit: '%', precision: 0 },
  ],
  createEngine: createMeasurementPrecisionEngine,
  showPlay: false,
  showExport: true,
  learning: {
    objectives: [
      'Read all certain digits from an instrument, then estimate exactly one more',
      'Record a measurement with the digits the device justifies — no more, no fewer',
      'Count significant figures in recorded values, including every zero rule',
      'Explain why 4.65 cm and 4.650 cm are different claims about precision',
    ],
    concepts: [
      'The precision of an analog device is half its smallest marked division',
      'A digital device is read by recording every displayed digit — trailing zeros included',
      'Leading zeros are never significant; captured zeros always are',
      'Trailing zeros are significant only when a decimal point is written (or in scientific notation)',
    ],
    tryThis: [
      'Use "Random instrument" and notice how the correct number of decimal places changes with the device',
      'On the digital balance, try dropping a displayed trailing zero and read the feedback',
      'Get a reading scored "right value, wrong precision" on purpose — can you predict which digit count fixes it?',
      'Switch to "Count the sig figs" and find a value where your count is off — which zero rule did it test?',
    ],
  },
}
