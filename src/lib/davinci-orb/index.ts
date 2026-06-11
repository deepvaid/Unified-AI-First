// Da Vinci orb engine barrel — this chunk carries three.js (~0.5 MB min).
// App code must NEVER statically import values from here; reach it via
//   const { createOrb } = await import('@/lib/davinci-orb')
// Type-only imports are the sanctioned static pattern:
//   import type { OrbHandle, OrbState } from '@/lib/davinci-orb/types'
export { createOrb, OrbWebGLError } from './orb'
export type * from './types'
