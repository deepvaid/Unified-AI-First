// @ts-check
// dv-orb-lite — dependency-free canvas-2D variant of the Da Vinci orb for
// static pages where load time matters more than interactivity (login).
//
// vs dv-orb-mount.js + dv-orb-engine.js: no three.js (saves the ~330 KB gzip
// CDN download), no WebGL, no per-particle simulation. The grain ring, smoke
// band and ambient dust are scattered ONCE at init into three offscreen
// canvases (seeded RNG → stable grain), then each frame is just three
// drawImage calls: per-layer slow rotation + asymmetric breathing scale +
// gentle alpha shimmer. Reads as the same living orb at ~zero CPU.
//
// Usage (same contract as dv-orb-mount.js, minus the importmap):
//   <canvas id="orb" data-opacity="2.7"></canvas>
//   <script type="module" src="/dv-orb/dv-orb-lite.js"></script>
//
// Exposes window.__dvOrb = { setPaused, resize, setState } and dispatches
// 'dv-orb:ready' so pages written against the full engine keep working.

const TAU = Math.PI * 2

// Graphite palette — matches dv-orb-engine.js GRAPHITE (numeric rgb) exactly.
const INK_A = [77, 82, 89]   // 0.30, 0.32, 0.35
const INK_B = [8, 9, 10]     // 0.03, 0.035, 0.04
const HALO = [26, 28, 33]    // 0.10, 0.11, 0.13

// Same low-power heuristic as dv-orb-engine.js particleBudget().
function budget() {
  const nav = /** @type {any} */ (navigator)
  const lowPower =
    (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
    (nav.deviceMemory && nav.deviceMemory <= 4) ||
    window.matchMedia('(pointer: coarse)').matches
  return lowPower
    ? { ring: 26000, smoke: 17000, dust: 8000, maxDpr: 1.5 }
    : { ring: 52000, smoke: 34000, dust: 16000, maxDpr: 2 }
}

// mulberry32 — deterministic grain across frames and reloads.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Uneven edge darkness — broad darker/lighter angular sectors + finer grain
// (canvas stand-in for the shader's noise(theta*3)/noise(theta*11) blend).
function unevenness(theta, ph) {
  const broad =
    0.5 +
    0.30 * Math.sin(theta * 3 + ph[0]) +
    0.17 * Math.sin(theta * 5 + ph[1]) +
    0.10 * Math.sin(theta * 2 + ph[2])
  const fine = 0.5 + 0.5 * Math.sin(theta * 11 + ph[3]) * Math.sin(theta * 7 + ph[4])
  const u = broad * 0.6 + fine * 0.4
  return 0.28 + 1.25 * Math.max(0, Math.min(1, u))
}

function ink(rand, t) {
  // t 0..1 → between soft inkA and near-black inkB, like the shader's vInk mix
  const r = Math.round(INK_A[0] + (INK_B[0] - INK_A[0]) * t)
  const g = Math.round(INK_A[1] + (INK_B[1] - INK_A[1]) * t)
  const b = Math.round(INK_A[2] + (INK_B[2] - INK_A[2]) * t)
  return [r, g, b]
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ opacity?: number, reducedMotion?: boolean }} [opts]
 */
export function createDvOrbLite(canvas, opts = {}) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  const reduce = !!opts.reducedMotion
  // Full engine multiplies shader alphas by uOpacity (default 2.7); here the
  // layer alphas below are pre-tuned for 2.7, so treat data-opacity as a
  // relative gain against that baseline.
  const gain = (opts.opacity ?? 2.7) / 2.7
  const B = budget()

  let W = 0, H = 0, dpr = 1, R = 0
  /** @type {{ cv: HTMLCanvasElement, half: number, speed: number, breathe: number, shimmer: number, alpha: number }[]} */
  let ringLayers = []
  /** @type {HTMLCanvasElement | null} */
  let dustLayer = null
  let paused = false
  let raf = 0
  let last = 0

  function makeLayer(size) {
    const cv = document.createElement('canvas')
    cv.width = size
    cv.height = size
    return cv
  }

  function dot(c, x, y, s, rgb, a) {
    c.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(1, a)})`
    c.fillRect(x - s / 2, y - s / 2, s, s)
  }

  function build() {
    W = canvas.clientWidth
    H = canvas.clientHeight
    dpr = Math.min(window.devicePixelRatio || 1, B.maxDpr)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    // Inner-edge radius: engine NDC 0.6 with aspect fit → 0.3 × min dimension.
    R = 0.3 * Math.min(W, H) * dpr

    const rand = mulberry32(0xda51)
    const ph = [rand() * TAU, rand() * TAU, rand() * TAU, rand() * TAU, rand() * TAU]

    // ── layer 1: core ring — dense grain hugging the inner edge ─────────────
    const half1 = Math.ceil(R * 1.75)
    const l1 = makeLayer(half1 * 2)
    const c1 = /** @type {CanvasRenderingContext2D} */ (l1.getContext('2d'))
    for (let i = 0; i < B.ring; i++) {
      const theta = rand() * TAU
      // exponential falloff outward from the edge + organic inner fuzz
      const out = -Math.log(1 - rand()) * 0.16
      if (out > 0.65) continue
      const fuzz = (rand() - 0.5) * 0.02
      const r = R * (1 + out + fuzz)
      const x = half1 + Math.cos(theta) * r
      const y = half1 + Math.sin(theta) * r
      const edge = Math.exp(-out * 4)           // slightly denser near the edge
      const a = (0.028 + 0.080 * edge) * unevenness(theta, ph) * (0.5 + rand() * 0.8)
      dot(c1, x, y, (0.8 + rand() * 1.0) * dpr, ink(rand, 0.34 + rand() * 0.5), a * gain)
    }

    // ── layer 2: smoke/hair — wide mist spreading outward (the doubled field) ─
    const half2 = Math.ceil(R * 2.7)
    const l2 = makeLayer(half2 * 2)
    const c2 = /** @type {CanvasRenderingContext2D} */ (l2.getContext('2d'))
    for (let i = 0; i < B.smoke; i++) {
      const theta = rand() * TAU
      const out = -Math.log(1 - rand()) * 0.55
      if (out > 1.55) continue
      const r = R * (1.02 + out)
      const x = half2 + Math.cos(theta) * r
      const y = half2 + Math.sin(theta) * r
      const a = (0.024 + 0.052 * Math.exp(-out * 2)) * unevenness(theta * 1.4, ph) * (0.5 + rand() * 0.8)
      dot(c2, x, y, (1.0 + rand() * 1.2) * dpr, ink(rand, 0.2 + rand() * 0.4), a * gain)
    }

    // ── layer 3: ambient dust — whole viewport, denser near the orb ─────────
    const dust = document.createElement('canvas')
    dust.width = canvas.width
    dust.height = canvas.height
    const c3 = /** @type {CanvasRenderingContext2D} */ (dust.getContext('2d'))
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    for (let i = 0; i < B.dust; i++) {
      const x = rand() * canvas.width
      const y = rand() * canvas.height
      const d = Math.hypot(x - cx, y - cy) / R
      if (d < 1.0 && rand() < 0.85) continue          // keep the inner disc clean
      const near = Math.max(0, 1 - Math.abs(d - 1.5) / 1.8)
      const a = (0.055 + 0.16 * near) * (0.4 + rand() * 0.8)
      dot(c3, x, y, (0.8 + rand() * 1.0) * dpr, HALO, a * gain)
    }

    ringLayers = [
      { cv: l1, half: half1, speed: 0.05, breathe: 1.0, shimmer: 0.05, alpha: 1 },
      { cv: l2, half: half2, speed: 0.032, breathe: 1.6, shimmer: 0.09, alpha: 1 },
    ]
    dustLayer = dust
  }

  // Asymmetric physiological breathing — same 42%/58% split as the shader
  // (≈4.2 s inhale, ≈5.8 s exhale over a 10 s cycle).
  function breath(t) {
    const bph = (t / 10) % 1
    const curve = bph < 0.42 ? smooth(bph / 0.42) : 1 - smooth((bph - 0.42) / 0.58)
    return (curve - 0.5) * 0.022  // ±1.1% scale
  }
  function smooth(x) { return x * x * (3 - 2 * x) }

  function frame(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    if (dustLayer) {
      // dust doesn't rotate (rotating a viewport rect exposes corners) — it
      // drifts a few px instead, which reads the same at this sparsity
      ctx.globalAlpha = 1
      const dx = Math.sin(t * 0.06) * 3 * dpr
      const dy = Math.cos(t * 0.05) * 3 * dpr
      ctx.drawImage(dustLayer, dx, dy)
    }
    const scale = 1 + breath(t)
    for (const L of ringLayers) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * L.speed)
      const s = 1 + (scale - 1) * L.breathe
      ctx.scale(s, s)
      ctx.globalAlpha = 1 + Math.sin(t * 0.4 + L.speed * 40) * L.shimmer
      ctx.drawImage(L.cv, -L.half, -L.half)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }

  function loop(now) {
    raf = requestAnimationFrame(loop)
    if (paused) return
    if (now - last < 33) return   // ~30fps is plenty for this motion
    last = now
    frame(now / 1000)
  }

  build()
  if (reduce) {
    frame(0)                      // single static composite
  } else {
    raf = requestAnimationFrame(loop)
  }

  let resizeT = 0
  function resize() {
    clearTimeout(resizeT)
    resizeT = window.setTimeout(() => {
      build()
      if (reduce || paused) frame(0)
    }, 120)
  }

  return {
    setPaused(p) { paused = !!p },
    resize,
    /** @param {string} _s */
    setState(_s) { /* no states in the lite orb */ },
    destroy() { cancelAnimationFrame(raf); clearTimeout(resizeT) },
  }
}

// ── auto-mount (same page contract as dv-orb-mount.js) ────────────────────────
const el = /** @type {HTMLCanvasElement | null} */ (document.getElementById('orb'))
if (el) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const handle = createDvOrbLite(el, {
    opacity: parseFloat(el.dataset.opacity ?? '') || 2.7,
    reducedMotion,
  })
  window.addEventListener('resize', () => handle.resize())
  // @ts-ignore — page-level escape hatch, intentionally untyped
  window.__dvOrb = handle
  document.dispatchEvent(new CustomEvent('dv-orb:ready'))
}
