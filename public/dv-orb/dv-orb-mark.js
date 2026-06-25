// Da Vinci identity *mark* — canvas dot-orb ("Glow Mist Medium") for STATIC
// pages (main landing nav + FAB). Runtime mirror of src/lib/davinci-orb/mark.ts
// (no types, plus the auto-mount below) — keep the two in sync, same as
// public/dv-orb/dv-orb-engine.js ↔ src/lib/davinci-orb/orb.ts.
//
// Usage:  <canvas class="dv-orb"></canvas>
//         <script type="module" src="/dv-orb/dv-orb-mark.js"></script>
// Auto-mounts every `canvas.dv-orb`; ink colour follows the element's CSS
// `color` (so existing :hover flips work), hover/focus on the interactive
// ancestor speeds the spin up.

const TAU = Math.PI * 2
const S = 512
const C = 256
const GLINT_COLORS = ['#5EEAD4', '#93C5FD', '#A78BFA']
const MIST_PERIOD = 20000
const GLINT_PERIOD = 14000

function rng(s) {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

let mistGeom = null
function buildMist() {
  const dots = []
  const haloBR = S * 0.0014
  for (let i = 0; i < 1000; i++) {
    const a = (i / 1000) * TAU + (rng(i * 5 + 10) - 0.5) * 0.1
    const r = 124 + rng(i * 5 + 11) * 45.06
    const o = 0.07 + rng(i * 5 + 12) * 0.19
    dots.push({ x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, o, baseR: haloBR, minR: 0.35 })
  }
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
function getMist() {
  return mistGeom || (mistGeom = buildMist())
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

const GLINTS = { s: 32, l: 72 }
const glintCache = new Map()
function getGlints(tier) {
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

const instances = new Set()
let rafId = 0
let lastTs = 0
let hidden = false
function frame(ts) {
  rafId = requestAnimationFrame(frame)
  const dt = lastTs ? Math.min(ts - lastTs, 50) : 16.7
  lastTs = ts
  if (hidden) return
  for (const inst of instances) inst.render(ts, dt)
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
    this.dim = !!opts.dim
    this.reduced = !!opts.reducedMotion
    this.w = 0
    this.h = 0
    this.tier = 'l'
    this.color = this.readColor()
    this.glints = []
    this.ringAngle = 0
    this.glintAngle = 0
    this.frameNo = 0
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
    this.tier = cw <= 40 ? 's' : 'l'
    this.glints = getGlints(this.tier)
  }
  setSpeed(speed) {
    this.speed = speed || 1
  }
  setDim(dim) {
    this.dim = !!dim
  }
  resize() {
    if (this.dead) return
    this.measure()
    if (this.reduced) this.draw(true)
  }
  render(ts, dt) {
    if (this.frameNo++ % 12 === 0) this.color = this.readColor()
    this.ringAngle -= (TAU / MIST_PERIOD) * this.speed * dt
    this.glintAngle -= (TAU / GLINT_PERIOD) * this.speed * dt
    this.draw(false, ts)
  }
  draw(stat, ts) {
    const ctx = this.ctx
    if (!ctx) return
    const w = this.w
    const h = this.h
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(w / 2, h / 2)
    ctx.save()
    ctx.rotate(stat ? 0 : this.ringAngle)
    ctx.drawImage(getMistSprite(w, h, this.color), -w / 2, -h / 2)
    ctx.restore()
    if (!this.dim) {
      const sc = w / S
      const gr = Math.max(S * 0.012 * sc, 0.6)
      ctx.save()
      ctx.rotate(stat ? 0 : this.glintAngle)
      for (const gl of this.glints) {
        ctx.globalAlpha = stat ? 0.7 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(TAU * ((ts || 0) / 1000 / gl.dur + gl.phase)))
        ctx.fillStyle = GLINT_COLORS[gl.ci]
        ctx.beginPath()
        ctx.arc((gl.x - C) * sc, (gl.y - C) * sc, gr, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.restore()
    }
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
