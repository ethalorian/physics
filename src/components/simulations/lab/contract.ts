// ---------------------------------------------------------------------------
// SimLab contract — the single platform every simulation plugs into.
//
// A simulation contributes ONLY its physics: a parameter schema, a set of live
// readout fields, and an "engine" that owns the canvas (drawing AND pointer
// input). The <SimLab> shell owns everything else — header, layout, controls,
// readout grid, play/pause/reset, data table + chart, CSV export, the About
// card, completion tracking, theming, and the compact embedded layout.
//
// This keeps "any and all simulations" consistent: a fix to the shell fixes
// every sim, and a new sim is a small engine + a definition object.
// ---------------------------------------------------------------------------

export type SimLevel = 'Intro' | 'Core' | 'Challenge'

/** A user-facing control. The shell renders it; values flow to engine.setParams. */
// `live` controls stay editable while the sim is running (e.g. steering a walker
// mid-run). Without it, the shell disables a control during a run.
export type SimParam =
  | {
      key: string
      label: string
      type: 'slider'
      min: number
      max: number
      step?: number
      unit?: string
      default: number
      live?: boolean
    }
  | {
      key: string
      label: string
      type: 'select'
      options: { value: string; label: string }[]
      default: string
      live?: boolean
    }
  | {
      key: string
      label: string
      type: 'toggle'
      default: boolean
      live?: boolean
    }

export type ParamValue = number | string | boolean
export type ParamValues = Record<string, ParamValue>

/** A live number/string the engine surfaces each frame (e.g. "Time", "Vx"). */
export interface SimReadout {
  key: string
  label: string
  unit?: string
  /** decimals for numeric values (default 2). */
  precision?: number
  /** optional accent token, e.g. 'var(--success)'. */
  color?: string
}

// ---------------------------------------------------------------------------
// Mock sensor — a live readout styled like Vernier Graphical Analysis, so a sim
// mirrors the probe students use at the bench (same trace, same units). An
// engine declares a SensorSpec and feeds getSensorTrace(); the shell renders it.
// ---------------------------------------------------------------------------

export type SensorKind =
  | 'motion' | 'force' | 'pressure' | 'temperature' | 'microphone'
  | 'voltage' | 'current' | 'magnetic-field' | 'light' | 'generic'

export interface SensorSpec {
  /** Channel id — required when a sim offers multiple channels. Passed to
   *  getSensorTrace(key) so the engine returns the matching series. */
  key?: string
  kind: SensorKind
  /** Probe name, e.g. "Motion Detector", "Dual-Range Force Sensor". */
  label: string
  /** Measured quantity, e.g. "Vertical velocity". */
  quantity: string
  /** Unit of the y value, e.g. "m/s". */
  unit: string
  /** x-axis label (default "Time (s)"). */
  xLabel?: string
  /** Override trace color; otherwise a per-kind default is used. */
  color?: string
}

export interface SensorSample { x: number; y: number }

/** Tabular data for the table / chart / CSV export. */
export interface SimData {
  columns: string[]
  rows: (number | string)[][]
  /** column index for the chart x-axis (default 0). */
  xCol?: number
  /** column index for the chart y-axis (default 1). */
  yCol?: number
}

/**
 * The canvas controller. Framework-agnostic (a plain class is ideal). The shell
 * provides the canvas + 2D context, drives resize/DPR, and calls these methods.
 */
export interface SimEngine {
  /** Draw the current state. Called after resize and after setParams. */
  render(): void
  /** Advance physics by dt seconds. Presence of `step` = the sim is animatable. */
  step?(dt: number): void
  /** Apply changed control values. */
  setParams(values: ParamValues): void
  /** Begin a run (e.g. launch). Optional for sims with no explicit "start". */
  start?(values: ParamValues): void
  /** Return to initial state (keeps params). */
  reset(): void
  /** Current readout values, keyed by SimReadout.key. */
  getReadouts(): Record<string, number | string>
  /** Collected data for table/chart/export, if the sim produces any. */
  getData?(): SimData
  /** Live trace for the mock sensor readout. When the sim offers multiple
   *  channels, `channelKey` selects which series to return. */
  getSensorTrace?(channelKey?: string): SensorSample[]
  /** True once this run has met the sim's "did something meaningful" bar. */
  isComplete?(): boolean
  /** Detach listeners / cancel rAF. The shell calls this on unmount. */
  destroy(): void
}

export interface SimEngineFactory {
  // `opts.invalidate` lets a non-animated, input-driven engine (e.g. a click-to-
  // build sim) tell the shell to re-read its readouts/data/sensor after the engine
  // mutates outside the animation loop. Animated sims can ignore it.
  (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues, opts?: { invalidate: () => void }): SimEngine
}

// WebGL / Three.js engines get the RAW canvas (no 2D context) and own their own
// sizing + DPR. The shell skips getContext('2d') and the DPR transform for these.
export interface SimEngineGLFactory {
  (canvas: HTMLCanvasElement, initial: ParamValues, opts?: { invalidate: () => void }): SimEngine
}

/** Everything the shell needs to present a simulation. */
export interface SimDefinition {
  slug: string
  title: string
  level: SimLevel
  summary: string
  params: SimParam[]
  readouts: SimReadout[]
  /** 2D engine factory. Required unless renderMode==='webgl' (then use createEngineGL). */
  createEngine?: SimEngineFactory
  /** Render backend. '2d' (default) draws via a CanvasRenderingContext2D; 'webgl'
   *  hands the raw canvas to createEngineGL (Three.js) and skips the 2D context. */
  renderMode?: '2d' | 'webgl'
  createEngineGL?: SimEngineGLFactory
  /** Default canvas height in px (shell still makes it responsive). Default 420. */
  canvasHeight?: number
  /** Optional mock sensor — renders a Vernier-style live trace from getSensorTrace().
   *  Use `sensors` for multiple switchable channels (a picker appears in the panel);
   *  `sensor` is the single-channel shorthand. */
  sensor?: SensorSpec
  sensors?: SensorSpec[]
  /** Show the play/pause control (auto-true when the engine defines `step`). */
  showPlay?: boolean
  /** Offer CSV export (auto-true when the engine defines `getData`). */
  showExport?: boolean
  learning?: {
    objectives?: string[]
    concepts?: string[]
    tryThis?: string[]
  }
}

/** Helper: initial param values from a definition. */
export function defaultParamValues(params: SimParam[]): ParamValues {
  const out: ParamValues = {}
  for (const p of params) out[p.key] = p.default
  return out
}
