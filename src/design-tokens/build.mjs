/**
 * Zero-dependency design token generator for Maropost.
 *
 * Reads tokens.json and generates:
 *   generated/_variables.scss   — SCSS variables
 *   generated/variables.css     — CSS custom properties
 *   generated/tokens.ts         — TypeScript constants
 *
 * Usage:
 *   node src/design-tokens/build.mjs          # one-shot
 *   node src/design-tokens/build.mjs --watch  # watch mode
 */

import { readFileSync, writeFileSync, mkdirSync, watch } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOKENS_PATH = resolve(__dirname, 'tokens.json')
const OUT_DIR = resolve(__dirname, 'generated')

// ── Convert shadow object to CSS shorthand ─────────────────────────────────
function shadowToCSS(val) {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object' && 'x' in val && 'y' in val) {
    const x = typeof val.x === 'number' ? `${val.x}px` : (val.x === '0' ? '0' : `${val.x}px`)
    const y = typeof val.y === 'number' ? `${val.y}px` : (val.y === '0' ? '0' : `${val.y}px`)
    const blur = typeof val.blur === 'number' ? `${val.blur}px` : `${val.blur}px`
    const spread = typeof val.spread === 'number' ? `${val.spread}px` : (val.spread === '0' ? '0' : `${val.spread}px`)
    return `${x} ${y} ${blur} ${spread} ${val.color}`
  }
  return String(val)
}

// ── Flatten nested token object into path→value pairs ──────────────────────
function flatten(obj, prefix = []) {
  const result = []
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue // skip meta keys
    if (val && typeof val === 'object' && '$value' in val) {
      // Convert shadow objects to CSS shorthand for generated output
      const outputValue = val.$type === 'shadow' ? shadowToCSS(val.$value) : val.$value
      result.push({ path: [...prefix, key], value: outputValue, rawValue: val.$value, type: val.$type || 'unknown' })
    } else if (val && typeof val === 'object') {
      result.push(...flatten(val, [...prefix, key]))
    }
  }
  return result
}

// ── Generators ─────────────────────────────────────────────────────────────
function toScssName(path) {
  return '$mp-' + path.join('-')
}

function toCssName(path) {
  return '--mp-' + path.join('-')
}

function toTsName(path) {
  return 'mp_' + path.map(p => p.replace(/-/g, '_')).join('_')
}

function parseAlias(value) {
  if (typeof value !== 'string') return null
  const match = value.match(/^\{([^}]+)\}$/)
  if (!match) return null
  return match[1].split('.')
}

function createTokenIndex(tokens) {
  const index = new Map()
  for (const token of tokens) {
    index.set(token.path.join('.'), token)
  }
  return index
}

function resolveAliasValue(token, tokenIndex, stack = new Set()) {
  const key = token.path.join('.')
  if (stack.has(key)) {
    throw new Error(`Circular token reference detected: ${[...stack, key].join(' -> ')}`)
  }

  const aliasPath = parseAlias(token.value)
  if (!aliasPath) return token.value

  const aliasKey = aliasPath.join('.')
  const targetToken = tokenIndex.get(aliasKey)
  if (!targetToken) {
    throw new Error(`Unknown token reference: {${aliasKey}} in ${key}`)
  }

  stack.add(key)
  const resolved = resolveAliasValue(targetToken, tokenIndex, stack)
  stack.delete(key)
  return resolved
}

function generateScss(tokens) {
  const header = '// Auto-generated from tokens.json — do not edit\n\n'
  const lines = tokens.map(t => {
    const aliasPath = parseAlias(t.value)
    const value = aliasPath ? toScssName(aliasPath) : t.value
    return `${toScssName(t.path)}: ${value};`
  })
  return header + lines.join('\n') + '\n'
}

function generateCss(tokens) {
  const header = '/* Auto-generated from tokens.json — do not edit */\n\n:root {\n'
  const lines = tokens.map(t => {
    const aliasPath = parseAlias(t.value)
    const value = aliasPath ? `var(${toCssName(aliasPath)})` : t.value
    return `  ${toCssName(t.path)}: ${value};`
  })
  return header + lines.join('\n') + '\n}\n'
}

function generateTs(tokens) {
  const tokenIndex = createTokenIndex(tokens)
  const header = '// Auto-generated from tokens.json — do not edit\n\n'
  const lines = tokens.map(t => {
    const resolvedValue = resolveAliasValue(t, tokenIndex)
    if (typeof resolvedValue === 'number') {
      return `export const ${toTsName(t.path)} = ${resolvedValue}`
    }
    // Escape single quotes inside values, or use backticks for safety
    const escaped = String(resolvedValue).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
    return `export const ${toTsName(t.path)} = \`${escaped}\``
  })
  return header + lines.join('\n') + '\n'
}

// ── Tokens Studio JSON (for Figma sync) ───────────────────────────────────

// Remap alias references from tokens.json paths to Tokens Studio paths.
// In tokens.json the hierarchy is e.g. typography.fontSize.body, but in the
// Tokens Studio output fontSize sits directly under the "global" set.
function remapAlias(value) {
  if (typeof value !== 'string') return value
  return value.replace(/\{([^}]+)\}/g, (_match, path) => {
    const rewrite = path
      .replace(/^typography\./, '')       // {typography.fontSize.X} → {fontSize.X}
    return `{${rewrite}}`
  })
}

function generateTokensStudio(raw) {
  const out = { global: {} }

  // Spacing
  if (raw.spacing) {
    out.global.spacing = {}
    for (const [key, val] of Object.entries(raw.spacing)) {
      if (key.startsWith('$')) continue
      out.global.spacing[key] = { value: val.$value, type: 'spacing', description: `spacing.${key}` }
    }
  }

  // Border radius
  if (raw.borderRadius) {
    out.global.borderRadius = {}
    for (const [key, val] of Object.entries(raw.borderRadius)) {
      if (key.startsWith('$')) continue
      out.global.borderRadius[key] = { value: val.$value, type: 'borderRadius', description: `borderRadius.${key}` }
    }
  }

  // Shadows
  if (raw.shadow) {
    out.global.boxShadow = {}
    for (const [key, val] of Object.entries(raw.shadow)) {
      if (key.startsWith('$')) continue
      out.global.boxShadow[key] = { value: val.$value, type: 'boxShadow', description: `shadow.${key}` }
    }
  }

  // Colors — separate token sets for Light, Dark, Sidebar (Supernova-compatible)
  // Recurse into nested groups (aiAccent, daVinci, aiMetric) with dotted keys for Figma.
  function addColorTokens(group, theme, prefix, targetSet) {
    for (const [key, val] of Object.entries(group)) {
      if (key.startsWith('$')) continue
      const tokenKey = prefix ? `${prefix}.${key}` : key
      if (val && typeof val === 'object' && '$value' in val) {
        targetSet[tokenKey] = {
          value: remapAlias(val.$value),
          type: 'color',
          description: `color.${theme}.${tokenKey}`,
        }
      } else if (val && typeof val === 'object') {
        addColorTokens(val, theme, tokenKey, targetSet)
      }
    }
  }

  const colorSetMap = { light: 'Colors/Light', dark: 'Colors/Dark', sidebar: 'Colors/Sidebar' }
  for (const theme of ['light', 'dark', 'sidebar']) {
    if (!raw.color?.[theme]) continue
    const setName = colorSetMap[theme]
    out[setName] = {}
    addColorTokens(raw.color[theme], theme, '', out[setName])
  }

  // Typography — font sizes, weights, line heights
  if (raw.typography?.fontSize) {
    out.global.fontSize = {}
    for (const [key, val] of Object.entries(raw.typography.fontSize)) {
      if (key.startsWith('$')) continue
      out.global.fontSize[key] = { value: val.$value, type: 'fontSizes', description: `typography.fontSize.${key}` }
    }
  }
  if (raw.typography?.fontWeight) {
    out.global.fontWeight = {}
    for (const [key, val] of Object.entries(raw.typography.fontWeight)) {
      if (key.startsWith('$')) continue
      out.global.fontWeight[key] = { value: val.$value, type: 'fontWeights', description: `typography.fontWeight.${key}` }
    }
  }
  if (raw.typography?.lineHeight) {
    out.global.lineHeight = {}
    for (const [key, val] of Object.entries(raw.typography.lineHeight)) {
      if (key.startsWith('$')) continue
      out.global.lineHeight[key] = { value: val.$value, type: 'lineHeights', description: `typography.lineHeight.${key}` }
    }
  }
  if (raw.typography?.fontFamily) {
    out.global.fontFamily = {}
    for (const [key, val] of Object.entries(raw.typography.fontFamily)) {
      if (key.startsWith('$')) continue
      out.global.fontFamily[key] = { value: val.$value, type: 'fontFamilies', description: `typography.fontFamily.${key}` }
    }
  }

  // Component tokens — button + card radii
  if (raw.component?.button?.radius) {
    out.global['component-button-radius'] = {}
    for (const [key, val] of Object.entries(raw.component.button.radius)) {
      if (key.startsWith('$')) continue
      out.global['component-button-radius'][key] = {
        value: val.$value,
        type: 'borderRadius',
        description: `component.button.radius.${key}`
      }
    }
  }
  if (raw.component?.button?.typography) {
    out.global['component-button-typography'] = {}
    for (const [key, val] of Object.entries(raw.component.button.typography)) {
      if (key.startsWith('$')) continue
      const type =
        key === 'fontSize' ? 'fontSizes'
        : key === 'fontWeight' ? 'fontWeights'
        : 'typography'
      out.global['component-button-typography'][key] = {
        value: remapAlias(val.$value),
        type,
        description: `component.button.typography.${key}`
      }
    }
  }
  if (raw.component?.input?.radius) {
    out.global['component-input-radius'] = {}
    for (const [key, val] of Object.entries(raw.component.input.radius)) {
      if (key.startsWith('$')) continue
      out.global['component-input-radius'][key] = {
        value: remapAlias(val.$value),
        type: 'borderRadius',
        description: `component.input.radius.${key}`
      }
    }
  }
  if (raw.component?.card?.radius) {
    out.global['component-card-radius'] = {}
    for (const [key, val] of Object.entries(raw.component.card.radius)) {
      if (key.startsWith('$')) continue
      out.global['component-card-radius'][key] = {
        value: val.$value,
        type: 'borderRadius',
        description: `component.card.radius.${key}`
      }
    }
  }

  // Layout
  if (raw.layout) {
    out.global.layout = {}
    for (const [key, val] of Object.entries(raw.layout)) {
      if (key.startsWith('$')) continue
      out.global.layout[key] = { value: val.$value, type: 'sizing', description: `layout.${key}` }
    }
  }

  // Tokens Studio metadata — list all token sets for Supernova mapping
  out.$themes = [
    {
      id: 'maropost-light',
      name: 'Light',
      group: 'Maropost',
      selectedTokenSets: {
        'global': 'enabled',
        'Colors/Light': 'enabled',
      }
    },
    {
      id: 'maropost-dark',
      name: 'Dark',
      group: 'Maropost',
      selectedTokenSets: {
        'global': 'enabled',
        'Colors/Dark': 'enabled',
      }
    }
  ]
  out.$metadata = {
    tokenSetOrder: [
      'global',
      'Colors/Light',
      'Colors/Dark',
      'Colors/Sidebar',
    ]
  }

  return out
}

// ── Build ──────────────────────────────────────────────────────────────────
function build({ pushToFigma = false } = {}) {
  const raw = JSON.parse(readFileSync(TOKENS_PATH, 'utf-8'))
  const tokens = flatten(raw)

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(resolve(OUT_DIR, '_variables.scss'), generateScss(tokens))
  writeFileSync(resolve(OUT_DIR, 'variables.css'), generateCss(tokens))
  writeFileSync(resolve(OUT_DIR, 'tokens.ts'), generateTs(tokens))

  console.log(`✓ Generated ${tokens.length} tokens → ${OUT_DIR}/`)

  // Only write tokens-studio.json when explicitly pushing to Figma.
  // During a sync-from-figma run we must NOT overwrite this file — it is the
  // source written by Tokens Studio and overwriting it would erase Figma's changes.
  if (pushToFigma) {
    const FIGMA_EXPORT_DIR = resolve(__dirname, '../../design-kit/figma-export')
    mkdirSync(FIGMA_EXPORT_DIR, { recursive: true })
    const tokensStudio = generateTokensStudio(raw)
    writeFileSync(resolve(FIGMA_EXPORT_DIR, 'tokens-studio.json'), JSON.stringify(tokensStudio, null, 2))
    console.log(`✓ Synced tokens-studio.json → ${FIGMA_EXPORT_DIR}/`)
  }
}

// ── Entry ──────────────────────────────────────────────────────────────────
const pushToFigma = process.argv.includes('--push-figma')
build({ pushToFigma })

if (process.argv.includes('--watch')) {
  console.log('Watching tokens.json for changes…')
  let debounce = null
  watch(TOKENS_PATH, { persistent: true }, () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => {
      console.log('tokens.json changed — rebuilding…')
      try { build({ pushToFigma }) } catch (e) { console.error(e) }
    }, 200)
  })
}
