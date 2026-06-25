// Da Vinci identity *mark* — the small canvas dot-orb ("Glow Mist Medium").
//
// Faithful canvas port of the finalized reference (logo_compare_nav · Glow Mist
// Medium): a dense, evenly-spaced halo RING + a soft power-tapered SCATTER, one
// slow coherent CCW spin (~20s), with the brand spectral GLINTS retained on top.
//
// Performance is the whole game here — the mark renders on every page (AppBar
// pill) and can repeat across chat avatars. So:
//   • the monochrome mist (1000 halo + 650 scatter) is rendered ONCE to an
//     offscreen sprite per (size × colour) and each frame is a single rotated
//     drawImage — never ~1650 arc fills per frame;
//   • the sparse glints (32–72) are drawn live (they twinkle + drift faster);
//   • ONE shared rAF ticker drives every live instance and stops when none are
//     left / the tab is hidden (avoids the per-instance rAF leak class fixed in
//     commit 2d01212).
//
// Mirrored verbatim (minus types, plus an auto-mount) at public/dv-orb/
// dv-orb-mark.js for the static landing/login pages — keep the two in sync, same
// as src/lib/davinci-orb/orb.ts ↔ public/dv-orb/dv-orb-engine.js.

const TAU = Math.PI * 2
const S = 512 // reference space
const C = 256 // reference centre

const GLINT_COLORS: readonly [string, string, string] = ['#5EEAD4', '#93C5FD', '#A78BFA'] // teal · blue · violet
const MIST_PERIOD = 20000 // ms / revolution (reference SPEED = −2π/(20·60) @60fps)
const GLINT_PERIOD = 14000 // glints drift faster than the ring

// Reference Glow PRNG — fract(sin(s·127.1+311.7)·43758.5453), seeded by index so
// the field is deterministic and identical to the SVG mark it replaces.
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
  // Halo ring — 1000 dots, band 124→169, flat light α 0.07–0.26, tight jitter.
  const haloBR = S * 0.0014
  for (let i = 0; i < 1000; i++) {
    const a = (i / 1000) * TAU + (rng(i * 5 + 10) - 0.5) * 0.1
    const r = 124 + rng(i * 5 + 11) * 45.06
    const o = 0.07 + rng(i * 5 + 12) * 0.19
    dots.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, o, baseR: haloBR, minR: 0.35 })
  }
  // Scatter dust — 650 dots, 169→255, gentle power taper, fainter.
  const scatBR = S * 0.0016
  for (let i = 0; i < 650; i++) {
    const a = (i / 650) * TAU + (rng(i * 5 + 100) - 0.5) * 0.55
    const t = rng(i * 7 + 51)
    const r = 169 + t * (255 - 169)
    const taper = Math.pow(1 - t, 0.22)
    const o = (0.04 + rng(i * 3 + 20) * 0.1) * 0.55 * taper
    dots.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, o, baseR: scatBR, minR: 0.5 })
  }
  return dots
}
function getMist(): MistDot[] {
  return mistGeom ?? (mistGeom = buildMist())
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
      g.globalAlpha = d.o
      g.beginPath()
      g.arc(d.x * sc, d.y * sc, Math.max(d.baseR * sc, d.minR), 0, TAU)
      g.fill()
    }
    g.globalAlpha = 1
  }
  spriteCache.set(key, cv)
  return cv
}

// ── glint geometry (512-space, cached per count tier) ────────────────────────
interface Glint {
  x: number
  y: number
  ci: number
  dur: number
  phase: number
}
type Tier = 's' | 'l'
const GLINTS: Record<Tier, number> = { s: 32, l: 72 } // ≤40px → 32 · ≥41px → 72
const glintCache = new Map<Tier, Glint[]>()
function getGlints(tier: Tier): Glint[] {
  let arr = glintCache.get(tier)
  if (arr) return arr
  const n = GLINTS[tier]
  arr = []
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + (rng(k * 9 + 7) - 0.5) * 0.5
    const r = 124 + rng(k * 9 + 8) * 45.06
    arr.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, ci: k % 3, dur: 2.4 + rng(k * 9 + 9) * 2.2, phase: rng(k * 9 + 10) })
  }
  glintCache.set(tier, arr)
  return arr
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
  for (const inst of instances) inst.render(ts, dt)
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
  /** Slate/dim mark — hide the spectral glints (error/paused) */
  dim?: boolean
  /** Draw a single static frame, no animation loop */
  reducedMotion?: boolean
}

export interface MarkOrbHandle {
  setSpeed(speed: number): void
  setDim(dim: boolean): void
  resize(): void
  /** Unregister from the ticker, drop the ResizeObserver. Idempotent. */
  destroy(): void
}

class MarkOrb implements MarkOrbHandle {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private speed: number
  private dim: boolean
  private reduced: boolean
  private w = 0
  private h = 0
  private tier: Tier = 'l'
  private color = 'rgb(22, 24, 29)'
  private glints: Glint[] = []
  private ringAngle = 0
  private glintAngle = 0
  private frameNo = 0
  private ro: ResizeObserver | null = null
  private dead = false

  constructor(canvas: HTMLCanvasElement, opts: MarkOrbOptions) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.speed = opts.speed ?? 1
    this.dim = opts.dim ?? false
    this.reduced = opts.reducedMotion ?? false
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
    this.tier = cw <= 40 ? 's' : 'l'
    this.glints = getGlints(this.tier)
  }

  setSpeed(speed: number): void {
    this.speed = speed || 1
  }

  setDim(dim: boolean): void {
    this.dim = dim
  }

  resize(): void {
    if (this.dead) return
    this.measure()
    if (this.reduced) this.draw(true)
  }

  render(ts: number, dt: number): void {
    // Poll the inherited ink colour periodically (picks up theme + :hover fades).
    if (this.frameNo++ % 12 === 0) this.color = this.readColor()
    this.ringAngle -= (TAU / MIST_PERIOD) * this.speed * dt
    this.glintAngle -= (TAU / GLINT_PERIOD) * this.speed * dt
    this.draw(false, ts)
  }

  private draw(stat: boolean, ts = 0): void {
    const ctx = this.ctx
    if (!ctx) return
    const { w, h } = this
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(w / 2, h / 2)

    // Mist — one rotated drawImage of the cached sprite.
    ctx.save()
    ctx.rotate(stat ? 0 : this.ringAngle)
    ctx.drawImage(getMistSprite(w, h, this.color), -w / 2, -h / 2)
    ctx.restore()

    // Spectral glints — drawn live (twinkle + own faster drift). None when dim.
    if (!this.dim) {
      const sc = w / S
      const gr = Math.max(S * 0.012 * sc, 0.6)
      ctx.save()
      ctx.rotate(stat ? 0 : this.glintAngle)
      for (const gl of this.glints) {
        ctx.globalAlpha = stat ? 0.7 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(TAU * (ts / 1000 / gl.dur + gl.phase)))
        ctx.fillStyle = GLINT_COLORS[gl.ci]!
        ctx.beginPath()
        ctx.arc((gl.x - C) * sc, (gl.y - C) * sc, gr, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.restore()
    }
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
