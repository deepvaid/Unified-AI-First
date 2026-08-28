#!/usr/bin/env node
/**
 * WCAG 2.1 contrast checker for the Marobase token pairs.
 * ------------------------------------------------------
 * Zero-dependency. Reads `src/design-tokens/tokens.json`, resolves `{alias}`
 * references, composites any translucent value over its host surface, and
 * computes the contrast ratio for every pair declared in the file's
 * `$contrastPairs` manifest.
 *
 * Thresholds (WCAG 2.1):
 *   text            4.5:1  — body text (1.4.3)
 *   largeText       3.0:1  — >=24px, or >=19px bold (1.4.3)
 *   ui              3.0:1  — icons, focus rings, other essential non-text (1.4.11)
 *   disabled        —      reported only; 1.4.3 exempts disabled controls
 *   decorative      —      reported only; hairlines/dividers are outside 1.4.11's
 *                          "required to identify a component" scope
 *   controlBoundary 3.0:1  — reported + flagged; enforcing changes visual design,
 *                          so it is surfaced for a design decision, not auto-fixed
 *
 * Chart series ramps, decorative gradients and orb canvas colors are NOT
 * checked: they are data-viz/brand color, not text or essential UI. Chart
 * axis/legend/tooltip pairs ARE checked — those carry text.
 *
 * Usage:
 *   node scripts/check-contrast.mjs
 *   node scripts/check-contrast.mjs --json
 *   node scripts/check-contrast.mjs --theme dark
 *
 * Exit code 1 if any enforced pair fails.
 */

import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOKENS_PATH = resolve(__dirname, '../src/design-tokens/tokens.json')

const argv = process.argv.slice(2)
const wantJson = argv.includes('--json')
const themeFlagIndex = argv.indexOf('--theme')
const themeFilter = themeFlagIndex !== -1 ? argv[themeFlagIndex + 1] : null

const THRESHOLDS = { text: 4.5, largeText: 3, ui: 3, disabled: 0, decorative: 0, controlBoundary: 3 }

/** Levels that are measured and reported but never fail the build. */
const REPORT_ONLY = new Set(['disabled', 'decorative'])
/**
 * Levels measured, reported, and surfaced for a human decision instead of failing.
 *
 * Empty since P5.5-12: `controlBoundary` was the only member, and once the design
 * owner approved raising `outline` it became enforced like any other 3:1 pair, so
 * the fix cannot silently regress. Re-add a level here only for a pair that is
 * genuinely a pending design decision.
 */
const FLAGGED = new Set()

// ── Token access ───────────────────────────────────────────────────────────
const raw = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'))

function tokenAt(path) {
  let node = raw
  for (const part of path.split('.')) {
    if (!node || typeof node !== 'object' || !(part in node)) return undefined
    node = node[part]
  }
  return node && typeof node === 'object' && '$value' in node ? node.$value : undefined
}

/** Resolve `{a.b.c}` alias chains down to a literal color string. */
function resolveValue(path, seen = new Set()) {
  if (seen.has(path)) throw new Error(`Circular token reference: ${[...seen, path].join(' -> ')}`)
  const value = tokenAt(path)
  if (value === undefined) throw new Error(`Unknown token: ${path}`)
  const alias = typeof value === 'string' && value.match(/^\{([^}]+)\}$/)
  if (!alias) return value
  seen.add(path)
  return resolveValue(alias[1], seen)
}

// ── Color parsing ──────────────────────────────────────────────────────────
/** Returns { r, g, b, a } with channels 0-255 and alpha 0-1. */
function parseColor(value, path) {
  const input = String(value).trim()

  const hex = input.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)
  if (hex) {
    const h = hex[1]
    const expand = (s) => s.split('').map((c) => c + c).join('')
    const full = h.length <= 4 ? expand(h) : h
    const channel = (i) => parseInt(full.slice(i * 2, i * 2 + 2), 16)
    return {
      r: channel(0),
      g: channel(1),
      b: channel(2),
      a: full.length === 8 ? channel(3) / 255 : 1,
    }
  }

  const rgb = input.match(/^rgba?\(([^)]+)\)$/i)
  if (rgb) {
    const parts = rgb[1].split(/[,/]/).map((p) => p.trim()).filter(Boolean)
    const num = (p) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p))
    return {
      r: num(parts[0]),
      g: num(parts[1]),
      b: num(parts[2]),
      a: parts[3] === undefined ? 1 : (parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])),
    }
  }

  throw new Error(`Cannot parse color "${input}"${path ? ` (${path})` : ''}`)
}

/** Composite a possibly-translucent foreground over an opaque backdrop. */
function composite(fg, bg) {
  if (fg.a >= 1) return { ...fg, a: 1 }
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  }
}

function toHex({ r, g, b }) {
  const c = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

// ── WCAG 2.1 relative luminance + contrast ratio ───────────────────────────
function relativeLuminance({ r, g, b }) {
  const channel = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The opaque page behind a translucent surface. Scrims and low-alpha washes
 * composite onto the theme canvas, so that is the honest backdrop.
 */
function canvasFor(surfacePath) {
  const theme = surfacePath.startsWith('color.dark') ? 'dark' : 'light'
  return parseColor(resolveValue(`color.${theme}.background`), 'canvas')
}

// ── Evaluate ───────────────────────────────────────────────────────────────
const pairs = raw.$contrastPairs ?? []
if (!Array.isArray(pairs) || pairs.length === 0) {
  console.error('No $contrastPairs manifest found in tokens.json.')
  process.exit(1)
}

const results = pairs
  .filter((pair) => {
    if (!themeFilter) return true
    return pair.surface.includes(`.${themeFilter}.`) || pair.foreground.includes(`.${themeFilter}.`)
  })
  .map((pair) => {
    const surfaceRaw = parseColor(resolveValue(pair.surface), pair.surface)
    const surface = composite(surfaceRaw, canvasFor(pair.surface))
    const foreground = composite(parseColor(resolveValue(pair.foreground), pair.foreground), surface)
    const ratio = contrastRatio(foreground, surface)
    const required = THRESHOLDS[pair.level] ?? THRESHOLDS.text
    return {
      surface: pair.surface,
      foreground: pair.foreground,
      level: pair.level,
      note: pair.note,
      surfaceHex: toHex(surface),
      foregroundHex: toHex(foreground),
      ratio: Math.round(ratio * 100) / 100,
      required,
      meets: ratio >= required,
      enforced: !REPORT_ONLY.has(pair.level) && !FLAGGED.has(pair.level),
      flagged: FLAGGED.has(pair.level) && ratio < required,
      reportOnly: REPORT_ONLY.has(pair.level),
    }
  })

const failures = results.filter((r) => r.enforced && !r.meets)
const flagged = results.filter((r) => r.flagged)

if (wantJson) {
  console.log(JSON.stringify({ total: results.length, failures: failures.length, flagged: flagged.length, results }, null, 2))
  process.exit(failures.length > 0 ? 1 : 0)
}

// ── Table output ───────────────────────────────────────────────────────────
const strip = (s) => s.replace(/^color\./, '')
const widths = {
  pair: Math.max(...results.map((r) => `${strip(r.surface)} × ${strip(r.foreground)}`.length), 4),
  level: Math.max(...results.map((r) => r.level.length), 5),
}
const pad = (s, n) => String(s).padEnd(n)
const padStart = (s, n) => String(s).padStart(n)

console.log('')
console.log('WCAG 2.1 contrast — Marobase token pairs')
console.log('text 4.5:1 · largeText/ui/controlBoundary 3:1 · disabled + decorative reported only')
console.log('')
console.log(
  `${pad('SURFACE × FOREGROUND', widths.pair)}  ${pad('LEVEL', widths.level)}  ${padStart('RATIO', 7)}  ${padStart('NEED', 5)}  RESULT`,
)
console.log('-'.repeat(widths.pair + widths.level + 30))

let lastGroup = null
for (const r of results) {
  const group = r.surface.split('.')[1]
  if (group !== lastGroup) {
    if (lastGroup !== null) console.log('')
    lastGroup = group
  }
  const verdict = r.reportOnly
    ? (r.meets ? 'pass (not enforced)' : 'below (not enforced)')
    : r.flagged
      ? 'FLAG'
      : r.meets ? 'PASS' : 'FAIL'
  console.log(
    `${pad(`${strip(r.surface)} × ${strip(r.foreground)}`, widths.pair)}  ${pad(r.level, widths.level)}  ${padStart(r.ratio.toFixed(2), 7)}  ${padStart(r.required || '—', 5)}  ${verdict}`,
  )
}

const enforcedCount = results.filter((r) => r.enforced).length
console.log('')
console.log(
  `${results.length} pairs checked · ${enforcedCount} enforced, ${enforcedCount - failures.length} pass, ${failures.length} fail · ` +
  `${flagged.length} flagged for a design decision · ${results.filter((r) => r.reportOnly).length} reported only`,
)

if (flagged.length > 0) {
  console.log('')
  console.log('FLAGGED — below threshold, needs a design decision (not auto-fixed)')
  for (const f of flagged) {
    console.log(`  ${strip(f.surface)} (${f.surfaceHex}) × ${strip(f.foreground)} (${f.foregroundHex}) — ${f.ratio.toFixed(2)}:1, 1.4.11 wants ${f.required}:1`)
  }
  if (flagged[0].note) console.log(`\n  ${flagged[0].note}`)
}

if (failures.length > 0) {
  console.log('')
  console.log('FAILURES')
  for (const f of failures) {
    console.log(`  ${strip(f.surface)} (${f.surfaceHex}) × ${strip(f.foreground)} (${f.foregroundHex}) — ${f.ratio.toFixed(2)}:1, needs ${f.required}:1`)
  }
  process.exit(1)
}
