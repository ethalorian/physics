/**
 * Instructional 3D animation contract — the `animation_3d` block's engine API.
 *
 * Philosophy (distinct from SimLab):
 *   - SCRIPTED: an animation is a deterministic function of (time, knob).
 *     render(t, knob) must produce the same frame for the same inputs, so
 *     scrubbing, stepping, and replays are trivially correct.
 *   - ONE KNOB: exactly one student-adjustable parameter. The pedagogy is
 *     "predict, change, re-watch" — not free exploration (that's a sim's job).
 *   - DISPLAY-ONLY: no data capture in v1.
 *
 * Engines own their Three.js scene and renderer; AnimationStage owns the
 * clock, the controls, and the chrome.
 */

export interface AnimEngine {
  /** Render the frame at absolute time t (seconds into the script) with the
   *  current knob value. Must be deterministic in (t, knob). */
  render(t: number, knob: number): void
  /** Optional live readout line shown under the canvas (e.g. "Δv = 0.0021 m/s"). */
  readout?(t: number, knob: number): string
  resize(w: number, h: number): void
  dispose(): void
}

export interface AnimStep {
  /** Caption shown while t >= atTime (until the next step takes over). */
  label: string
  atTime: number
}

export interface AnimKnob {
  label: string
  min: number
  max: number
  step: number
  initial: number
  /** Format the value for display (default: `${v}${unit ?? ''}`). */
  display?: (v: number) => string
  unit?: string
}

export interface AnimDefinition {
  slug: string
  title: string
  /** Script length in seconds; the timeline clamps here (no implicit loop). */
  duration: number
  steps: AnimStep[]
  knob: AnimKnob
  /** Time used for the static poster frame before first play. */
  posterTime?: number
  create(canvas: HTMLCanvasElement): AnimEngine
}
