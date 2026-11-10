/**
 * Brand-colour accessibility — the one place that decides what is readable on, and
 * beside, a merchant-picked colour. Pure and import-free so `node:test` can run it and
 * so the same rules can be ported to the widget backend as-is.
 *
 * The merchant picks ONE brand colour. Everything else is derived:
 *
 *  - `onBrand(brand)`  → ink for text/icons sitting ON the brand fill (header, shopper
 *    bubble, solid buttons). Near-black or white, whichever has the higher WCAG contrast.
 *  - `brandInk(brand, surface)` → the brand colour used AS text or a border on a neutral
 *    surface (outlined chips, links). Same hue and saturation; lightness is stepped away
 *    from the surface until it reaches 4.5:1. A colour that already passes is returned
 *    untouched, so most brands render exactly as picked — only the light ones (yellow,
 *    sky blue, mint) are toned down.
 */

export const INK_DARK = '#121011'
export const INK_LIGHT = '#ffffff'
/** WCAG 2.1 AA for normal-size text. */
export const MIN_TEXT_CONTRAST = 4.5

type Rgb = [number, number, number]

/** `#rgb` or `#rrggbb`, case-insensitive. */
export function isValidHex(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}

function toRgb(hex: string): Rgb | null {
  if (!isValidHex(hex)) return null
  const raw = hex.trim().slice(1)
  const full = raw.length === 3 ? [...raw].map((c) => c + c).join('') : raw
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as Rgb
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

/** WCAG relative luminance, 0 (black) – 1 (white); null for anything that is not a hex colour. */
export function relativeLuminance(hex: string): number | null {
  const rgb = toRgb(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map((channel) => {
    const v = channel / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1 – 21; null if either colour is not a hex colour. */
export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  if (la === null || lb === null) return null
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Ink for text and icons on a brand-coloured fill. Falls back to white for invalid input. */
export function onBrand(brand: string): string {
  const dark = contrastRatio(brand, INK_DARK)
  const light = contrastRatio(brand, INK_LIGHT)
  if (dark === null || light === null) return INK_LIGHT
  return dark >= light ? INK_DARK : INK_LIGHT
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return [h / 6, s, l]
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t: number) => {
    const x = (t + 1) % 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255]
}

/**
 * The brand colour as text or a border on `surface`. Keeps hue and saturation and moves
 * lightness away from the surface (darker on a light surface, lighter on a dark one) in
 * 2% steps until the pair reaches `min`. Invalid input is returned unchanged.
 */
export function brandInk(brand: string, surface: string = INK_LIGHT, min: number = MIN_TEXT_CONTRAST): string {
  const rgb = toRgb(brand)
  const surfaceLum = relativeLuminance(surface)
  if (!rgb || surfaceLum === null) return brand
  if ((contrastRatio(brand, surface) ?? 0) >= min) return toHex(rgb)

  const [h, s, startL] = rgbToHsl(rgb)
  const step = surfaceLum > 0.5 ? -0.02 : 0.02
  let l = startL
  let candidate = toHex(rgb)
  // Lightness is clamped, so the walk ends at pure black or white at the latest.
  while (step < 0 ? l > 0 : l < 1) {
    l = Math.min(1, Math.max(0, l + step))
    candidate = toHex(hslToRgb(h, s, l))
    if ((contrastRatio(candidate, surface) ?? 0) >= min) break
  }
  return candidate
}
