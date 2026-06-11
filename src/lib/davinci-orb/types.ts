// Runtime-free contracts for the Da Vinci orb engine.
// Safe to `import type` from anywhere (pulls no three.js into the importer).

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

/**
 * One frame of audio-reactive input, pulled by the orb once per rAF.
 * Buffers may be reused by the producer — consume synchronously, never retain.
 */
export interface OrbAudioFrame {
  /** True while the mic analyser is live — engine uses bands; false ⇒ engine synthesizes */
  micActive: boolean
  /** 0..1 smoothed microphone amplitude */
  micLevel: number
  /** 16 smoothed frequency bands, each 0..1 */
  bands: ArrayLike<number>
  /** 0..1 TTS energy envelope (drives speaking pulse) */
  speakEnergy: number
}

/** Resolved literal hex colors — fed straight into shader uniforms. */
export interface OrbColorOptions {
  accent: string
  glowA: string
  glowB: string
  glowC: string
}

export interface OrbInitOptions {
  colors: OrbColorOptions
  /** Tones additive glow gain for dark surfaces */
  dark?: boolean
  /** Default 2 */
  maxPixelRatio?: number
  /** Damp idle motion, disable pointer ripple */
  reducedMotion?: boolean
  /** Pull-based audio source; null ⇒ pure idle animation */
  getFrame?: (() => OrbAudioFrame | null) | null
  /** Global alpha multiplier (prototype default 2.7) */
  opacity?: number
  /** Called if the WebGL context is lost — host should fall back to CSS */
  onContextLost?: () => void
}

/**
 * Init options for the SHARED runtime engine (public/dv-orb/dv-orb-engine.js).
 * three.js is dependency-injected so static pages (CDN importmap) and the SPA
 * (bundled module) share one engine file. `colors` becomes optional — the
 * engine defaults to the static pages' graphite palette.
 */
export interface DvOrbInitOptions extends Omit<OrbInitOptions, 'colors'> {
  THREE: typeof import('three')
  colors?: OrbColorOptions
  /** uShape uniform: 0 = plain outer field, 1 = wavy irregular outer edge (landing) */
  wavy?: number
}

/** Shape of the runtime module at /dv-orb/dv-orb-engine.js (for typed dynamic import). */
export interface DvOrbEngineModule {
  createDvOrb(canvas: HTMLCanvasElement, opts: DvOrbInitOptions): OrbHandle
}

export interface OrbHandle {
  setState(state: OrbState): void
  getState(): OrbState
  setColors(colors: OrbColorOptions, dark?: boolean): void
  setFrameSource(fn: (() => OrbAudioFrame | null) | null): void
  setPaused(paused: boolean): void
  resize(): void
  /** Cancel rAF, unbind listeners, dispose geometries/materials/renderer. Idempotent. */
  dispose(): void
}
