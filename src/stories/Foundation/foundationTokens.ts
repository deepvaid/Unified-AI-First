// Shared helper for Foundations stories — reads the generated token module so
// every swatch/scale row is driven by tokens.json (via `npm run tokens:build`).
import * as tokens from '@/design-tokens/generated/tokens'

export interface TokenEntry {
  /** Full export name, e.g. `mp_color_light_primary` */
  token: string
  /** Name within the group, e.g. `primary` */
  name: string
  value: string
}

/**
 * Natural order: digit runs compare numerically, everything else alphabetically.
 * A module namespace object only ever hands us alphabetical keys, which puts
 * `space_10` before `space_2` and `blue_100` before `blue_50` — nonsense for a
 * scale whose names ARE their values.
 */
function naturalCompare(a: string, b: string): number {
  const chunk = /(\d+)|(\D+)/g
  const left = a.match(chunk) ?? []
  const right = b.match(chunk) ?? []
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const l = left[i]
    const r = right[i]
    const bothNumeric = /^\d/.test(l) && /^\d/.test(r)
    if (bothNumeric) {
      if (Number(l) !== Number(r)) return Number(l) - Number(r)
    } else if (l !== r) {
      // Digits sort ahead of words, so `radius.full` trails the numeric stops.
      if (/^\d/.test(l)) return -1
      if (/^\d/.test(r)) return 1
      return l < r ? -1 : 1
    }
  }
  return left.length - right.length
}

/** All generated tokens whose export name starts with `prefix`, in scale order. */
export function tokensByPrefix(prefix: string): TokenEntry[] {
  return Object.entries(tokens)
    .filter((entry): entry is [string, string] => entry[0].startsWith(prefix) && typeof entry[1] === 'string')
    .map(([token, value]) => ({ token, name: token.slice(prefix.length), value }))
    .sort((a, b) => naturalCompare(a.name, b.name))
}
