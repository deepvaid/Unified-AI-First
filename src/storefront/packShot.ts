// Placeholder product photography: an SVG pack shot drawn from the product's name
// and the store's palette, returned as a data URI an <img> can show. Deterministic,
// offline, and never a real brand's image. A store picks its shape (its blueprint's
// `packShot`): a supplements store draws a can, a clothing store a garment on a hanger.

export type PackShape = 'can' | 'bag' | 'box' | 'strips' | 'garment'
export type PackView = 'front' | 'angle'

export interface PackShotInput {
  name: string
  /** One line under the name, e.g. the flavour or "Refill". */
  caption?: string
  shape: PackShape
  /** The pack's colour (the store's brand colour). */
  ink: string
  /** The label and backdrop tint. */
  surface: string
  /** A stripe of colour that tells products apart. */
  accent: string
  view?: PackView
}

interface PackGeometry {
  /** Left edge and width of the pack's face, for the accent stripe. */
  x: number
  width: number
  stripeY: number
  /** Baseline of the first line of the name. */
  textTop: number
  /** The name is written on the pack in the backdrop's colour, or under it in the pack's ('ink'). */
  textFill?: 'surface' | 'ink'
  /** A shadow under the pack, for one that stands; a garment hangs. */
  shadow?: boolean
  body: (ink: string) => string
}

/** Each pack drawn inside a 400×400 box. */
const PACKS: Record<PackShape, PackGeometry> = {
  can: {
    x: 128, width: 144, stripeY: 286, textTop: 204,
    body: (ink) => `<rect x="128" y="96" width="144" height="232" rx="22" fill="${ink}"/><rect x="120" y="78" width="160" height="30" rx="10" fill="${ink}" opacity="0.82"/>`,
  },
  bag: {
    x: 108, width: 184, stripeY: 286, textTop: 204,
    body: (ink) => `<path d="M118 112 L282 112 L296 316 Q296 332 280 332 L120 332 Q104 332 104 316 Z" fill="${ink}"/><rect x="118" y="92" width="164" height="22" rx="4" fill="${ink}" opacity="0.82"/>`,
  },
  box: {
    x: 112, width: 176, stripeY: 286, textTop: 204,
    body: (ink) => `<rect x="112" y="104" width="176" height="224" rx="12" fill="${ink}"/>`,
  },
  strips: {
    x: 96, width: 208, stripeY: 262, textTop: 214,
    body: (ink) => `<rect x="96" y="138" width="208" height="150" rx="14" fill="${ink}"/><rect x="96" y="138" width="208" height="34" rx="14" fill="${ink}" opacity="0.82"/>`,
  },
  // A plain tee on a hanger, with no print: the name hangs under it, like a tag.
  garment: {
    x: 140, width: 120, stripeY: 286, textTop: 344, textFill: 'ink', shadow: false,
    body: (ink) => `<path d="M200 108 L200 72 Q200 58 213 58 Q226 58 226 70" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><path d="M172 94 L126 110 L84 154 L112 190 L140 172 L140 292 Q140 300 148 300 L252 300 Q260 300 260 292 L260 172 L288 190 L316 154 L274 110 L228 94 Q200 124 172 94 Z" fill="${ink}"/>`,
  },
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Splits a name over two lines when it is too long for the label. */
function labelLines(name: string): string[] {
  const words = name.toUpperCase().split(/\s+/)
  if (name.length <= 11 || words.length === 1) return [name.toUpperCase()]
  const half = Math.ceil(words.length / 2)
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')]
}

export function packShotSvg(input: PackShotInput): string {
  const { name, caption, shape, ink, surface, accent, view = 'front' } = input
  const geo = PACKS[shape]
  const label = labelLines(name)
  const longest = Math.max(...label.map((l) => l.length))
  const size = Math.max(13, Math.min(24, Math.floor(150 / longest)))
  const lineHeight = size + 4
  const text = label
    .map((line, i) => `<text x="200" y="${geo.textTop + i * lineHeight}" font-size="${size}" font-weight="700" letter-spacing="1.5">${escapeXml(line)}</text>`)
    .join('')
  const sub = caption
    ? `<text x="200" y="${geo.textTop + label.length * lineHeight + 4}" font-size="12" letter-spacing="0.6" opacity="0.8">${escapeXml(caption)}</text>`
    : ''
  const textFill = geo.textFill === 'ink' ? ink : surface
  const pack = `<g>${geo.body(ink)}<rect x="${geo.x}" y="${geo.stripeY}" width="${geo.width}" height="10" fill="${accent}"/><g fill="${textFill}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif">${text}${sub}</g></g>`
  const shadow = geo.shadow === false
    ? { front: '', angle: '' }
    : { front: `<ellipse cx="200" cy="344" rx="104" ry="10" fill="${ink}" opacity="0.08"/>`, angle: `<ellipse cx="214" cy="348" rx="112" ry="11" fill="${ink}" opacity="0.1"/>` }
  // The second image tilts the pack on a tinted backdrop, so a hover swap is visible.
  const scene = view === 'front'
    ? `<rect width="400" height="400" fill="${surface}"/>${shadow.front}${pack}`
    : `<rect width="400" height="400" fill="${surface}"/><rect width="400" height="400" fill="${accent}" opacity="0.18"/>${shadow.angle}<g transform="rotate(-9 200 210)">${pack}</g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${scene}</svg>`
}

/** The pack shot as an image URL. */
export function packShot(input: PackShotInput): string {
  return `data:image/svg+xml,${encodeURIComponent(packShotSvg(input))}`
}
