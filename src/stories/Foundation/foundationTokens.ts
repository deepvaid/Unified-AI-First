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

/** All generated tokens whose export name starts with `prefix`, in declaration order. */
export function tokensByPrefix(prefix: string): TokenEntry[] {
  return Object.entries(tokens)
    .filter((entry): entry is [string, string] => entry[0].startsWith(prefix) && typeof entry[1] === 'string')
    .map(([token, value]) => ({ token, name: token.slice(prefix.length), value }))
}
