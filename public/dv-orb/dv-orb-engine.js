// @ts-check
// Shared Da Vinci orb engine — the ONE WebGL particle-membrane orb used by
// every surface: main landing (/main-landing/), login, and the SPA's DaVinci
// Experience (via DvOrbCanvas.vue). Ported from src/lib/davinci-orb/orb.ts.
//
// IMPORTANT — NO bare imports here ('three' etc). The SPA has no importmap, so
// a bare specifier would throw at runtime there. three.js is dependency-
// injected via opts.THREE: static pages pass the importmap/CDN namespace,
// the SPA passes its bundled module. Only primitives + the THREE namespace
// cross this boundary (colors stay hex strings / numeric tuples).
//
// vs orb.ts: identical simulation, shaders and membrane physics. Changes:
//   - THREE injected (opts.THREE) instead of imported
//   - colors optional — defaults to the static pages' graphite palette
//   - wavy option → uShape uniform (landing's irregular outer edge)
//   - sizes from canvas.clientWidth/Height, not getBoundingClientRect():
//     rect includes ancestor CSS transforms (landing scroll scales the stage
//     to 1.7) and resizing mid-scroll skewed the buffer + uAspect.
/** @typedef {import('../../src/lib/davinci-orb/types').OrbState} OrbState */
/** @typedef {import('../../src/lib/davinci-orb/types').OrbHandle} OrbHandle */
/** @typedef {import('../../src/lib/davinci-orb/types').OrbColorOptions} OrbColorOptions */
/** @typedef {import('../../src/lib/davinci-orb/types').DvOrbInitOptions} DvOrbInitOptions */
import { AMBIENT_FRAGMENT, AMBIENT_VERTEX, MEMBRANE_FRAGMENT, MEMBRANE_VERTEX } from './dv-orb-shaders.js'

const TAU = Math.PI * 2
const AUDIO_BANDS = 16
const PHYS_SEGMENTS = 48

// Adaptive particle budget — chosen ONCE at init (buffers are never resized).
// Low-power heuristic: few cores, little memory, or a coarse (touch) pointer.
function particleBudget() {
  const nav = /** @type {any} */ (navigator)
  const lowPower =
    (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
    (nav.deviceMemory && nav.deviceMemory <= 4) ||
    window.matchMedia('(pointer: coarse)').matches
  return lowPower
    ? { particles: 48000, ambient: 6500, maxDpr: 1.5 }
    : { particles: 96000, ambient: 13000, maxDpr: 2 }
}

// Graphite defaults = the static pages' original hardcoded look. Numeric
// constructors on purpose: ColorManagement linearizes hex strings but NOT
// numeric rgb, and these must match the old GLSL literals exactly.
const GRAPHITE = { inkA: [0.3, 0.32, 0.35], inkB: [0.03, 0.035, 0.04], halo: [0.1, 0.11, 0.13] }
const GRAPHITE_DARK = { inkA: [0.62, 0.66, 0.74], inkB: [0.97, 0.98, 1.0], halo: [0.78, 0.81, 0.88] }
const DEFAULT_GLOW = { glowA: '#5EEAD4', glowB: '#93C5FD', glowC: '#A78BFA' }

/**
 * @param {typeof import('three')} THREE
 * @param {Partial<OrbColorOptions> | undefined} colors
 * @param {boolean} dark
 */
function inkPalette(THREE, colors, dark) {
  const g = dark ? GRAPHITE_DARK : GRAPHITE
  const inkA = new THREE.Color(g.inkA[0], g.inkA[1], g.inkA[2])
  const inkB = new THREE.Color(g.inkB[0], g.inkB[1], g.inkB[2])
  const halo = new THREE.Color(g.halo[0], g.halo[1], g.halo[2])
  // subtle brand tint on the soft ink so the orb follows the user's accent —
  // only when the host passes one (the SPA does; static pages stay pure graphite)
  if (colors && colors.accent) inkA.lerp(new THREE.Color(colors.accent), 0.12)
  // light-on-dark needs an alpha boost — the prototype alphas assume ink-on-white
  const inkGain = dark ? 2.5 : 1.0
  return { inkA, inkB, halo, inkGain }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {DvOrbInitOptions} opts
 * @returns {OrbHandle}
 */
export function createDvOrb(canvas, opts) {
  const THREE = opts.THREE
  const reduce = !!opts.reducedMotion
  const orbOpacity = opts.opacity ?? 2.7
  let getFrame = opts.getFrame ?? null
  const budget = particleBudget()
  const PARTICLES = budget.particles
  const AMBIENT = budget.ambient
  const maxDpr = opts.maxPixelRatio ?? budget.maxDpr

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  } catch (err) {
    const e = new Error(err instanceof Error ? err.message : 'WebGL context could not be created')
    e.name = 'OrbWebGLError'
    throw e
  }
  renderer.setClearColor(0xffffff, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 4)
  camera.position.z = 1

  // ── simulation state ───────────────────────────────────────────────────────
  let speaking = false
  let listening = false
  let thinking = false
  /** @type {OrbState} */
  let currentState = 'idle'
  let speakEnergy = 0
  let micLevel = 0
  let agit = 0
  let thinkEnergy = 0

  const audioBands = new Float32Array(AUDIO_BANDS)
  const membraneWave = new Float32Array(PHYS_SEGMENTS)
  const membraneVelocity = new Float32Array(PHYS_SEGMENTS)
  const membraneForce = new Float32Array(PHYS_SEGMENTS)
  const membraneFlux = new Float32Array(PHYS_SEGMENTS)
  const nextWave = new Float32Array(PHYS_SEGMENTS)
  const nextVelocity = new Float32Array(PHYS_SEGMENTS)
  const pointerField = { active: false, theta: 0, radius: 0, velocity: 0, lastX: 0, lastY: 0, lastT: 0 }
  const pointerTarget = { x: 0, y: 0, str: 0 }
  let pointerSmX = 0
  let pointerSmY = 0
  let pointerSmStr = 0
  let nextImpulseAt = 0
  let lastFrameTime = 0
  let pointerCool = 0
  let animTime = 0
  // micro-saccades — tiny whole-field kicks with a critically damped settle,
  // like the involuntary drift-and-settle of a living gaze
  let nextSaccadeAt = 0
  const fieldOff = { x: 0, y: 0, vx: 0, vy: 0 }

  // ── membrane particle field ────────────────────────────────────────────────
  const positions = new Float32Array(PARTICLES * 3)
  const angles = new Float32Array(PARTICLES)
  const baseRadius = new Float32Array(PARTICLES)
  const seeds = new Float32Array(PARTICLES)
  const bandsAttr = new Float32Array(PARTICLES)
  const bursts = new Float32Array(PARTICLES)
  const gains = new Float32Array(PARTICLES)
  const gaps = new Float32Array(PARTICLES)
  const depths = new Float32Array(PARTICLES)

  for (let i = 0; i < PARTICLES; i++) {
    const pick = Math.random()
    const bandRand = Math.random()
    const angle = Math.random() * TAU
    let radius
    let band
    let burst

    if (pick < 0.42) {
      // thin, delicate core line
      radius = 0.605 + Math.pow(bandRand, 1.0) * 0.045
      band = 0.0
      burst = Math.random() * 0.16
    } else if (pick < 0.78) {
      // smoky mid detail (clusters / gaps)
      radius = 0.61 + Math.pow(bandRand, 1.7) * 0.22
      band = 1.0
      burst = Math.random() * 0.6
    } else if (pick < 0.92) {
      // outer wisps / hair
      radius = 0.66 + Math.pow(bandRand, 1.1) * 0.3
      band = 2.0
      burst = 0.45 + Math.random() * 0.55
    } else {
      // wide drifting dust (inside + outside the ring)
      radius = 0.42 + bandRand * 0.92
      band = 3.0
      burst = Math.random()
    }

    angles[i] = angle
    baseRadius[i] = radius
    seeds[i] = Math.random() * 1000.0
    bandsAttr[i] = band
    bursts[i] = burst
    gains[i] = 0.45 + Math.random() * 0.75
    gaps[i] = Math.random() * 1000.0
    // depth: mid-biased (triangular) — most particles near the focal plane,
    // tails reach off-plane for parallax + bokeh
    depths[i] = (Math.random() + Math.random()) * 0.5
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1))
  geo.setAttribute('aBaseRadius', new THREE.BufferAttribute(baseRadius, 1))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geo.setAttribute('aBand', new THREE.BufferAttribute(bandsAttr, 1))
  geo.setAttribute('aBurst', new THREE.BufferAttribute(bursts, 1))
  geo.setAttribute('aGain', new THREE.BufferAttribute(gains, 1))
  geo.setAttribute('aGap', new THREE.BufferAttribute(gaps, 1))
  geo.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1))

  const initialInk = inkPalette(THREE, opts.colors, !!opts.dark)
  const glow = { ...DEFAULT_GLOW, ...(opts.colors ?? {}) }
  const uniforms = {
    uTime: { value: 0 },
    uAgit: { value: 0 },
    uSpeakEnergy: { value: 0 },
    uMicLevel: { value: 0 },
    uAspect: { value: 1 },
    uRadius: { value: 0.64 },
    uDpr: { value: 1 },
    uOpacity: { value: orbOpacity },
    uShape: { value: opts.wavy ?? 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPointerStr: { value: 0 },
    uFieldOff: { value: new THREE.Vector2(0, 0) },
    uAudio: { value: audioBands },
    uWave: { value: membraneWave },
    uFlux: { value: membraneFlux },
    uInkA: { value: initialInk.inkA },
    uInkB: { value: initialInk.inkB },
    uHalo: { value: initialInk.halo },
    uInkGain: { value: initialInk.inkGain },
    uGlowA: { value: new THREE.Color(glow.glowA) },
    uGlowB: { value: new THREE.Color(glow.glowB) },
    uGlowC: { value: new THREE.Color(glow.glowC) },
  }

  const membraneMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: MEMBRANE_VERTEX,
    fragmentShader: MEMBRANE_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })

  // ── 3D ambient particle field — sparse dusty halo (depth + parallax) ──────
  const ambPos = new Float32Array(AMBIENT * 2)
  const ambDepth = new Float32Array(AMBIENT)
  const ambSeed = new Float32Array(AMBIENT)
  for (let i = 0; i < AMBIENT; i++) {
    const a = Math.random() * TAU
    const r = 0.15 + Math.sqrt(Math.random()) * 3.18 // area-uniform disc → fills the viewport
    ambPos[i * 2] = Math.cos(a) * r
    ambPos[i * 2 + 1] = Math.sin(a) * r
    ambDepth[i] = Math.random()
    ambSeed[i] = Math.random() * 1000.0
  }
  const ambGeo = new THREE.BufferGeometry()
  ambGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(AMBIENT * 3), 3)) // unused, required
  ambGeo.setAttribute('aPos', new THREE.BufferAttribute(ambPos, 2))
  ambGeo.setAttribute('aDepth', new THREE.BufferAttribute(ambDepth, 1))
  ambGeo.setAttribute('aSeed', new THREE.BufferAttribute(ambSeed, 1))
  const ambientMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: AMBIENT_VERTEX,
    fragmentShader: AMBIENT_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
  scene.add(new THREE.Points(ambGeo, ambientMat)) // added first → renders behind the ring
  scene.add(new THREE.Points(geo, membraneMat))

  function resize() {
    // clientWidth/Height, NOT getBoundingClientRect(): the rect includes
    // ancestor CSS transforms (landing scroll scale), the layout size doesn't.
    const w = Math.max(1, canvas.clientWidth)
    const h = Math.max(1, canvas.clientHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)
    uniforms.uAspect.value = w / h
    uniforms.uDpr.value = dpr
  }

  // ── pointer nudges (document-level, mapped to the canvas rect) ─────────────
  /** @param {PointerEvent} e */
  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    const now = performance.now()
    const dt = pointerField.lastT ? Math.max(16, now - pointerField.lastT) : 16
    const dx = x - pointerField.lastX
    const dy = y - pointerField.lastY
    let theta = Math.atan2(y, x) / TAU
    if (theta < 0) theta += 1
    pointerField.active = true
    pointerField.theta = theta
    pointerField.radius = Math.hypot(x, y)
    pointerField.velocity = Math.min(1.8, Math.hypot(dx, dy) / (dt / 1000))
    pointerField.lastX = x
    pointerField.lastY = y
    pointerField.lastT = now
    pointerCool = 0.55

    // magnetic target: inverse of the shader's aspect correction (pre-aspect space)
    const asp = uniforms.uAspect.value
    pointerTarget.x = asp > 1.0 ? x * asp : x
    pointerTarget.y = asp > 1.0 ? y : y / asp
    pointerTarget.str = 1.0
  }
  const onPointerLeave = () => {
    pointerField.active = false
    pointerTarget.str = 0
  }
  if (!reduce) {
    document.addEventListener('pointermove', updatePointer, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave, { passive: true })
  }

  // ── audio bands: live mic frame (pulled) or synthetic idle/speaking ───────
  /** @param {number} time */
  function updateAudioBands(time) {
    const f = getFrame ? getFrame() : null
    if (f && f.micActive) {
      micLevel += (f.micLevel - micLevel) * 0.4
      for (let b = 0; b < AUDIO_BANDS; b++) {
        const raw = f.bands[b] ?? 0
        const k = raw > audioBands[b] ? 0.5 : 0.18
        audioBands[b] += (raw - audioBands[b]) * k
      }
    } else {
      micLevel += (0 - micLevel) * 0.1
      for (let b = 0; b < AUDIO_BANDS; b++) {
        let raw = 0.012 + 0.006 * Math.sin(time * 0.8 + b * 0.7)
        if (speaking) {
          const syllable = Math.abs(Math.sin(time * 6.4 + b * 0.48)) * Math.abs(Math.sin(time * 2.9 + b * 1.17))
          raw = Math.max(raw, speakEnergy * (0.12 + 0.42 * syllable))
        }
        const k = raw > audioBands[b] ? 0.42 : 0.12
        audioBands[b] += (raw - audioBands[b]) * k
      }
    }
  }

  /** @param {number} v @param {number} min @param {number} max */
  function clampValue(v, min, max) {
    return Math.max(min, Math.min(max, v))
  }

  /** @param {number} center @param {number} strength @param {number} spread */
  function addMembraneImpulse(center, strength, spread) {
    const sc = reduce ? 0.45 : 1
    for (let i = 0; i < PHYS_SEGMENTS; i++) {
      let d = Math.abs(i - center)
      d = Math.min(d, PHYS_SEGMENTS - d)
      const falloff = Math.exp(-(d * d) / (2 * spread * spread))
      const kick = falloff * strength * sc
      membraneVelocity[i] += kick
      membraneForce[i] += kick * 0.42
      membraneFlux[i] = Math.max(membraneFlux[i], Math.min(1, falloff * strength * 3.8))
    }
  }

  /** @param {number} time @param {number} dt */
  function updateMembranePhysics(time, dt) {
    const drive = Math.min(1, speakEnergy + micLevel * 1.7 + thinkEnergy * 0.3)
    pointerCool = Math.max(0, pointerCool - dt)
    if ((pointerField.active || pointerCool > 0) && pointerField.radius > 0.34 && pointerField.radius < 1.03) {
      const center = Math.floor(pointerField.theta * PHYS_SEGMENTS)
      const radial = Math.max(0, 1 - Math.abs(pointerField.radius - 0.64) / 0.42)
      const strength = (0.006 + pointerField.velocity * 0.006) * radial * (pointerField.active ? 1.0 : 0.45)
      addMembraneImpulse(center, strength, 2.6 + radial * 1.6)
    }
    if (time >= nextImpulseAt) {
      const active = speaking || listening || thinking || drive > 0.08
      if (active || Math.random() < 0.7) {
        const sweepRaw = time * 0.055 + 0.17 * Math.sin(time * 0.37) + Math.random() * 0.08
        const sweep = sweepRaw - Math.floor(sweepRaw)
        const center = Math.floor(sweep * PHYS_SEGMENTS)
        const strength = (0.022 + drive * 0.155) * (speaking ? 1.4 : 1.0) * (thinking ? 0.7 : 1.0)
        const spread = thinking ? 0.7 + Math.random() * 0.35 : 1.05 + drive * 1.35 + Math.random() * 0.28
        addMembraneImpulse(center, strength, spread)
      }
      const baseGap = thinking
        ? 0.07 + Math.random() * 0.1
        : speaking
          ? 0.1 + Math.random() * 0.17
          : listening
            ? 0.18 + Math.random() * 0.26
            : 0.3 + Math.random() * 0.55
      nextImpulseAt = time + baseGap
    }

    const stiffness = 54 + drive * 18 + pointerCool * 16 + thinkEnergy * 10
    const tension = 13 + drive * 6 + thinkEnergy * 4
    const damping = 3.2 + drive * 1.7
    for (let i = 0; i < PHYS_SEGMENTS; i++) {
      const l = (i + PHYS_SEGMENTS - 1) % PHYS_SEGMENTS
      const r = (i + 1) % PHYS_SEGMENTS
      const audioIdx = Math.min(AUDIO_BANDS - 1, Math.floor((i / PHYS_SEGMENTS) * AUDIO_BANDS))
      const shiftedIdx = (audioIdx + Math.floor(AUDIO_BANDS * 0.33)) % AUDIO_BANDS
      const localAudio = audioBands[audioIdx] * 0.75 + audioBands[shiftedIdx] * 0.25
      const syllableProfile = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(time * 0.9 + i * 0.47), 2)
      const syllable = speaking ? speakEnergy * (0.8 + 0.62 * Math.sin(time * 5.8 + i * 0.34)) * syllableProfile : 0
      const slowEddy = 0.0088 * Math.sin(time * 0.62 + i * 0.43) + 0.0066 * Math.sin(time * 0.91 + i * 0.81)
      const shimmer = thinkEnergy * 0.0035 * Math.sin(time * 9.0 + i * 1.27)
      const idle = slowEddy + 0.0048 * Math.sin(time * 1.7 + i * 0.17 + membraneWave[l] * 8.0) + shimmer
      const lap = membraneWave[l] + membraneWave[r] - 2 * membraneWave[i]
      const curvature =
        (membraneWave[(i + 2) % PHYS_SEGMENTS] + membraneWave[(i + PHYS_SEGMENTS - 2) % PHYS_SEGMENTS] -
          2 * membraneWave[i]) *
        0.35
      const source = membraneForce[i] + localAudio * (0.025 + drive * 0.07) + syllable * 0.006 + idle
      const accel =
        (lap + curvature) * stiffness - membraneWave[i] * tension - membraneVelocity[i] * damping + source * (24 + drive * 28)
      let vel = membraneVelocity[i] + accel * dt
      let wave = membraneWave[i] + vel * dt
      if (wave > 0.23) {
        wave = 0.23
        vel *= 0.45
      }
      if (wave < -0.15) {
        wave = -0.15
        vel *= 0.45
      }
      nextWave[i] = wave
      nextVelocity[i] = vel
      membraneForce[i] *= Math.exp(-dt * 9.5)
      const fluxTarget = clampValue(Math.abs(vel) * 2.8 + Math.abs(wave) * 3.2 + localAudio * 0.48 + drive * 0.035, 0, 1)
      membraneFlux[i] += (fluxTarget - membraneFlux[i]) * (fluxTarget > membraneFlux[i] ? 0.2 : 0.12)
    }
    membraneWave.set(nextWave)
    membraneVelocity.set(nextVelocity)
  }

  // ── render loop with pause + clamped-dt accumulated clock ──────────────────
  let rafId = 0
  let running = false
  let pausedExternal = false
  let disposed = false

  /** @param {number} now */
  function frame(now) {
    if (!running) return
    step(now)
    rafId = requestAnimationFrame(frame)
  }

  /** @param {number} now */
  function step(now) {
    const real = now * 0.001
    const dt = lastFrameTime ? Math.min(0.033, Math.max(0.001, real - lastFrameTime)) : 1 / 60
    lastFrameTime = real
    // Accumulate the clamped dt: rAF timestamps leap after tab switches/paint
    // hitches, and feeding the raw jump into uTime snaps every noise-driven
    // particle to a new phase in one frame. Accumulating resumes seamlessly.
    animTime += dt
    const time = animTime
    if (speaking) {
      const tgt = 0.26 + 0.26 * Math.abs(Math.sin(time * 11.0) * Math.cos(time * 19.0))
      speakEnergy += (tgt - speakEnergy) * 0.18
    } else {
      speakEnergy += (0 - speakEnergy) * 0.06
    }
    thinkEnergy += ((thinking ? 1 : 0) - thinkEnergy) * (thinking ? 0.1 : 0.08)

    updateAudioBands(time)
    updateMembranePhysics(time, dt)
    agit += (Math.min(1, speakEnergy + micLevel * 1.6 + thinkEnergy * 0.4) - agit) * 0.18

    // micro-saccades: random tiny velocity kick every 0.8–2.5s, then a
    // critically damped spring settles the field back to center
    if (!reduce) {
      if (time >= nextSaccadeAt) {
        const a = Math.random() * TAU
        const k = 0.010 + Math.random() * 0.014
        fieldOff.vx += Math.cos(a) * k
        fieldOff.vy += Math.sin(a) * k
        nextSaccadeAt = time + 0.8 + Math.random() * 1.7
      }
      const K = 90 // spring stiffness; damping 2√K = critical (no overshoot ring)
      const D = 2 * Math.sqrt(K)
      fieldOff.vx += (-fieldOff.x * K - fieldOff.vx * D) * dt
      fieldOff.vy += (-fieldOff.y * K - fieldOff.vy * D) * dt
      fieldOff.x += fieldOff.vx * dt
      fieldOff.y += fieldOff.vy * dt
      uniforms.uFieldOff.value.set(fieldOff.x, fieldOff.y)
    }

    // smooth the magnetic cursor — eased follow + gentle fade
    pointerTarget.str *= 0.97
    pointerSmX += (pointerTarget.x - pointerSmX) * 0.12
    pointerSmY += (pointerTarget.y - pointerSmY) * 0.12
    pointerSmStr += (pointerTarget.str - pointerSmStr) * 0.1

    uniforms.uTime.value = time
    uniforms.uAgit.value = agit
    uniforms.uSpeakEnergy.value = speakEnergy
    uniforms.uMicLevel.value = micLevel
    uniforms.uPointer.value.set(pointerSmX, pointerSmY)
    uniforms.uPointerStr.value = pointerSmStr

    renderer.render(scene, camera)
  }

  function updateRunning() {
    const shouldRun = !disposed && !pausedExternal && !document.hidden
    if (shouldRun && !running) {
      running = true
      lastFrameTime = 0
      rafId = requestAnimationFrame(frame)
    } else if (!shouldRun && running) {
      running = false
      cancelAnimationFrame(rafId)
    }
  }
  const onVisibility = () => updateRunning()
  document.addEventListener('visibilitychange', onVisibility)

  /** @param {Event} e */
  const onContextLost = (e) => {
    e.preventDefault()
    opts.onContextLost?.()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  resize()
  updateRunning()
  // Paint one frame synchronously: rAF never fires in hidden tabs, so a canvas
  // mounted while backgrounded (tab restore, prerender) would otherwise stay
  // blank until the first visibilitychange.
  step(performance.now())

  return {
    /** @param {OrbState} s */
    setState(s) {
      currentState = s
      speaking = s === 'speaking'
      thinking = s === 'thinking'
      listening = s === 'listening'
    },
    getState: () => currentState,
    /** @param {OrbColorOptions} colors @param {boolean} [dark] */
    setColors(colors, dark = false) {
      const ink = inkPalette(THREE, colors, dark)
      uniforms.uInkA.value.copy(ink.inkA)
      uniforms.uInkB.value.copy(ink.inkB)
      uniforms.uHalo.value.copy(ink.halo)
      uniforms.uInkGain.value = ink.inkGain
      uniforms.uGlowA.value.set(colors.glowA)
      uniforms.uGlowB.value.set(colors.glowB)
      uniforms.uGlowC.value.set(colors.glowC)
    },
    setFrameSource(fn) {
      getFrame = fn
    },
    /** @param {boolean} paused */
    setPaused(paused) {
      pausedExternal = paused
      updateRunning()
    },
    resize,
    dispose() {
      if (disposed) return
      disposed = true
      running = false
      cancelAnimationFrame(rafId)
      document.removeEventListener('visibilitychange', onVisibility)
      if (!reduce) {
        document.removeEventListener('pointermove', updatePointer)
        document.removeEventListener('pointerleave', onPointerLeave)
      }
      canvas.removeEventListener('webglcontextlost', onContextLost)
      geo.dispose()
      ambGeo.dispose()
      membraneMat.dispose()
      ambientMat.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
