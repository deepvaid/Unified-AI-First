/** Orbit voice mode — the drawer's 8-state UI machine (design handoff "Orbit"). */
export type OrbitState =
  | 'ready'
  | 'listening'
  | 'thinking'
  | 'responding'
  | 'added'
  | 'error'
  | 'paused'
  | 'keyboard'
