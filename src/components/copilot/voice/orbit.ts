/** Orbit voice mode — the drawer's 7-state UI machine (design handoff "Orbit"). */
export type OrbitState =
  | 'ready'
  | 'listening'
  | 'thinking'
  | 'responding'
  | 'added'
  | 'error'
  | 'paused'
