// Compose the trailer's music bed in code → trailer-build/score.wav (48kHz stereo).
// Data-driven: reads trailer-build/timeline.json (written by assemble.mjs) so the
// riser, impacts, and section swells land exactly on the edit's own cut times.
// A user-supplied trailer-build/music.mp3 replaces this entirely (see assemble.mjs).
//
// Usage: node scripts/trailer/make-score.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const timeline = JSON.parse(readFileSync('trailer-build/timeline.json', 'utf8'))
const SR = 48000
const TOTAL = timeline.total + 0.4
const N = Math.ceil(TOTAL * SR)
const L = new Float64Array(N)
const R = new Float64Array(N)

const at = (id) => timeline.scenes.find((s) => s.id === id)?.start ?? 0
const TWO_PI = Math.PI * 2

// ── helpers ───────────────────────────────────────────────────────────────────
/** Piecewise-linear envelope: points = [[t, gain], ...] sorted by t. */
function env(points, t) {
  if (t <= points[0][0]) return points[0][1]
  for (let i = 0; i < points.length - 1; i++) {
    const [t0, g0] = points[i]
    const [t1, g1] = points[i + 1]
    if (t >= t0 && t <= t1) return g0 + ((t - t0) / (t1 - t0)) * (g1 - g0)
  }
  return points[points.length - 1][1]
}

/** Additive saw-ish voice (6 harmonics, 1/k falloff) with slow detune shimmer. */
function padVoice(out, freq, from, to, gainEnv, detune, phase0) {
  const i0 = Math.max(0, Math.floor(from * SR))
  const i1 = Math.min(N, Math.ceil(to * SR))
  let phase = phase0
  for (let i = i0; i < i1; i++) {
    const t = i / SR
    const f = freq * (1 + detune * Math.sin(TWO_PI * 0.11 * t + phase0 * 7))
    phase += (TWO_PI * f) / SR
    let s = 0
    for (let k = 1; k <= 6; k++) s += Math.sin(phase * k) / (k * 1.6)
    out[i] += s * env(gainEnv, t)
  }
}

/** Exponentially decaying pitch-swept sine (impact / sub kick). */
function hit(t0, f0, f1, sweepDur, decay, gain) {
  const i0 = Math.floor(t0 * SR)
  const i1 = Math.min(N, Math.floor((t0 + decay * 6) * SR))
  let phase = 0
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / SR
    const f = t < sweepDur ? f0 + (f1 - f0) * (t / sweepDur) : f1
    phase += (TWO_PI * f) / SR
    const a = Math.exp(-t / decay) * gain
    const s = Math.sin(phase) * a
    L[i] += s
    R[i] += s
  }
}

/** Filtered-noise swell ending exactly at tEnd (the riser). */
function riser(tEnd, dur, gain) {
  const i0 = Math.max(0, Math.floor((tEnd - dur) * SR))
  const i1 = Math.min(N, Math.floor(tEnd * SR))
  let lp = 0
  for (let i = i0; i < i1; i++) {
    const p = (i - i0) / (i1 - i0)
    // one-pole lowpass opening up as the riser builds
    const alpha = 0.02 + 0.3 * p * p
    lp += alpha * ((Math.random() * 2 - 1) - lp)
    const s = lp * gain * p * p
    L[i] += s * 0.9
    R[i] += s * 1.1
  }
}

// ── arrangement ───────────────────────────────────────────────────────────────
const tSnap = at('s03')
const tFly = at('flyover')
const tOrb = at('s08')
const tPunch = at('s09')
const tEnd = timeline.total

// Sub drone (A1, 55Hz): quiet unease → present through the journey → resolve
{
  const g = [
    [0, 0.0], [1.2, 0.085], [tSnap, 0.09], [tSnap + 0.4, 0.13], [tFly, 0.12],
    [tOrb, 0.085], [tPunch, 0.125], [tEnd - 3, 0.1], [tEnd, 0.0],
  ]
  let phase = 0
  for (let i = 0; i < N; i++) {
    const t = i / SR
    phase += (TWO_PI * 55) / SR
    const s = (Math.sin(phase) + 0.35 * Math.sin(phase * 2.01)) * env(g, t)
    L[i] += s
    R[i] += s
  }
}

// Pad — Am / Fmaj alternating 8-bar-ish swells; enters at the snap, blooms in the flyover
{
  const gPad = [
    [tSnap - 0.2, 0.0], [tSnap + 1.2, 0.028], [tFly, 0.042], [tFly + 8, 0.05],
    [tOrb, 0.03], [tPunch, 0.045], [tEnd - 4, 0.04], [tEnd, 0.0],
  ]
  const CHORDS = [
    [110, 130.81, 164.81], // A2 C3 E3
    [87.31, 110, 130.81],  // F2 A2 C3
  ]
  const seg = 9.5
  for (let tc = tSnap; tc < tEnd; tc += seg) {
    const chord = CHORDS[Math.floor((tc - tSnap) / seg) % 2]
    for (const [vi, f] of chord.entries()) {
      padVoice(L, f, tc, Math.min(tc + seg + 0.8, tEnd), gPad, 0.0016, vi * 1.3)
      padVoice(R, f * 1.0008, tc, Math.min(tc + seg + 0.8, tEnd), gPad, 0.0019, vi * 2.1)
    }
  }
}

// Riser into the snap, and a shorter one into the stat punch
riser(tSnap, 3.6, 0.16)
riser(tPunch, 2.2, 0.1)

// Impacts: the snap and the stat punch
hit(tSnap, 140, 38, 0.09, 0.5, 0.42)
hit(tPunch, 120, 42, 0.08, 0.42, 0.34)

// ── The beat: four-on-the-floor kick + offbeat hats, 120 BPM ─────────────────
// (Replaced entirely by the user's track when trailer-build/music.mp3 exists.)
{
  const BPM = Number(process.env.SCORE_BPM || 120)
  const beat = 60 / BPM
  const beatStart = 0.5
  const beatEnd = tEnd - 2.5
  // Kick — drops out for one bar at the snap so the impact owns the moment
  for (let t = beatStart; t < beatEnd; t += beat) {
    if (t > tSnap - beat * 0.5 && t < tSnap + beat * 1.5) continue
    const g = t < at('s02') ? 0.2 : 0.3
    hit(t, 92, 46, 0.02, 0.085, g)
  }
  // Offbeat hats — short bright noise ticks
  for (let t = beatStart + beat / 2; t < beatEnd; t += beat) {
    const i0 = Math.floor(t * SR)
    const i1 = Math.min(N, i0 + Math.floor(0.035 * SR))
    let prev = 0
    for (let i = i0; i < i1; i++) {
      const p = (i - i0) / (i1 - i0)
      const n = Math.random() * 2 - 1
      const s = (n - prev) * 0.5 * (1 - p) * 0.11 // crude highpass
      prev = n
      L[i] += s * 0.8
      R[i] += s * 1.1
    }
  }
  // Eighth-note sub bass through the flyover for drive
  for (let t = tFly; t < tOrb - 0.5; t += beat / 2) {
    hit(t, 56, 55, 0.01, 0.07, 0.09)
  }
}

// Shimmer: faint slow high line (A5/E5), flyover → end, panned wide
{
  const g = [[tFly, 0.0], [tFly + 4, 0.012], [tEnd - 5, 0.012], [tEnd, 0.0]]
  let phase = 0
  for (let i = Math.floor(tFly * SR); i < N; i++) {
    const t = i / SR
    const f = (Math.floor((t - tFly) / 12) % 2 === 0 ? 880 : 659.26) * (1 + 0.004 * Math.sin(TWO_PI * 0.9 * t))
    phase += (TWO_PI * f) / SR
    const s = Math.sin(phase) * env(g, t)
    R[i] += s
    L[i] += s * 0.4
  }
}

// ── master: gentle soft-clip, global fades, 16-bit WAV ────────────────────────
const fadeIn = 0.8 * SR
const fadeOut = 3.0 * SR
for (let i = 0; i < N; i++) {
  let gl = 1
  if (i < fadeIn) gl = i / fadeIn
  if (i > N - fadeOut) gl = Math.min(gl, (N - i) / fadeOut)
  L[i] = Math.tanh(L[i] * 1.4) * gl
  R[i] = Math.tanh(R[i] * 1.4) * gl
}

const bytes = Buffer.alloc(44 + N * 4)
bytes.write('RIFF', 0)
bytes.writeUInt32LE(36 + N * 4, 4)
bytes.write('WAVE', 8)
bytes.write('fmt ', 12)
bytes.writeUInt32LE(16, 16)
bytes.writeUInt16LE(1, 20)
bytes.writeUInt16LE(2, 22)
bytes.writeUInt32LE(SR, 24)
bytes.writeUInt32LE(SR * 4, 28)
bytes.writeUInt16LE(4, 32)
bytes.writeUInt16LE(16, 34)
bytes.write('data', 36)
bytes.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) {
  bytes.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4)
  bytes.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4)
}
writeFileSync('trailer-build/score.wav', bytes)
console.log(`score.wav — ${TOTAL.toFixed(1)}s, snap hit @${tSnap.toFixed(2)}s, punch @${tPunch.toFixed(2)}s`)
