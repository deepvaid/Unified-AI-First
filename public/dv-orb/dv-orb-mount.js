// @ts-check
// Auto-mount for STATIC pages (main landing, login). The SPA does not use
// this — DvOrbCanvas.vue calls createDvOrb directly with its bundled three.
//
// Usage in a static page:
//   <script type="importmap"> { "imports": { "three": "<cdn three.module.js>" } } </script>
//   <canvas id="orb" data-wavy="1" data-opacity="2.7"></canvas>
//   <script type="module" src="/dv-orb/dv-orb-mount.js"></script>
//
// Exposes the handle as window.__dvOrb and dispatches 'dv-orb:ready' on
// document so inline page scripts (e.g. the landing scroll choreography)
// can drive setPaused()/setState().
import * as THREE from 'three'
import { createDvOrb } from './dv-orb-engine.js'

const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('orb'))
if (canvas) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  try {
    const handle = createDvOrb(canvas, {
      THREE,
      wavy: parseFloat(canvas.dataset.wavy ?? '') || 0,
      opacity: parseFloat(canvas.dataset.opacity ?? '') || 2.7,
      reducedMotion,
      onContextLost: () => {
        canvas.style.display = 'none'
      },
    })
    window.addEventListener('resize', () => handle.resize())
    // @ts-ignore — page-level escape hatch, intentionally untyped
    window.__dvOrb = handle
    document.dispatchEvent(new CustomEvent('dv-orb:ready'))
  } catch {
    // WebGL2 unavailable (three r163+ requires it) — degrade to no orb
    canvas.remove()
  }
}
