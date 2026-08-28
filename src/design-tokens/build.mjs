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
  const tokenIndex = createTokenIndex(tokens)
  const header = '// Auto-generated from tokens.json — do not edit\n\n'
  // Emit literals rather than $a: $b references. Sass resolves variables in
  // source order, and an alias can point at a token that sorts after it.
  const lines = tokens.map(t => `${toScssName(t.path)}: ${resolveAliasValue(t, tokenIndex)};`)
  return header + lines.join('\n') + '\n'
}

function hexToRgb(value) {
  if (typeof value !== 'string') return null
  const match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!match) return null
  const hex = match[1].length === 3
    ? match[1].split('').map(char => char + char).join('')
    : match[1]
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16)).join(', ')
}

function generateCss(tokens) {
  const tokenIndex = createTokenIndex(tokens)
  const header = '/* Auto-generated from tokens.json — do not edit */\n\n:root {\n'
  const lines = tokens.flatMap(t => {
    const aliasPath = parseAlias(t.value)
    const value = aliasPath ? `var(${toCssName(aliasPath)})` : t.value
    const declarations = [`  ${toCssName(t.path)}: ${value};`]
    const rgb = t.type === 'color' ? hexToRgb(resolveAliasValue(t, tokenIndex)) : null
    if (rgb) declarations.push(`  --mp-rgb-${t.path.join('-')}: ${rgb};`)
    return declarations
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

// Token group names in tokens.json and in the Tokens Studio "global" set are kept
// identical (space, radius, fontSize, …) so `{alias}` references need no rewriting.

function generateTokensStudio(raw) {
  const out = { global: {} }

  // Spacing
  if (raw.space) {
    out.global.space = {}
    for (const [key, val] of Object.entries(raw.space)) {
      if (key.startsWith('$')) continue
      out.global.space[key] = { value: val.$value, type: 'spacing', description: `space.${key}` }
    }
  }

  // Border radius
  if (raw.radius) {
    out.global.radius = {}
    for (const [key, val] of Object.entries(raw.radius)) {
      if (key.startsWith('$')) continue
      out.global.radius[key] = { value: val.$value, type: 'borderRadius', description: `radius.${key}` }
    }
  }

  // Shadows
  if (raw.shadow) {
    out.global.boxShadow = {}
    function addShadowTokens(group, prefix = '') {
      for (const [key, val] of Object.entries(group)) {
        if (key.startsWith('$')) continue
        const tokenKey = prefix ? `${prefix}.${key}` : key
        if (val && typeof val === 'object' && '$value' in val) {
          out.global.boxShadow[tokenKey] = {
            value: val.$value,
            type: 'boxShadow',
            description: `shadow.${tokenKey}`,
          }
        } else if (val && typeof val === 'object') {
          addShadowTokens(val, tokenKey)
        }
      }
    }
    addShadowTokens(raw.shadow)
  }

  // Colors — separate token sets for Light, Dark, Sidebar (Supernova-compatible)
  // Recurse into nested groups (aiAccent, daVinci, aiMetric) with dotted keys for Figma.
  function addColorTokens(group, theme, prefix, targetSet) {
    for (const [key, val] of Object.entries(group)) {
      if (key.startsWith('$')) continue
      const tokenKey = prefix ? `${prefix}.${key}` : key
      if (val && typeof val === 'object' && '$value' in val) {
        targetSet[tokenKey] = {
          value: (val.$value),
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
  if (raw.fontSize) {
    out.global.fontSize = {}
    for (const [key, val] of Object.entries(raw.fontSize)) {
      if (key.startsWith('$')) continue
      out.global.fontSize[key] = { value: val.$value, type: 'fontSizes', description: `fontSize.${key}` }
    }
  }
  if (raw.fontWeight) {
    out.global.fontWeight = {}
    for (const [key, val] of Object.entries(raw.fontWeight)) {
      if (key.startsWith('$')) continue
      out.global.fontWeight[key] = { value: val.$value, type: 'fontWeights', description: `fontWeight.${key}` }
    }
  }
  if (raw.lineHeight) {
    out.global.lineHeight = {}
    for (const [key, val] of Object.entries(raw.lineHeight)) {
      if (key.startsWith('$')) continue
      out.global.lineHeight[key] = { value: val.$value, type: 'lineHeights', description: `lineHeight.${key}` }
    }
  }
  if (raw.fontFamily) {
    out.global.fontFamily = {}
    for (const [key, val] of Object.entries(raw.fontFamily)) {
      if (key.startsWith('$')) continue
      out.global.fontFamily[key] = { value: val.$value, type: 'fontFamilies', description: `fontFamily.${key}` }
    }
  }

  // Component role tokens — every radius is a single leaf alias into radius.*
  out.global['component-radius'] = {}
  for (const name of ['button', 'chip', 'input', 'menu', 'card', 'dialog']) {
    const val = raw.component?.[name]?.radius
    if (!val) continue
    out.global['component-radius'][name] = {
      value: val.$value,
      type: 'borderRadius',
      description: `component.${name}.radius`,
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
        value: (val.$value),
        type,
        description: `component.button.typography.${key}`
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
