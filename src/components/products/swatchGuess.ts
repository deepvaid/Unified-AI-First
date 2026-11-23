// A first colour for a swatch, guessed from the value's name, so a colour option
// switched to swatches never shows an empty dot. The merchant corrects it in the
// swatch field. Common clothing and homeware colour names; a name of two words
// ("Heather Grey") falls back to its last word, anything else to a neutral grey.

/** The swatch a value gets when its name says nothing about its colour. */
export const NEUTRAL_SWATCH = '#c9c9c9'

const NAMED: Record<string, string> = {
  black: '#1a1a1a',
  white: '#ffffff',
  ivory: '#f4efe3',
  cream: '#f1e9d8',
  ecru: '#e8dfcc',
  oatmeal: '#d9cdb8',
  sand: '#c8b89a',
  stone: '#b8b0a2',
  beige: '#d8c8ac',
  camel: '#b9875a',
  tan: '#b48a60',
  brown: '#6b4a33',
  chocolate: '#4a3426',
  khaki: '#a69a6f',
  olive: '#5f6342',
  sage: '#9aa58a',
  green: '#2f6b45',
  forest: '#2c4a36',
  navy: '#1f2a44',
  blue: '#2f5d9e',
  indigo: '#33406b',
  denim: '#4a6584',
  sky: '#9cc3e4',
  grey: '#8a8d91',
  gray: '#8a8d91',
  charcoal: '#3a3a3c',
  silver: '#c0c2c4',
  red: '#b3261e',
  burgundy: '#6d1f2c',
  wine: '#6d1f2c',
  rust: '#a3532b',
  terracotta: '#b65f42',
  orange: '#d9792b',
  yellow: '#e5c14b',
  mustard: '#c99a2e',
  pink: '#e8b4b8',
  blush: '#e9c6c0',
  purple: '#6b4a8a',
  lilac: '#c4b3d9',
}

/** A hex colour for the value's name ("Sand" → #c8b89a, "Heather Grey" → grey), else `NEUTRAL_SWATCH`. */
export function guessSwatch(value: string): string {
  const words = value.trim().toLowerCase().split(/[\s-]+/).filter(Boolean)
  const whole = words.join(' ')
  return NAMED[whole] ?? NAMED[words[words.length - 1] ?? ''] ?? NEUTRAL_SWATCH
}
