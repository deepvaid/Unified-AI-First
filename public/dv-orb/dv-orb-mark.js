// Da Vinci identity *mark* — canvas dot-orb ("Glow Mist Medium") for STATIC
// pages (main landing nav + FAB). Runtime mirror of src/lib/davinci-orb/mark.ts
// (no types, plus the auto-mount below) — keep the two in sync, same as
// public/dv-orb/dv-orb-engine.js ↔ src/lib/davinci-orb/orb.ts.
//
// Usage:  <canvas class="dv-orb"></canvas>
//         <script type="module" src="/dv-orb/dv-orb-mark.js"></script>
// Auto-mounts every `canvas.dv-orb`; ink colour follows the element's CSS
// `color` (so existing :hover flips work), hover/focus on the interactive
// ancestor speeds the spin up. Monochrome mist + monochrome shimmer.

const TAU = Math.PI * 2
const S = 512
const C = 256
const MIST_PERIOD = 20000
const MIST_GAIN = 0.9 // mist dark particles 40% lighter than the 1.5 pass (shimmer carries presence)

const HALO_OUTER = 124 + S * 0.088 // 169.06
const HALO_INNER = 124 * 0.9 // 111.6 — inner circle −10%
const HALO_BAND = HALO_OUTER - HALO_INNER // 57.46

const SHIMMER_PERIOD = 14000
const SHIMMER_COUNT = 76 // more sparkle points
const SHIMMER_PEAK = 0.55
const SHIMMER_MINR = 1.2

function rng(s) {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

let mistGeom = null
function buildMist() {
  const dots = []
  const haloBR = S * 0.0014
  for (let i = 0; i < 1000; i += 2) {
    const a = (i / 1000) * TAU + (rng(i * 5 + 10) - 0.5) * 0.1
    const rr = rng(i * 5 + 11) // 0 at inner edge → 1 at outer edge
    const r = HALO_INNER + rr * HALO_BAND
    // soft inner falloff — inner edge ~30% lighter again, ramping to full at the rim
    const o = (0.07 + rng(i * 5 + 12) * 0.19) * (0.35 + 0.65 * rr)
    dots.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, o, baseR: haloBR, minR: 0.9 })
  }
  const scatBR = S * 0.0016
  const mmSM = S * 0.498
  for (let i = 0; i < 650; i++) {
    const a = (i / 650) * TAU + (rng(i * 5 + 100) - 0.5) * 0.55
    const t = rng(i * 7 + 51)
    const r = HALO_OUTER + t * (mmSM - HALO_OUTER)
    const taper = Math.pow(1 - t, 0.22)
    const o = (0.04 + rng(i * 3 + 20) * 0.1) * 0.9 * taper // outer particles more visible
    dots.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, o, baseR: scatBR, minR: 1.0 })
  }
  return dots
}
function getMist() {
  return mistGeom || (mistGeom = buildMist())
}

let shimmerGeom = null
function buildShimmer() {
  const arr = []
  for (let k = 0; k < SHIMMER_COUNT; k++) {
    const a = (k / SHIMMER_COUNT) * TAU + (rng(k * 9 + 7) - 0.5) * 0.5
    const rr = rng(k * 9 + 8) // 0 inner → 1 outer, so inner glints fade with the mist
    const r = HALO_INNER + rr * HALO_BAND
    arr.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, rr, dur: 2.4 + rng(k * 9 + 9) * 2.2, phase: rng(k * 9 + 10) })
  }
  return arr
}
function getShimmer() {
  return shimmerGeom || (shimmerGeom = buildShimmer())
}

const spriteCache = new Map()
function getMistSprite(w, h, color) {
  const key = w + 'x' + h + '|' + color
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

const instances = new Set()
let rafId = 0
let lastTs = 0
let hidden = false
function frame(ts) {
  rafId = requestAnimationFrame(frame)
  const dt = lastTs ? Math.min(ts - lastTs, 50) : 16.7
  lastTs = ts
  if (hidden) return
  for (const inst of instances) inst.render(dt)
}
function ensureTicker() {
  if (!rafId) {
    lastTs = 0
    rafId = requestAnimationFrame(frame)
  }
}
function maybeStop() {
  if (rafId && instances.size === 0) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}
document.addEventListener('visibilitychange', () => {
  hidden = document.hidden
  if (!hidden) lastTs = 0
})

class MarkOrb {
  constructor(canvas, opts) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.speed = opts.speed || 1
    this.reduced = !!opts.reducedMotion
    this.w = 0
    this.h = 0
    this.color = this.readColor()
    this.ringAngle = 0
    this.shimmerAngle = 0
    this.elapsed = 0
    this.frameNo = 0
    this.shimmer = getShimmer()
    this.dead = false
    this.ro = null
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
  readColor() {
    const c = getComputedStyle(this.canvas).color
    return c || this.color || 'rgb(22, 24, 29)'
  }
  measure() {
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
  setSpeed(speed) {
    this.speed = speed || 1
  }
  resize() {
    if (this.dead) return
    this.measure()
    if (this.reduced) this.draw(true)
  }
  render(dt) {
    if (this.frameNo++ % 12 === 0) this.color = this.readColor()
    this.elapsed += dt
    this.ringAngle -= (TAU / MIST_PERIOD) * this.speed * dt
    this.shimmerAngle -= (TAU / SHIMMER_PERIOD) * this.speed * dt
    this.draw(false)
  }
  draw(stat) {
    const ctx = this.ctx
    if (!ctx) return
    const w = this.w
    const h = this.h
    const sc = w / S
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(w / 2, h / 2)
    ctx.save()
    ctx.rotate(stat ? 0 : this.ringAngle)
    ctx.drawImage(getMistSprite(w, h, this.color), -w / 2, -h / 2)
    ctx.restore()
    ctx.save()
    ctx.rotate(stat ? 0 : this.shimmerAngle)
    ctx.fillStyle = this.color
    const sr = Math.max(S * 0.0016 * sc, SHIMMER_MINR)
    const t = this.elapsed / 1000
    for (const s of this.shimmer) {
      const tw = stat ? 0.6 : 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(TAU * (t / s.dur + s.phase)))
      // share the mist's inner falloff so the inner edge stays lighter
      ctx.globalAlpha = Math.min(1, SHIMMER_PEAK * tw * (0.35 + 0.65 * s.rr))
      ctx.beginPath()
      ctx.arc((s.x - C) * sc, (s.y - C) * sc, sr, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.restore()
    ctx.restore()
  }
  destroy() {
    if (this.dead) return
    this.dead = true
    if (this.ro) this.ro.disconnect()
    this.ro = null
    instances.delete(this)
    maybeStop()
  }
}

export function createMarkOrb(canvas, opts) {
  return new MarkOrb(canvas, opts || {})
}

// ── auto-mount for static pages ──────────────────────────────────────────────
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
document.querySelectorAll('canvas.dv-orb').forEach((cv) => {
  if (cv.__dvMark) return
  const handle = createMarkOrb(cv, { speed: 1, reducedMotion })
  cv.__dvMark = handle
  if (reducedMotion) return
  const host = cv.closest('.dv-orb-btn, .dv-fab-wrap, .dv-fab')
  if (!host) return
  const fast = () => handle.setSpeed(2)
  const slow = () => handle.setSpeed(1)
  host.addEventListener('mouseenter', fast)
  host.addEventListener('mouseleave', slow)
  host.addEventListener('focusin', fast)
  host.addEventListener('focusout', slow)
})
