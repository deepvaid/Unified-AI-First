// 2D-canvas renderer for the Da Vinci identity mark (DvOrbMark): a luminous
// particle ring — dense glowing dots in a circular band, blue → violet →
// magenta across the disc, with scattered stardust and a faked bloom pass.
// Main-bundle-safe: pure module, no Vue / no three.js. The host component owns
// the rAF loop and calls draw() only while animating (hover / active states).

export interface MarkRGB {
  r: number
  g: number
  b: number
}

export interface MarkPalette {
  /** Vibrant gradient stops across the ring (blue → violet → magenta) */
  c1: MarkRGB
  c2: MarkRGB
  c3: MarkRGB
  /** 0..1 lerp toward white — sparkle lift for the gradient-tile variant */
  whiteMix: number
  /** Alpha gain (light surfaces 1.0; dark a touch higher) */
  inkGain: number
  /** 'lighter' compositing — neon accumulation on dark surfaces */
  additive: boolean
}

export interface MarkEnergy {
  /** 0..1 hover-breathe amount */
  breath: number
  /** 0..1 activity drive (speeds rotation, brightens) */
  drive: number
  /** extra rotation speed in rad/s — Gemini-style hover spin impulse */
  spin: number
}

export interface MarkRenderer {
  draw(t: number, energy: MarkEnergy): void
  setPalette(palette: MarkPalette): void
  setSize(size: number, dpr: number): void
}

export const ZERO_ENERGY: MarkEnergy = { breath: 0, drive: 0, spin: 0 }

const TAU = Math.PI * 2
// Fixed default seed — every instance of the brand mark is the identical glyph
const DEFAULT_SEED = 0xda71c1

export function hexToRgb(hex: string): MarkRGB {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = Number.parseInt(full, 16)
  if (Number.isNaN(n) || full.length !== 6) return { r: 128, g: 128, b: 128 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k
}

/** Sample the 3-stop gradient at p ∈ [0,1] (c1 → c2 → c3). */
function sampleStops(p: MarkPalette, x: number): MarkRGB {
  const t = Math.max(0, Math.min(1, x))
  if (t < 0.5) {
    const k = t / 0.5
    return { r: lerp(p.c1.r, p.c2.r, k), g: lerp(p.c1.g, p.c2.g, k), b: lerp(p.c1.b, p.c2.b, k) }
  }
  const k = (t - 0.5) / 0.5
  return { r: lerp(p.c2.r, p.c3.r, k), g: lerp(p.c2.g, p.c3.g, k), b: lerp(p.c2.b, p.c3.b, k) }
}

export function createMarkRenderer(
  canvas: HTMLCanvasElement,
  opts: { size: number; dpr: number; seed?: number },
): MarkRenderer {
  const ctx = canvas.getContext('2d')
  const seed = opts.seed ?? DEFAULT_SEED

  let size = opts.size
  let dpr = opts.dpr
  let count = 0
  // struct-of-arrays particle buffers (regenerated deterministically on resize)
  let angles = new Float32Array(0)
  let radii = new Float32Array(0) // normalized 0..1 of mark radius R
  let dots = new Float32Array(0) // dot size in device px
  let alphas = new Float32Array(0)
  let phases = new Float32Array(0)
  let gradPos = new Float32Array(0) // 0..1 position in the c1→c2→c3 gradient
  let sparkle = new Float32Array(0) // 0..1 extra white lift per particle
  let bloom = new Uint8Array(0) // 1 = draws an under-glow halo dot
  let speedMul = new Float32Array(0) // slight differential rotation for life
  let colors = new Float32Array(0) // resolved per-particle r,g,b

  // Rotation integrates incrementally so speed changes (hover spin impulse,
  // active-state transitions) accelerate smoothly instead of snapping.
  let rotAccum = 0
  let lastDrawT = 0

  let palette: MarkPalette = {
    c1: hexToRgb('#2563EB'),
    c2: hexToRgb('#7C3AED'),
    c3: hexToRgb('#D946EF'),
    whiteMix: 0,
    inkGain: 1,
    additive: false,
  }

  // Luminous ring band (gaussian around ~0.78R) + scattered stardust.
  function regenerate() {
    const rand = mulberry32(seed)
    const ring = Math.max(50, Math.min(300, Math.round(size * size * 0.18)))
    const dust = Math.round(ring * 0.22)
    count = ring + dust
    angles = new Float32Array(count)
    radii = new Float32Array(count)
    dots = new Float32Array(count)
    alphas = new Float32Array(count)
    phases = new Float32Array(count)
    gradPos = new Float32Array(count)
    sparkle = new Float32Array(count)
    bloom = new Uint8Array(count)
    speedMul = new Float32Array(count)
    colors = new Float32Array(count * 3)

    const dotScale = (size / 28) * dpr
    for (let i = 0; i < count; i++) {
      const isDust = i >= ring
      const a = rand() * TAU
      const gauss = (rand() + rand() + rand()) / 3 - 0.5
      angles[i] = a
      if (isDust) {
        // stardust sprinkled mostly around the ring's outskirts
        radii[i] = 0.3 + rand() * 0.68
        dots[i] = (0.35 + rand() * 0.5) * dotScale
        alphas[i] = 0.12 + rand() * 0.3
      } else {
        radii[i] = Math.max(0.62, Math.min(0.94, 0.78 + gauss * 0.16))
        dots[i] = (0.45 + rand() * 0.75) * dotScale
        alphas[i] = 0.45 + rand() * 0.55
      }
      phases[i] = rand() * TAU
      // diagonal gradient across the disc: blue upper-left → magenta lower-right
      gradPos[i] = (Math.cos(a - Math.PI * 0.75) + 1) / 2
      sparkle[i] = rand() < 0.3 ? rand() * 0.55 : 0
      bloom[i] = !isDust && rand() < 0.3 ? 1 : 0
      speedMul[i] = 0.92 + rand() * 0.22
    }
    applyPalette()
  }

  function applyPalette() {
    for (let i = 0; i < count; i++) {
      const stop = sampleStops(palette, gradPos[i] ?? 0)
      const lift = Math.min(1, (sparkle[i] ?? 0) + palette.whiteMix)
      colors[i * 3] = lerp(stop.r, 255, lift)
      colors[i * 3 + 1] = lerp(stop.g, 255, lift)
      colors[i * 3 + 2] = lerp(stop.b, 255, lift)
    }
  }

  function draw(t: number, energy: MarkEnergy) {
    if (!ctx) return
    const px = size * dpr
    ctx.clearRect(0, 0, px, px)
    const center = px / 2
    const R = center - Math.max(1, dpr) // 1 CSS-px safety margin
    const dt = Math.max(0, Math.min(0.05, t - lastDrawT))
    lastDrawT = t
    rotAccum += dt * (0.1 + energy.drive * 0.5 + energy.spin)
    const rot = rotAccum
    const breathe = energy.breath

    ctx.globalCompositeOperation = palette.additive ? 'lighter' : 'source-over'

    // bloom under-layer first, then crisp dots on top
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < count; i++) {
        if (pass === 0 && !bloom[i]) continue
        const phase = phases[i] ?? 0
        const a = (angles[i] ?? 0) + rot * (speedMul[i] ?? 1)
        const wobble = 0.35 * dpr * Math.sin(t * 0.9 + phase)
        const r =
          R * (radii[i] ?? 0.78) * (1 + 0.07 * breathe * Math.sin(t * 1.4 + phase * 0.3)) + wobble
        const x = center + Math.cos(a) * r
        const y = center + Math.sin(a) * r
        const flicker = 0.78 + 0.22 * Math.sin(t * 1.7 + phase)
        let alpha =
          (alphas[i] ?? 0.4) * flicker * palette.inkGain * (1 + 0.3 * breathe + 0.25 * energy.drive)
        let s = dots[i] ?? dpr
        if (pass === 0) {
          // faked bloom: bigger, faint halo dot beneath
          s *= 2.8
          alpha *= 0.2
        }
        alpha = Math.min(1, alpha)
        const ci = i * 3
        const cr = (colors[ci] ?? 0) | 0
        const cg = (colors[ci + 1] ?? 0) | 0
        const cb = (colors[ci + 2] ?? 0) | 0
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`
        ctx.fillRect(x - s / 2, y - s / 2, s, s)
      }
    }

    ctx.globalCompositeOperation = 'source-over'
  }

  function setPalette(p: MarkPalette) {
    palette = p
    applyPalette()
  }

  function setSize(nextSize: number, nextDpr: number) {
    size = nextSize
    dpr = nextDpr
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)
    regenerate()
  }

  setSize(size, dpr)

  return { draw, setPalette, setSize }
}
