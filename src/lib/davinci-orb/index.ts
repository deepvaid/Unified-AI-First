// Da Vinci orb — types-only barrel. The runtime engine is the SHARED module at
// public/dv-orb/dv-orb-engine.js (used by the static landing/login pages AND
// the SPA). DvOrbCanvas.vue loads it at runtime and injects the bundled three:
//   const [THREE, engine] = await Promise.all([
//     import('three'),
//     import(/* @vite-ignore */ engineUrl),  // full-origin URL, see DvOrbCanvas
//   ])
export type * from './types'
