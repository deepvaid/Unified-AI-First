#!/usr/bin/env node
/**
 * build-variable-plan.mjs — derives the Marobase Figma variable/style plan from tokens.json.
 *
 * Output: docs/design-system/figma/variable-plan.json (consumed by the use_figma build scripts)
 *         docs/design-system/figma/variable-map.md   (Figma name → tokens.json path → CSS name)
 *
 * Rules (see the approved plan, §3):
 *  - mirror the code's layering: alias to a primitive only where the resolved value IS a primitive
 *  - code syntax = the alias-layer name components consume (mp-theme-aliases.css), else the --mp-* name
 *  - every variable carries scopes and a description holding its tokens.json path
 *  - rendered values win over stale tokens (appbar 56, builder panels 220/300) and are logged as conflicts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const tokens = JSON.parse(fs.readFileSync(path.join(root, 'src/design-tokens/tokens.json'), 'utf8'))
const outDir = path.join(root, 'docs/design-system/figma')

const conflicts = []
const note = (msg) => conflicts.push(msg)

// ─── token access ────────────────────────────────────────────────────────────
function raw(p) {
  const v = p.split('.').reduce((o, k) => (o && k in o ? o[k] : undefined), tokens)
  if (v === undefined) return undefined
  return v && typeof v === 'object' && '$value' in v ? v.$value : v
}
/** Follow {ref} chains to the final raw value; returns { value, chain } */
function resolve(p) {
  const chain = [p]
  let v = raw(p)
  let guard = 0
  while (typeof v === 'string' && /^\{[^}]+\}$/.test(v) && guard++ < 10) {
    const ref = v.slice(1, -1)
    chain.push(ref)
    v = raw(ref)
  }
  return { value: v, chain }
}

// ─── colour helpers ──────────────────────────────────────────────────────────
const hex2 = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
/** Normalise any CSS colour string to #rrggbb or #rrggbbaa (lowercase) */
function toHex(str) {
  if (typeof str !== 'string') throw new Error(`not a colour: ${str}`)
  const s = str.trim()
  if (s.startsWith('#')) {
    const h = s.slice(1)
    if (h.length === 3) return '#' + h.split('').map((c) => c + c).join('').toLowerCase()
    return '#' + h.toLowerCase()
  }
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/)
  if (!m) throw new Error(`unparseable colour: ${str}`)
  const a = m[4] === undefined ? 1 : parseFloat(m[4])
  return '#' + hex2(+m[1]) + hex2(+m[2]) + hex2(+m[3]) + (a < 1 ? hex2(a * 255) : '')
}

// ─── Primitives (hidden) ─────────────────────────────────────────────────────
const primitives = []
for (const step of Object.keys(tokens.color.blue)) {
  if (step.startsWith('$')) continue
  primitives.push({ name: `blue/${step}`, hex: toHex(raw(`color.blue.${step}`)), path: `color.blue.${step}`, css: `--mp-color-blue-${step}` })
}
for (const step of Object.keys(tokens.color.neutral)) {
  if (step.startsWith('$') || step === 'hairline') continue
  primitives.push({ name: `neutral/${step}`, hex: toHex(raw(`color.neutral.${step}`)), path: `color.neutral.${step}`, css: `--mp-color-neutral-${step}` })
}
// graphite: the unnamed dark-theme hexes, promoted to a named ramp so Dark roles and the Dark nav skin share a source
const graphite = [
  ['950', '#17191C', 'color.dark.background'], ['900', '#1F2226', 'color.dark.surface'], ['850', '#24272C', 'color.dark.surfaceRaised'],
  ['800', '#272B30', 'color.dark.surfaceVariant'], ['700', '#32373E', 'color.dark.surfaceBright'], ['650', '#33373D', 'color.dark.borderSubtle'],
  ['600', '#3D4249', 'color.dark.border'], ['400', '#7C848F', 'color.dark.borderStrong'], ['300', '#8A9199', 'color.dark.textDisabled'],
]
for (const [step, hex, src] of graphite) {
  if (toHex(resolve(src).value) !== hex.toLowerCase()) note(`graphite/${step}: ${src} is no longer ${hex}`)
  primitives.push({ name: `graphite/${step}`, hex: hex.toLowerCase(), path: src, css: `--mp-color-dark-${src.split('.').pop()}`, derived: true })
}
const primByHex = new Map(primitives.map((p) => [p.hex, p.name]))

/** Colour value for one mode: alias to a primitive when the hex matches, else raw hex */
function colorValue(tokenPath, override) {
  const { value, chain } = override ? { value: override, chain: [tokenPath] } : resolve(tokenPath)
  if (value === undefined) return undefined
  const hex = toHex(value)
  const alias = hex.length === 7 ? primByHex.get(hex) : undefined
  return alias ? { alias, hex, via: chain } : { hex, via: chain }
}

// ─── Color collection (Light / Dark) ─────────────────────────────────────────
const S = {
  bg: ['FRAME_FILL', 'SHAPE_FILL'],
  text: ['TEXT_FILL'],
  icon: ['SHAPE_FILL', 'STROKE_COLOR'],
  stroke: ['STROKE_COLOR'],
  onColor: ['TEXT_FILL', 'SHAPE_FILL'],
  any: ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'],
  fillStroke: ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'],
  ring: ['STROKE_COLOR', 'EFFECT_COLOR'],
  effect: ['EFFECT_COLOR'],
}
const colorVars = []
/**
 * def(name, lightKey, darkKey, scopes, css, desc)
 *  lightKey/darkKey are keys under color.light / color.dark (or absolute paths starting with 'color.')
 *  darkKey === null → reuse the light key; a missing side falls back to the other and logs a conflict
 */
function def(name, lightKey, darkKey, scopes, css, desc = '') {
  const lp = lightKey.startsWith('color.') ? lightKey : `color.light.${lightKey}`
  const dk = darkKey === null ? lightKey : darkKey
  const dp = dk.startsWith('color.') ? dk : `color.dark.${dk}`
  let light = colorValue(lp)
  let dark = colorValue(dp)
  if (!light && !dark) throw new Error(`no value for ${name} (${lp} / ${dp})`)
  if (!light) { note(`${name}: no light token (${lp}); using dark value`); light = dark }
  if (!dark) { note(`${name}: no dark token (${dp}); using light value`); dark = light }
  const paths = [...new Set([lp, dp])].join(' · ')
  colorVars.push({ name, type: 'COLOR', scopes, codeSyntax: css ? `var(${css})` : undefined, description: `tokens.json: ${paths}${desc ? ' — ' + desc : ''}`, values: { Light: light, Dark: dark } })
}

// surface
def('surface/canvas', 'background', null, S.bg, '--surface-canvas', 'page background')
def('surface/primary', 'surface', null, S.bg, '--surface-primary', 'cards, sheets (= Vuetify surface)')
def('surface/secondary', 'surfaceVariant', null, S.bg, '--surface-secondary', 'tinted wells, hover fills')
def('surface/raised', 'surfaceRaised', null, S.bg, '--surface-raised', '= surfaceBright in light')
def('surface/overlay', 'surfaceOverlay', null, S.bg, '--surface-overlay', 'menus, dialogs, drawers')
def('surface/sunken', 'surfaceSunken', null, S.bg, '--surface-sunken', '= background in light')
def('surface/bright', 'surfaceBright', null, S.bg, '--mp-color-light-surfaceBright', 'Vuetify surface-bright / surface-light')
def('surface/tint', 'surfaceTint', null, S.bg, '--mp-surface-tint', 'selected-row tint')
// text / icon
def('text/primary', 'textPrimary', null, S.text, '--text-primary', '= on-surface, = Vuetify on-surface/on-background')
def('text/secondary', 'textSecondary', null, S.text, '--text-secondary', '= Vuetify on-surface-variant')
def('text/muted', 'textMuted', null, S.text, '--text-muted', '= on-surface-muted')
def('text/disabled', 'textDisabled', null, S.text, '--text-disabled')
def('icon/primary', 'iconPrimary', null, S.icon, '--icon-primary')
def('icon/secondary', 'iconSecondary', null, S.icon, '--icon-secondary')
def('icon/disabled', 'iconDisabled', null, S.icon, '--icon-disabled')
// border
def('border/subtle', 'borderSubtle', null, S.stroke, '--border-subtle', 'card and section hairlines')
def('border/default', 'border', null, S.stroke, '--border-default', '= Vuetify border / outline-variant')
def('border/strong', 'outline', 'borderStrong', S.stroke, '--border-strong', 'control boundaries (3:1); = Vuetify outline')
def('border/hover', 'border', 'borderHover', S.stroke, '--border-hover')
def('border/table-row', 'borderTableRow', null, S.stroke, '--mp-border-table-row')
def('border/table-header', 'borderTableHeader', null, S.stroke, '--mp-border-table-header')
def('border/table-footer', 'borderTableFooterDivider', null, S.stroke, '--mp-border-table-footer-divider')
def('border/divider-muted', 'borderDividerMuted', null, S.stroke, '--mp-color-light-borderDividerMuted')
// accent (cyan — the one accent; = Vuetify primary)
def('accent/default', 'accent.cyan.default', null, S.any, '--accent-default', '= Vuetify primary / info')
def('accent/hover', 'accent.cyan.hover', null, S.any, '--accent-hover', '= Vuetify primary-darken-1')
def('accent/active', 'accent.cyan.active', null, S.any, '--accent-active', '= --accent-ink')
def('accent/container', 'accent.cyan.container', null, S.bg, '--accent-container', '= Vuetify primary-container')
def('accent/on-accent', 'accent.cyan.onAccent', null, S.onColor, '--accent-on', '= Vuetify on-primary')
def('accent/on-container', 'accent.cyan.onContainer', null, S.onColor, '--accent-on-container', '= Vuetify on-primary-container')
def('accent/selected-bg', 'accent.cyan.selectedBackground', null, S.bg, '--accent-selected-bg', '= --surface-interactive-selected')
def('accent/subtle-bg', 'accent.cyan.subtleBackground', null, S.bg, '--accent-subtle-bg', '= --accent-soft')
def('accent/focus-ring', 'accent.cyan.focusRing', null, S.ring, '--focus-ring', '2px ring, 2px offset — code pins this to cyan for every preset (bug)')
// brand secondary (ink)
def('brand/secondary', 'secondary', null, S.any, '--mp-color-light-secondary', 'ink black; = Vuetify secondary')
def('brand/on-secondary', 'onSecondary', null, S.onColor, '--mp-color-light-onSecondary')
// status
const statusCss = { success: 'pos', error: 'neg', warning: 'warn' }
for (const s of ['success', 'warning', 'error']) {
  const c = statusCss[s]
  def(`status/${s}/default`, s, null, S.any, `--${c}`, `= Vuetify ${s}`)
  def(`status/${s}/container`, `${s}Container`, null, S.bg, `--${c}-soft`, `= Vuetify ${s}-container`)
  def(`status/${s}/on`, `on${s[0].toUpperCase()}${s.slice(1)}`, null, S.onColor, `--on-${c}`, `= Vuetify on-${s}`)
  def(`status/${s}/on-container`, `on${s[0].toUpperCase()}${s.slice(1)}Container`, null, S.onColor, `--${c}-ink`, `= Vuetify on-${s}-container`)
}
def('status/info/default', 'info', null, S.any, '--mp-color-light-info', '= Vuetify info (= accent in light)')
def('status/info/container', 'primaryContainer', 'infoContainer', S.bg, '--mp-color-dark-infoContainer', 'light has no infoContainer token — uses primaryContainer as code does')
def('status/info/on', 'onPrimary', 'onInfo', S.onColor, '--mp-color-dark-onInfo', 'light has no onInfo token — uses onPrimary')
def('status/info/on-container', 'onPrimaryContainer', 'onInfoContainer', S.onColor, '--mp-color-dark-onInfoContainer', 'light has no onInfoContainer token — uses onPrimaryContainer')
// interactive / disabled / scrim
def('interactive/default', 'interactiveDefault', null, S.bg, '--surface-interactive')
def('interactive/hover', 'interactiveHover', null, S.bg, '--surface-interactive-hover')
def('interactive/active', 'interactiveActive', null, S.bg, '--surface-interactive-active')
def('interactive/disabled', 'interactiveDisabled', null, S.bg, '--surface-interactive-disabled')
def('button/disabled', 'buttonDisabled', null, S.bg, '--button-disabled')
def('button/on-disabled', 'onButtonDisabled', null, S.onColor, '--on-button-disabled')
def('scrim', 'scrim', null, S.bg, '--scrim-overlay')
// ink panel
def('ink-panel/bg', 'inkPanel.bg', null, S.bg, '--ink-panel-bg', 'bulk bar, dark side cards')
def('ink-panel/fg', 'inkPanel.fg', null, S.onColor, '--ink-panel-fg')
def('ink-panel/muted-fg', 'inkPanel.mutedFg', null, S.onColor, '--ink-panel-muted-fg')
def('ink-panel/border', 'inkPanel.border', null, S.stroke, '--ink-panel-border')
def('ink-panel/accent', 'inkPanel.accent', null, S.fillStroke.concat('TEXT_FILL'), '--ink-panel-accent')
// AI (Da Vinci)
def('ai/soft', 'aiAccent.soft', null, S.bg, '--dv-accent-soft')
def('ai/muted', 'aiAccent.muted', null, S.bg, '--dv-muted')
def('ai/border', 'aiAccent.border', null, S.stroke, '--dv-border')
def('ai/text-primary', 'aiAccent.textPrimary', null, S.text, '--dv-text-primary')
def('ai/text-secondary', 'aiAccent.textSecondary', null, S.text, '--dv-text-secondary')
def('ai/on-accent', 'aiAccent.onAccent', null, S.onColor, '--dv-on-accent')
for (const [i, k] of ['From', 'Mid', 'To'].entries()) {
  const stop = ['from', 'mid', 'to'][i]
  def(`ai/gradient/${stop}`, `dv.grad${k}`, null, S.fillStroke, `--mp-color-light-dv-grad${k}`, 'stop of --dv-grad (135°: 0% / 52% / 100%) — identity gradient (orb, hero)')
  def(`ai/action-gradient/${stop}`, `aiAccent.actionGradient${k}`, null, S.fillStroke, `--mp-color-light-aiAccent-actionGradient${k}`, 'stop of --dv-action-gradient — AI action buttons')
}
def('ai/action-gradient/on', 'aiAccent.actionOnGradient', null, S.onColor, '--dv-action-on-gradient')
for (const i of [1, 2, 3]) {
  def(`ai/orb/${i}`, `dv.orbC${i}`, null, S.fillStroke, `--dv-orb-c${i}`, 'orb particle colour (WebGL uniform)')
  def(`ai/ring/${i}`, `dv.ringC${i}`, null, S.fillStroke, `--dv-ring-c${i}`)
}
// hue (module tiles) + cloud
for (const h of Object.keys(tokens.color.light.moduleTile).filter((k) => !k.startsWith('$'))) {
  def(`hue/${h}/accent`, `moduleTile.${h}.accent`, null, S.fillStroke, `--mp-color-light-moduleTile-${h}-accent`, 'category hue — no alias-layer name yet (flag --hue-* for code)')
  def(`hue/${h}/ink`, `moduleTile.${h}.ink`, null, S.onColor, `--mp-color-light-moduleTile-${h}-ink`)
}
for (const c of Object.keys(tokens.color.light.cloud).filter((k) => !k.startsWith('$'))) {
  def(`cloud/${c}/accent`, `cloud.${c}.accent`, null, S.fillStroke, `--cloud-${c}-accent`, 'source-cloud chip')
  def(`cloud/${c}/text`, `cloud.${c}.text`, null, S.onColor, `--cloud-${c}-text`)
}
// flow logic (journey builder logic nodes)
def('flow-logic/primary', 'flowLogic.primary', null, S.fillStroke, '--mp-color-light-flowLogic-primary', '= Vuetify flow-logic')
def('flow-logic/on-primary', 'flowLogic.onPrimary', null, S.onColor, '--mp-color-light-flowLogic-onPrimary')
def('flow-logic/container', 'flowLogic.container', null, S.bg, '--mp-color-light-flowLogic-container')
// chart (grayBlue = the shipping palette)
const chartScope = ['SHAPE_FILL', 'STROKE_COLOR']
for (let i = 1; i <= 6; i++) def(`chart/series/${i}`, `color.chart.light.grayBlue.series${i}`, `color.chart.dark.grayBlue.series${i}`, chartScope, `--mp-color-chart-light-grayBlue-series${i}`, 'grayBlue palette (app default)')
for (let i = 1; i <= 5; i++) def(`chart/axis/${i}`, `color.chart.light.grayBlue.axis${i}`, `color.chart.dark.grayBlue.axis${i}`, chartScope, `--mp-color-chart-light-grayBlue-axis${i}`)
for (const k of ['comparison', 'positive', 'negative', 'warning', 'neutral']) def(`chart/${k}`, `color.chart.light.grayBlue.${k}`, `color.chart.dark.grayBlue.${k}`, chartScope, `--mp-color-chart-light-grayBlue-${k}`)
def('chart/axis-label', 'color.chart.light.axisLabel', 'color.chart.dark.axisLabel', S.text, '--mp-color-chart-light-axisLabel')
def('chart/legend-label', 'color.chart.light.legendLabel', 'color.chart.dark.legendLabel', S.text, '--mp-color-chart-light-legendLabel')
def('chart/grid', 'color.chart.light.grid', 'color.chart.dark.grid', S.stroke, '--mp-color-chart-light-grid')
def('chart/tooltip/bg', 'color.chart.light.tooltipBackground', 'color.chart.dark.tooltipBackground', S.bg, '--mp-color-chart-light-tooltipBackground')
def('chart/tooltip/text', 'color.chart.light.tooltipText', 'color.chart.dark.tooltipText', S.text, '--mp-color-chart-light-tooltipText')
def('chart/tooltip/border', 'color.chart.light.tooltipBorder', 'color.chart.dark.tooltipBorder', S.stroke, '--mp-color-chart-light-tooltipBorder')
// shadow tints (bound into effect styles)
for (const lvl of ['sm', 'md', 'lg']) {
  const light = toHex(raw(`shadow.${lvl}`).color)
  const dark = toHex(raw(`shadow.dark.${lvl}`).match(/rgba?\([^)]+\)/)[0])
  colorVars.push({ name: `shadow/${lvl}`, type: 'COLOR', scopes: S.effect, codeSyntax: `var(--mp-shadow-${lvl})`, description: `tokens.json: shadow.${lvl} · shadow.dark.${lvl} — shadow tint only; geometry lives in the Effect Style`, values: { Light: { hex: light }, Dark: { hex: dark } } })
}

// ─── Nav Skin (Gray / White / Dark) ──────────────────────────────────────────
const tp = toHex(resolve('color.light.textPrimary').value).slice(1)
const alpha = (hex6, a) => `#${hex6}${hex2(a * 255)}`
const nav = (name, gray, white, dark, scopes, css, desc) => ({
  name, type: 'COLOR', scopes, codeSyntax: `var(${css})`, description: `sidebar-{gray,white,dark}.css ${css}${desc ? ' — ' + desc : ''}`,
  values: { Gray: colorValue('', gray), White: colorValue('', white), Dark: colorValue('', dark) },
})
const navVars = [
  nav('nav/surface', raw('color.light.navSurfaceGray'), raw('color.light.surface'), raw('color.dark.surface'), S.bg, '--sidebar-bg', 'gray = navSurfaceGray, white = surface, dark = dark surface'),
  nav('nav/border', raw('color.light.borderSubtle'), raw('color.light.borderSubtle'), raw('color.dark.borderSubtle'), S.stroke, '--sidebar-border'),
  nav('nav/divider', alpha(tp, 0.06), alpha(tp, 0.06), raw('color.dark.borderDividerMuted'), S.stroke, '--sidebar-line', 'light: text-primary @ 6%'),
  nav('nav/text', raw('color.light.textPrimary'), raw('color.light.textPrimary'), raw('color.dark.textPrimary'), S.onColor, '--sidebar-text'),
  nav('nav/text-muted', raw('color.light.textMuted'), raw('color.light.textMuted'), raw('color.dark.textMuted'), S.onColor, '--sidebar-muted'),
  nav('nav/hover', alpha(tp, 0.06), alpha(tp, 0.06), resolve('color.dark.interactiveHover').value, S.bg, '--sidebar-hover-bg', 'light: text-primary @ 6%'),
  nav('nav/active', alpha(tp, 0.1), alpha(tp, 0.1), raw('color.dark.accent.cyan.selectedBackground'), S.bg, '--sidebar-active-bg', 'light: text-primary @ 10%'),
  nav('nav/active-text', raw('color.light.textPrimary'), raw('color.light.textPrimary'), raw('color.dark.textPrimary'), S.onColor, '--sidebar-active-text'),
  nav('nav/focus-ring', alpha(tp, 0.55), alpha(tp, 0.55), raw('color.dark.accent.cyan.focusRing'), S.ring, '--sidebar-focus-ring', 'light: text-primary @ 55%'),
]

// ─── Dimensions (published, single mode) ─────────────────────────────────────
const px = (v) => (typeof v === 'number' ? v : parseFloat(String(v)))
const dims = []
const dim = (name, value, scopes, css, desc, alias) => dims.push({ name, type: 'FLOAT', scopes, codeSyntax: `var(${css})`, description: desc, values: { Value: alias ? { alias, number: value } : { number: value } } })
for (const k of Object.keys(tokens.space).filter((k) => !k.startsWith('$'))) dim(`space/${k}`, px(raw(`space.${k}`)), ['GAP'], `--mp-space-${k}`, `tokens.json: space.${k}`)
for (const k of Object.keys(tokens.radius).filter((k) => !k.startsWith('$') && k !== '20')) dim(`radius/${k}`, px(raw(`radius.${k}`)), ['CORNER_RADIUS'], `--mp-radius-${k}`, `tokens.json: radius.${k}${k === 'full' ? ' — pills, buttons' : ''}`)
note('radius.20 excluded (single use)')
dim('radius/surface', 16, ['CORNER_RADIUS'], '--r-card', 'tokens.json: component.card.radius = component.dialog.radius = radius.16 — the one outer-surface radius (cards, sections, dialogs, drawers)', 'radius/16')
dim('size/control/sm', 32, ['WIDTH_HEIGHT'], '--mp-component-field-height-sm', 'tokens.json: component.field.height.sm / segmented.height.sm — compact controls')
dim('size/control/md', 40, ['WIDTH_HEIGHT'], '--mp-component-control-height', 'tokens.json: component.control.height — buttons, fields, list rows, table header share this baseline')
dim('size/control/lg', 48, ['WIDTH_HEIGHT'], '--mp-component-field-height-lg', 'tokens.json: component.field.height.lg / table.rowMinHeight')
for (const k of Object.keys(tokens.fontSize).filter((k) => !k.startsWith('$'))) dim(`font-size/${k}`, px(raw(`fontSize.${k}`)), ['FONT_SIZE'], `--mp-fontSize-${k}`, `tokens.json: fontSize.${k}`)
// layout — rendered values win
const layout = [
  ['layout/sidebar', 'layout.sidebarWidth', 248], ['layout/rail', 'layout.sidebarRailWidth', 72], ['layout/appbar', 'layout.appbarHeight', 56],
  ['layout/section-rail', 'layout.sectionRailWidth', 260], ['layout/content-max', 'layout.contentMaxWidth', 1280], ['layout/detail-sidebar', 'layout.detailSidebarWidth', 340],
  ['layout/inbox-list', 'layout.inboxListWidth', 380], ['layout/builder-left', 'component.builder.panelWidth', 220], ['layout/builder-right', 'component.builder.panelWidth', 300],
]
for (const [name, p, rendered] of layout) {
  const tok = px(resolve(p).value)
  if (tok !== rendered) note(`${name}: token ${p} = ${tok} but the app renders ${rendered} — Figma uses ${rendered}`)
  dim(name, rendered, ['WIDTH_HEIGHT'], `--mp-${p.replace(/\./g, '-')}`, `tokens.json: ${p}${tok !== rendered ? ` (token ${tok}, rendered ${rendered} — code ticket)` : ''}`)
}
// component roles (the 40 that ripple)
const roles = [
  ['button/padding-inline', 'component.button.paddingInline', 'GAP'],
  ['chip/radius', 'component.chip.radius', 'CORNER_RADIUS'], ['chip/height-sm', 'component.chip.height.sm', 'WIDTH_HEIGHT'], ['chip/height-md', 'component.chip.height.md', 'WIDTH_HEIGHT'], ['chip/height-lg', 'component.chip.height.lg', 'WIDTH_HEIGHT'],
  ['input/radius', 'component.input.radius', 'CORNER_RADIUS'],
  ['menu/radius', 'component.menu.radius', 'CORNER_RADIUS'], ['menu/min-width', 'component.menu.minWidth', 'WIDTH_HEIGHT'], ['menu/item-height', 'component.menu.itemHeight', 'WIDTH_HEIGHT'],
  ['card/padding', 'component.card.padding', 'GAP'], ['card/padding-compact', 'component.card.paddingCompact', 'GAP'], ['card/padding-spacious', 'component.card.paddingSpacious', 'GAP'], ['card/gap', 'component.card.gap', 'GAP'], ['card/gap-compact', 'component.card.gapCompact', 'GAP'],
  ['dialog/width-sm', 'component.dialog.width.sm', 'WIDTH_HEIGHT'], ['dialog/width-md', 'component.dialog.width.md', 'WIDTH_HEIGHT'], ['dialog/width-lg', 'component.dialog.width.lg', 'WIDTH_HEIGHT'], ['dialog/header-min-height', 'component.dialog.headerMinHeight', 'WIDTH_HEIGHT'],
  ['drawer/width-sm', 'component.drawer.width.sm', 'WIDTH_HEIGHT'], ['drawer/width-md', 'component.drawer.width.md', 'WIDTH_HEIGHT'], ['drawer/width-lg', 'component.drawer.width.lg', 'WIDTH_HEIGHT'],
  ['list-item/padding-block', 'component.listItem.paddingBlock', 'GAP'], ['list-item/padding-inline', 'component.listItem.paddingInline', 'GAP'], ['list-item/gap', 'component.listItem.gap', 'GAP'],
  ['field/label-gap', 'component.field.labelGap', 'GAP'], ['field/group-gap', 'component.field.groupGap', 'GAP'], ['field/section-gap', 'component.field.sectionGap', 'GAP'],
  ['state/measure', 'component.state.measure', 'WIDTH_HEIGHT'], ['state/measure-wide', 'component.state.measureWide', 'WIDTH_HEIGHT'],
  ['table/row-min-height', 'component.table.rowMinHeight', 'WIDTH_HEIGHT'], ['table/cell-padding-inline', 'component.table.cellPaddingInline', 'GAP'], ['table/cell-padding-block', 'component.table.cellPaddingBlock', 'GAP'],
  ['toolbar/height', 'component.toolbar.minHeight', 'WIDTH_HEIGHT'],
  ['nav/item-radius', 'component.nav.itemRadius', 'CORNER_RADIUS'],
  ['widget/action-size', 'component.widget.actionSize', 'WIDTH_HEIGHT'],
  ['wizard/measure-sm', 'component.wizard.measure.sm', 'WIDTH_HEIGHT'], ['wizard/measure-md', 'component.wizard.measure.md', 'WIDTH_HEIGHT'], ['wizard/measure-lg', 'component.wizard.measure.lg', 'WIDTH_HEIGHT'],
  ['banner/min-height', 'component.banner.minHeight', 'WIDTH_HEIGHT'],
]
for (const [name, p, scope] of roles) {
  const { value, chain } = resolve(p)
  const ref = chain.length > 1 ? chain[1] : null // first hop
  let alias
  if (ref && /^space\./.test(ref)) alias = `space/${ref.split('.')[1]}`
  if (ref && /^radius\./.test(ref)) alias = `radius/${ref.split('.')[1]}`
  if (ref === 'component.control.height') alias = 'size/control/md'
  dim(name, px(value), [scope], `--mp-${p.replace(/\./g, '-')}`, `tokens.json: ${p}${alias ? ` = {${ref}}` : ''}`, alias)
}

// ─── Typography (STRING) ─────────────────────────────────────────────────────
const typo = [
  { name: 'font-family/base', type: 'STRING', scopes: ['FONT_FAMILY'], codeSyntax: 'var(--mp-fontFamily-base)', description: 'tokens.json: fontFamily.base — Inter', values: { Value: { string: 'Inter' } } },
  { name: 'font-family/mono', type: 'STRING', scopes: ['FONT_FAMILY'], codeSyntax: 'var(--mp-fontFamily-mono)', description: 'tokens.json: fontFamily.mono — JetBrains Mono (Figma: Fira Code, the declared fallback)', values: { Value: { string: 'Fira Code' } } },
]

// ─── Styles ──────────────────────────────────────────────────────────────────
const W = { 400: 'Regular', 450: 'Regular', 500: 'Medium', 550: 'Medium', 600: 'Semi Bold', 650: 'Semi Bold', 700: 'Bold', 750: 'Bold', 800: 'Extra Bold' }
const ts = (name, size, weight, lh, ls, extra = {}) => ({ name, family: extra.family || 'Inter', style: W[weight], size, lineHeightPct: lh, letterSpacingPct: ls, codeWeight: weight, fontSizeVar: `font-size/${size}`, ...extra })
const textStyles = [
  ts('Display/XL', 80, 800, 95, -3.5, { path: 'display.xl' }), ts('Display/LG', 60, 800, 100, -3, { path: 'display.lg' }),
  ts('Display/MD', 44, 700, 105, -2, { path: 'display.md', fontSizeVar: null }), ts('Display/SM', 32, 700, 110, -1, { path: 'display.sm' }),
  ts('Heading/Page Title', 28, 750, 115, -2, { path: 'text.pageTitle' }), ts('Heading/Page Subtitle', 15, 450, 150, 0, { path: 'text.pageSubtitle' }),
  ts('Heading/Section Title', 16, 650, 130, -1, { path: 'text.sectionTitle' }),
  ts('Data/KPI Value', 32, 700, 115, -2.5, { path: 'text.kpiValue' }), ts('Data/KPI Value Hero', 48, 800, 100, -3, { path: 'text.kpiValueHero' }),
  ts('Data/Meta Value', 14, 550, 140, 0, { path: 'text.metaValue' }),
  ts('Body/Regular', 14, 400, 157, 0, { path: 'fontSize.14 (Vuetify text-body-2)' }), ts('Body/Medium', 14, 500, 157, 0, { path: 'text.body' }),
  ts('Body/Label', 13, 500, 140, 0, { path: 'text.label' }), ts('Body/Caption', 12, 500, 140, 0, { path: 'text.caption' }),
  ts('Body/Eyebrow', 11, 600, 140, 6, { path: 'text.eyebrow (= text.metaLabel)', textCase: 'UPPER' }),
  ts('Component/Button', 14, 600, 100, 0, { path: 'component.button.typography' }),
  ts('Code/Mono', 13, 400, 150, 0, { path: 'fontFamily.mono', family: 'Fira Code' }),
]
const sh = (p) => { const s = raw(p); return { x: +s.x, y: +s.y, blur: +s.blur, spread: +s.spread } }
const shDark = (p) => { const m = raw(p).match(/(-?[\d.]+)(?:px)? (-?[\d.]+)(?:px)? (-?[\d.]+)(?:px)?(?: (-?[\d.]+)(?:px)?)? rgba/); return { x: +m[1], y: +m[2], blur: +m[3], spread: m[4] ? +m[4] : 0 } }
const effectStyles = [
  { name: 'Elevation/Light/Raised', ...sh('shadow.sm'), colorVar: 'shadow/sm', mode: 'Light', css: '--elevation-raised' },
  { name: 'Elevation/Light/Overlay', ...sh('shadow.md'), colorVar: 'shadow/md', mode: 'Light', css: '--elevation-overlay' },
  { name: 'Elevation/Light/Modal', ...sh('shadow.lg'), colorVar: 'shadow/lg', mode: 'Light', css: '--elevation-modal' },
  { name: 'Elevation/Dark/Raised', ...shDark('shadow.dark.sm'), colorVar: 'shadow/sm', mode: 'Dark', css: '--elevation-raised' },
  { name: 'Elevation/Dark/Overlay', ...shDark('shadow.dark.md'), colorVar: 'shadow/md', mode: 'Dark', css: '--elevation-overlay' },
  { name: 'Elevation/Dark/Modal', ...shDark('shadow.dark.lg'), colorVar: 'shadow/lg', mode: 'Dark', css: '--elevation-modal' },
  { name: 'Elevation/Button Inset', type: 'INNER_SHADOW', x: 0, y: 1, blur: 0, spread: 0, color: '#ffffff29', css: '--mp-shadow-buttonInset', note: 'light surfaces only' },
  { name: 'Glow/Da Vinci Mic', x: 0, y: 10, blur: 26, spread: 0, color: toHex(raw('shadow.dvOrbitMic').match(/rgba?\([^)]+\)/)[0]), css: '--dv-orbit-mic-shadow' },
]
const paintStyles = [
  { name: 'Gradient/Da Vinci Brand', angle: 135, stops: [['ai/gradient/from', 0], ['ai/gradient/mid', 0.52], ['ai/gradient/to', 1]], css: '--dv-grad' },
  { name: 'Gradient/Da Vinci Hero', angle: 90, stops: [['ai/gradient/from', 0], ['ai/gradient/mid', 0.5], ['ai/gradient/to', 1]], css: '--dv-hero-grad', note: 'dv.heroGrad* stops equal dv.grad* in light; dark differs — flagged' },
  { name: 'Gradient/Da Vinci Action', angle: 135, stops: [['ai/action-gradient/from', 0], ['ai/action-gradient/mid', 0.5], ['ai/action-gradient/to', 1]], css: '--dv-action-gradient' },
]
for (const k of ['From', 'Mid', 'To']) {
  const g = toHex(resolve(`color.light.dv.grad${k}`).value), h = toHex(resolve(`color.light.dv.heroGrad${k}`).value)
  const gd = toHex(resolve(`color.dark.dv.grad${k}`).value), hd = toHex(resolve(`color.dark.dv.heroGrad${k}`).value)
  if (g !== h || gd !== hd) note(`dv.grad${k} vs dv.heroGrad${k}: light ${g}/${h}, dark ${gd}/${hd} — Hero paint style reuses ai/gradient/* (light-identical); dark hero stops differ`)
}

// ─── emit ────────────────────────────────────────────────────────────────────
const plan = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'src/design-tokens/tokens.json',
  collections: [
    { name: 'Primitives', modes: ['Value'], hidden: true, variables: primitives.map((p) => ({ name: p.name, type: 'COLOR', scopes: [], codeSyntax: `var(${p.css})`, description: `tokens.json: ${p.path}${p.derived ? ' (graphite ramp derived from dark roles)' : ''}`, values: { Value: { hex: p.hex } } })) },
    { name: 'Color', modes: ['Light', 'Dark'], variables: colorVars },
    { name: 'Nav Skin', modes: ['Gray', 'White', 'Dark'], variables: navVars },
    { name: 'Dimensions', modes: ['Value'], variables: dims },
    { name: 'Typography', modes: ['Value'], variables: typo },
  ],
  textStyles, effectStyles, paintStyles, conflicts,
}
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'variable-plan.json'), JSON.stringify(plan, null, 2) + '\n')

// variable-map.md
const md = ['# Marobase — Figma variable map', '', `Generated ${plan.generatedAt} by \`scripts/figma/build-variable-plan.mjs\` from \`${plan.source}\`. Figma variable → code syntax → source token. Re-run the script after editing tokens.json.`, '']
for (const c of plan.collections) {
  md.push(`## ${c.name} — modes: ${c.modes.join(' / ')} — ${c.variables.length} variables${c.hidden ? ' (hidden from publishing)' : ''}`, '', '| Figma variable | Code | Source / notes | ' + c.modes.join(' | ') + ' |', '|---|---|---|' + c.modes.map(() => '---').join('|') + '|')
  for (const v of c.variables) {
    const cell = (val) => !val ? '—' : val.alias ? `→ ${val.alias}` : val.hex ?? (val.number !== undefined ? String(val.number) : val.string)
    md.push(`| \`${v.name}\` | \`${v.codeSyntax || ''}\` | ${v.description.replace(/\|/g, '/')} | ${c.modes.map((m) => cell(v.values[m])).join(' | ')} |`)
  }
  md.push('')
}
md.push('## Text styles', '', '| Style | Font | Size | Line height | Tracking | Code weight | Source |', '|---|---|---|---|---|---|---|')
for (const t of textStyles) md.push(`| ${t.name} | ${t.family} ${t.style} | ${t.size} | ${t.lineHeightPct}% | ${t.letterSpacingPct}% | ${t.codeWeight} | ${t.path} |`)
md.push('', '## Effect styles', '', '| Style | Geometry (x y blur spread) | Colour | Code |', '|---|---|---|---|')
for (const e of effectStyles) md.push(`| ${e.name} | ${e.x} ${e.y} ${e.blur} ${e.spread} | ${e.colorVar ? `→ ${e.colorVar} (${e.mode})` : e.color} | \`${e.css}\` |`)
md.push('', '## Paint styles', '', '| Style | Angle | Stops | Code |', '|---|---|---|---|')
for (const p of paintStyles) md.push(`| ${p.name} | ${p.angle}° | ${p.stops.map(([v, pos]) => `${v} @ ${pos * 100}%`).join(', ')} | \`${p.css}\` |`)
md.push('', '## Conflicts and notes recorded while generating', '', ...conflicts.map((c) => `- ${c}`), '')
fs.writeFileSync(path.join(outDir, 'variable-map.md'), md.join('\n'))

const total = plan.collections.reduce((n, c) => n + c.variables.length, 0)
console.log(plan.collections.map((c) => `${c.name.padEnd(12)} ${String(c.variables.length).padStart(4)}  modes: ${c.modes.join('/')}`).join('\n'))
console.log(`TOTAL variables ${total} · text styles ${textStyles.length} · effect styles ${effectStyles.length} · paint styles ${paintStyles.length}`)
console.log(`aliased colour values: ${colorVars.reduce((n, v) => n + Object.values(v.values).filter((x) => x.alias).length, 0)} / ${colorVars.length * 2}`)
console.log(`conflicts: ${conflicts.length}`)
for (const c of conflicts) console.log('  - ' + c)
