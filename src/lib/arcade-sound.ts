// Tiny Web Audio sound kit for the arcade — no audio files, all synthesized.
// Shared by every game so feedback is consistent. Safe on the server (no-ops).

let ctx: AudioContext | null = null
let muted = typeof window !== 'undefined' && window.localStorage?.getItem('arcade_muted') === '1'

export function isMuted(): boolean { return muted }
export function setMuted(v: boolean): void {
  muted = v
  if (typeof window !== 'undefined') window.localStorage?.setItem('arcade_muted', v ? '1' : '0')
}

function audio(): AudioContext | null {
  if (muted) return null
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
    const Ctor = W.AudioContext ?? W.webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + start
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export const sfx = {
  correct() { tone(523.25, 0, 0.12, 'triangle'); tone(659.25, 0.08, 0.14, 'triangle') }, // C5→E5
  wrong() { tone(180, 0, 0.18, 'sawtooth', 0.14); tone(120, 0.06, 0.2, 'sawtooth', 0.12) },
  // rising sparkle that climbs with the combo count
  streak(n: number) {
    const base = 600 + Math.min(n, 8) * 70
    tone(base, 0, 0.1, 'square', 0.12)
    tone(base * 1.25, 0.07, 0.12, 'square', 0.12)
  },
  start() { tone(392, 0, 0.1, 'triangle'); tone(523.25, 0.09, 0.12, 'triangle'); tone(659.25, 0.18, 0.16, 'triangle') },
  gameover() { tone(392, 0, 0.18, 'sine'); tone(329.63, 0.16, 0.22, 'sine') },
  tick() { tone(440, 0, 0.05, 'square', 0.08) },
}
