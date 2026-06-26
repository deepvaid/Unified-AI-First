// Da Vinci identity *mark* — the small canvas dot-orb ("Glow Mist Medium").
//
// Canvas port of the finalized reference (logo_compare_nav · Glow Mist Medium),
// tuned per stakeholder: a dense halo RING (every-2nd dot, soft-feathered inner
// edge) + a soft power-tapered SCATTER reaching large, with a sparse MONOCHROME
// SHIMMER twinkling on top, all on one slow CCW spin (~20s). Pure monochrome —
// the ink is the inherited `color`.
//
// Performance: the mist (500 halo + 650 scatter) is rendered ONCE to an
// offscreen sprite per (size × colour) — each frame is one rotated drawImage.
// Only the sparse shimmer (~44 dots) is drawn live. ONE shared rAF ticker drives
// every instance and stops when idle / the tab is hidden (avoids the per-instance
// rAF leak class fixed in commit 2d01212).
//
// Mirrored verbatim (minus types, plus an auto-mount) at public/dv-orb/
// dv-orb-mark.js for the static landing/login pages — keep the two in sync, same
// as src/lib/davinci-orb/orb.ts ↔ public/dv-orb/dv-orb-engine.js.

const TAU = Math.PI * 2
const S = 512 // reference space
const C = 256 // reference centre
const MIST_PERIOD = 30000 // ms / revolution — slow, calm spin
const MIST_GAIN = 0.9 // mist dark particles 40% lighter than the 1.5 pass (shimmer carries presence)

// Halo band — outer rim is the reference's; inner radius pulled in 10% (smaller
// centre hole) while the scatter keeps its large outward expansion.
const HALO_OUTER = 124 + S * 0.088 // 169.06
const HALO_INNER = 138 // thinner ring — inner border pulled tighter toward the rim
const HALO_BAND = HALO_OUTER - HALO_INNER // ~31

// Monochrome shimmer — sparse twinkling ink dots drifting faster than the ring.
const SHIMMER_PERIOD = 21000
const SHIMMER_COUNT = 110 // more sparkle points
const SHIMMER_PEAK = 0.6 // peak twinkle α (brighter than the mist → it sparkles)
const SHIMMER_MINR = 1.2

// Reference Glow PRNG — fract(sin(s·127.1+311.7)·43758.5453), seeded by index so
// the field is deterministic.
function rng(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// ── mist geometry (512-space, colour-independent — built once) ───────────────
interface MistDot {
  x: number
  y: number
  o: number
  baseR: number
  minR: number
}
let mistGeom: MistDot[] | null = null
function buildMist(): MistDot[] {
  const dots: MistDot[] = []
  // Halo ring — the reference draws every 2nd of 1000 (≈500); feathered inner edge.
  const haloBR = S * 0.0014
  for (let i = 0; i < 1000; i += 2) {
    const a = (i / 1000) * TAU + (rng(i * 5 + 10) - 0.5) * 0.1
    const rr = rng(i * 5 + 11) // 0 at inner edge → 1 at outer edge
    const r = HALO_INNER + rr * HALO_BAND
    // soft inner falloff — inner edge much less dark (low α), ramping to full at the rim
    const o = (0.07 + rng(i * 5 + 12) * 0.19) * (0.12 + 0.88 * rr)
    dots.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, o, baseR: haloBR, minR: 0.9 })
  }
  // Scatter dust — all 650, kept large (HALO_OUTER → mmSM 254.98), gentle taper.
  const scatBR = S * 0.0016
  const mmSM = S * 0.498
  for (let i = 0; i < 850; i++) {
    const a = (i / 850) * TAU + (rng(i * 5 + 100) - 0.5) * 0.55
    const t = rng(i * 7 + 51)
    const r = HALO_OUTER + t * (mmSM - HALO_OUTER)
    const taper = Math.pow(1 - t, 0.22)
    const o = (0.04 + rng(i * 3 + 20) * 0.1) * 0.9 * taper // outer particles more visible
    dots.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, o, baseR: scatBR, minR: 1.0 })
  }
  return dots
}
function getMist(): MistDot[] {
  return mistGeom ?? (mistGeom = buildMist())
}

// ── shimmer geometry (sparse, on the halo band) ──────────────────────────────
interface ShDot {
  x: number
  y: number
  rr: number
  dur: number
  phase: number
}
let shimmerGeom: ShDot[] | null = null
function buildShimmer(): ShDot[] {
  const arr: ShDot[] = []
  for (let k = 0; k < SHIMMER_COUNT; k++) {
    const a = (k / SHIMMER_COUNT) * TAU + (rng(k * 9 + 7) - 0.5) * 0.5
    const rr = rng(k * 9 + 8) // 0 inner → 1 outer, so inner glints fade with the mist
    const r = HALO_INNER + rr * HALO_BAND
    arr.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, rr, dur: 2.4 + rng(k * 9 + 9) * 2.2, phase: rng(k * 9 + 10) })
  }
  return arr
}
function getShimmer(): ShDot[] {
  return shimmerGeom ?? (shimmerGeom = buildShimmer())
}

// Offscreen mist sprite, cached per backing-store size × colour.
const spriteCache = new Map<string, HTMLCanvasElement>()
function getMistSprite(w: number, h: number, color: string): HTMLCanvasElement {
  const key = `${w}x${h}|${color}`
  let cv = spriteCache.get(key)
  if (cv) return cv
  cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const g = cv.getContext('2d')
  if (g) {
    g.fillStyle = color
    const sc = w / S
    for (const d of getMist()) {
      g.globalAlpha = Math.min(1, d.o * MIST_GAIN)
      g.beginPath()
      g.arc(d.x * sc, d.y * sc, Math.max(d.baseR * sc, d.minR), 0, TAU)
      g.fill()
    }
    g.globalAlpha = 1
  }
  spriteCache.set(key, cv)
  return cv
}

// ── shared ticker (one rAF for every live instance) ──────────────────────────
const instances = new Set<MarkOrb>()
let rafId = 0
let lastTs = 0
let hidden = false

function frame(ts: number): void {
  rafId = requestAnimationFrame(frame)
  const dt = lastTs ? Math.min(ts - lastTs, 50) : 16.7 // cap post-blur jumps
  lastTs = ts
  if (hidden) return
  for (const inst of instances) inst.render(dt)
}
function ensureTicker(): void {
  if (!rafId) {
    lastTs = 0
    rafId = requestAnimationFrame(frame)
  }
}
function maybeStop(): void {
  if (rafId && instances.size === 0) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden
    if (!hidden) lastTs = 0 // resync dt on return
  })
}

export interface MarkOrbOptions {
  /** Spin-speed multiplier (listening 2.4 · thinking 1.6 · strip 1.4 · error 0.6 · paused 0.25) */
  speed?: number
  /** Draw a single static frame, no animation loop */
  reducedMotion?: boolean
}

export interface MarkOrbHandle {
  setSpeed(speed: number): void
  resize(): void
  /** Unregister from the ticker, drop the ResizeObserver. Idempotent. */
  destroy(): void
}

class MarkOrb implements MarkOrbHandle {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private speed: number
  private reduced: boolean
  private w = 0
  private h = 0
  private color = 'rgb(22, 24, 29)'
  private ringAngle = 0
  private shimmerAngle = 0
  private elapsed = 0
  private frameNo = 0
  private shimmer: ShDot[]
  private ro: ResizeObserver | null = null
  private dead = false

  constructor(canvas: HTMLCanvasElement, opts: MarkOrbOptions) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.speed = opts.speed ?? 1
    this.reduced = opts.reducedMotion ?? false
    this.shimmer = getShimmer()
    this.color = this.readColor()
    this.measure()
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize())
      this.ro.observe(canvas)
    }
    if (this.reduced) {
      this.draw(true)
    } else {
      instances.add(this)
      ensureTicker()
    }
  }

  private readColor(): string {
    // `color` is inherited from .dv-orbit-orb / .dv-orb, so the existing
    // ink / --inverse(#fff) / --dim(slate) CSS — and :hover flips — drive us.
    const c = getComputedStyle(this.canvas).color
    return c || this.color
  }

  private measure(): void {
    const cw = this.canvas.clientWidth || parseFloat(getComputedStyle(this.canvas).width) || 1
    const ch = this.canvas.clientHeight || cw
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    const nw = Math.max(1, Math.round(cw * dpr))
    const nh = Math.max(1, Math.round(ch * dpr))
    if (nw === this.w && nh === this.h) return
    this.w = nw
    this.h = nh
    this.canvas.width = nw
    this.canvas.height = nh
  }

  setSpeed(speed: number): void {
    this.speed = speed || 1
  }

  resize(): void {
    if (this.dead) return
    this.measure()
    if (this.reduced) this.draw(true)
  }

  render(dt: number): void {
    // Poll the inherited ink colour periodically (picks up theme + :hover fades).
    if (this.frameNo++ % 12 === 0) this.color = this.readColor()
    this.elapsed += dt
    this.ringAngle -= (TAU / MIST_PERIOD) * this.speed * dt
    this.shimmerAngle -= (TAU / SHIMMER_PERIOD) * this.speed * dt
    this.draw(false)
  }

  private draw(stat: boolean): void {
    const ctx = this.ctx
    if (!ctx) return
    const { w, h } = this
    const sc = w / S
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(w / 2, h / 2)

    // Mist — one rotated drawImage of the cached sprite.
    ctx.save()
    ctx.rotate(stat ? 0 : this.ringAngle)
    ctx.drawImage(getMistSprite(w, h, this.color), -w / 2, -h / 2)
    ctx.restore()

    // Monochrome shimmer — sparse ink dots twinkling on their own faster drift.
    ctx.save()
    ctx.rotate(stat ? 0 : this.shimmerAngle)
    ctx.fillStyle = this.color
    const sr = Math.max(S * 0.0016 * sc, SHIMMER_MINR)
    const t = this.elapsed / 1000
    for (const s of this.shimmer) {
      const tw = stat ? 0.6 : 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(TAU * (t / s.dur + s.phase)))
      // share the mist's inner falloff so the inner edge stays less dark
      ctx.globalAlpha = Math.min(1, SHIMMER_PEAK * tw * (0.12 + 0.88 * s.rr))
      ctx.beginPath()
      ctx.arc((s.x - C) * sc, (s.y - C) * sc, sr, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.restore()

    ctx.restore()
  }

  destroy(): void {
    if (this.dead) return
    this.dead = true
    this.ro?.disconnect()
    this.ro = null
    instances.delete(this)
    maybeStop()
  }
}

export function createMarkOrb(canvas: HTMLCanvasElement, opts: MarkOrbOptions = {}): MarkOrbHandle {
  return new MarkOrb(canvas, opts)
}
