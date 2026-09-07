#!/usr/bin/env node
/**
 * build-icon-svgs.mjs — turns the Lucide icons the app actually uses into SVG strings for Figma.
 *
 *   node scripts/figma/build-icon-svgs.mjs            → docs/design-system/figma/icons-svg.json
 *
 * Input:  docs/design-system/figma/icons-used.json (names as used in templates)
 *         src/plugins/lucideIcons.ts alias map (app name → Lucide export), for renamed icons
 *         node_modules/lucide-vue-next/dist/esm/icons/<name>.js (node arrays)
 * Output: { icons: { [appName]: { lucide, svg } }, missing: string[] }
 * Icons are 24×24 viewBox, 2px stroke, round caps/joins — Lucide's canonical geometry.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const iconsDir = path.join(root, 'node_modules/lucide-vue-next/dist/esm/icons')
const used = JSON.parse(fs.readFileSync(path.join(root, 'docs/design-system/figma/icons-used.json'), 'utf8'))

// alias map from the app's icon bridge: kebab app-name → PascalCase Lucide export (or kebab)
const bridge = fs.readFileSync(path.join(root, 'src/plugins/lucideIcons.ts'), 'utf8')
const aliases = {}
for (const m of bridge.matchAll(/['"]([a-z0-9-]+)['"]\s*:\s*['"]?([A-Za-z0-9-]+)['"]?/g)) aliases[m[1]] = m[2]
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()

// known Lucide renames (fallback when the bridge has no alias)
const renames = {
  'bar-chart-2': 'chart-column', 'bar-chart-3': 'chart-column-big', 'file-plus-2': 'file-plus', 'file-question': 'file-question-mark',
  filter: 'funnel', 'filter-x': 'funnel-x', 'more-vertical': 'ellipsis-vertical', 'pie-chart': 'chart-pie', 'play-circle': 'circle-play',
  'playlist-check': 'list-checks', 'scatter-chart': 'chart-scatter', 'shield-question': 'shield-question-mark', 'wand-2': 'wand-sparkles',
}

function resolveFile(name) {
  const candidates = [name, aliases[name] && kebab(aliases[name]), renames[name]].filter(Boolean)
  for (const c of candidates) if (fs.existsSync(path.join(iconsDir, `${c}.js`))) return c
  return null
}
function toSvg(file) {
  const src = fs.readFileSync(path.join(iconsDir, `${file}.js`), 'utf8')
  const m = src.match(/createLucideIcon\("[^"]+",\s*(\[[\s\S]*?\])\s*\);/)
  if (!m) throw new Error(`no node array in ${file}`)
  // the array is valid JS but not JSON (unquoted keys) — evaluate it safely
  const nodes = Function(`"use strict"; return (${m[1]})`)()
  const body = nodes
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
}

const icons = {}, missing = []
for (const name of used) {
  if (name === 'icon') continue // template binding artefact, not an icon
  const file = resolveFile(name)
  if (!file) { missing.push(name); continue }
  icons[name] = { lucide: file, svg: toSvg(file) }
}
const out = path.join(root, 'docs/design-system/figma/icons-svg.json')
fs.writeFileSync(out, JSON.stringify({ count: Object.keys(icons).length, missing, icons }, null, 0) + '\n')
console.log(`${Object.keys(icons).length} icons → ${path.relative(root, out)}; renamed via bridge/renames: ${Object.entries(icons).filter(([n, v]) => n !== v.lucide).map(([n, v]) => `${n}→${v.lucide}`).join(', ') || 'none'}; missing: ${missing.join(', ') || 'none'}`)
