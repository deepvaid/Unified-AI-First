/**
 * Maropost Design Kit — Figma Plugin (code.js)
 *
 * Runs inside Figma via the Plugin API.
 * Loaded by: Plugins → Development → Import from manifest → figma-plugin/manifest.json
 *
 * Three actions (triggered from ui.html):
 *   create-color-styles   → Creates ~50 Paint styles under Colors/Light/*, Colors/Dark/*, Colors/Sidebar/*
 *   create-text-styles    → Creates 32 Text styles under Typography/*
 *   create-component-frames → Creates 9 annotated spec frames on a "Components" page
 *   log-node-ids          → Sends frame nodeIds back to UI
 *   import-variables      → Creates 64 local Variables across 6 collections (Colors, Spacing, etc.)
 */

figma.showUI(__html__, { width: 256, height: 500 })

// ── Inline token data (mirrors src/design-tokens/tokens.json) ────────────────
const TOKENS = {
  color: {
    light: {
      background:       { r: 0.9765, g: 0.9804, b: 0.9843, a: 1 }, // #F9FAFB
      surface:          { r: 1,      g: 1,      b: 1,      a: 1 }, // #FFFFFF
      surfaceVariant:   { r: 0.9529, g: 0.9569, b: 0.9647, a: 1 }, // #F3F4F6
      onSurfaceVariant: { r: 0.4196, g: 0.4471, b: 0.5020, a: 1 }, // #6B7280
      primary:          { r: 0.1020, g: 0.3373, b: 0.8588, a: 1 }, // #1A56DB
      primaryDarken:    { r: 0.0784, g: 0.2784, b: 0.7216, a: 1 }, // #1447B8
      secondary:        { r: 0.4941, g: 0.2275, b: 0.9490, a: 1 }, // #7E3AF2
      secondaryDarken:  { r: 0.4000, g: 0.1529, b: 0.8000, a: 1 }, // #6627CC
      success:          { r: 0.0549, g: 0.6235, b: 0.4314, a: 1 }, // #0E9F6E
      successDarken:    { r: 0.0196, g: 0.4784, b: 0.3333, a: 1 }, // #057A55
      warning:          { r: 0.8510, g: 0.4667, b: 0.0235, a: 1 }, // #D97706
      warningDarken:    { r: 0.7059, g: 0.3255, b: 0.0353, a: 1 }, // #B45309
      error:            { r: 0.8784, g: 0.1412, b: 0.1412, a: 1 }, // #E02424
      errorDarken:      { r: 0.7843, g: 0.1176, b: 0.1176, a: 1 }, // #C81E1E
      info:             { r: 0.1020, g: 0.3373, b: 0.8588, a: 1 }, // #1A56DB
      onPrimary:        { r: 1,      g: 1,      b: 1,      a: 1 }, // #FFFFFF
      onSecondary:      { r: 1,      g: 1,      b: 1,      a: 1 }, // #FFFFFF
      onSuccess:        { r: 1,      g: 1,      b: 1,      a: 1 }, // #FFFFFF
      onError:          { r: 1,      g: 1,      b: 1,      a: 1 }, // #FFFFFF
      onWarning:        { r: 1,      g: 1,      b: 1,      a: 1 }, // #FFFFFF
      border:           { r: 0.8980, g: 0.9059, b: 0.9216, a: 1 }, // #E5E7EB
      textPrimary:      { r: 0.0667, g: 0.0980, b: 0.1569, a: 1 }, // #111928
      textMuted:        { r: 0.4196, g: 0.4471, b: 0.5020, a: 1 }, // #6B7280
    },
    dark: {
      background:       { r: 0.0667, g: 0.0980, b: 0.1569, a: 1 }, // #111928
      surface:          { r: 0.1216, g: 0.1608, b: 0.2157, a: 1 }, // #1F2937
      surfaceVariant:   { r: 0.2157, g: 0.2549, b: 0.3176, a: 1 }, // #374151
      onSurfaceVariant: { r: 0.6118, g: 0.6392, b: 0.6863, a: 1 }, // #9CA3AF
      primary:          { r: 0.3765, g: 0.6471, b: 0.9804, a: 1 }, // #60A5FA
      primaryDarken:    { r: 0.2314, g: 0.5098, b: 0.9647, a: 1 }, // #3B82F6
      secondary:        { r: 0.6549, g: 0.5451, b: 0.9804, a: 1 }, // #A78BFA
      secondaryDarken:  { r: 0.5451, g: 0.3608, b: 0.9647, a: 1 }, // #8B5CF6
      success:          { r: 0.2039, g: 0.8275, b: 0.6000, a: 1 }, // #34D399
      warning:          { r: 0.9843, g: 0.7490, b: 0.1412, a: 1 }, // #FBBF24
      error:            { r: 0.9725, g: 0.4431, b: 0.4431, a: 1 }, // #F87171
      info:             { r: 0.3765, g: 0.6471, b: 0.9804, a: 1 }, // #60A5FA
      onPrimary:        { r: 0.0667, g: 0.0980, b: 0.1569, a: 1 }, // #111928
      border:           { r: 0.2157, g: 0.2549, b: 0.3176, a: 1 }, // #374151
      textPrimary:      { r: 0.9765, g: 0.9804, b: 0.9843, a: 1 }, // #F9FAFB
      textMuted:        { r: 0.6118, g: 0.6392, b: 0.6863, a: 1 }, // #9CA3AF
    },
    sidebar: {
      bg:        { r: 0.0667, g: 0.0980, b: 0.1569, a: 1.00 }, // #111928
      surface:   { r: 0.1216, g: 0.1608, b: 0.2157, a: 1.00 }, // #1F2937
      border:    { r: 1,      g: 1,      b: 1,      a: 0.07 }, // rgba(255,255,255,0.07)
      text:      { r: 1,      g: 1,      b: 1,      a: 0.75 }, // rgba(255,255,255,0.75)
      textMuted: { r: 1,      g: 1,      b: 1,      a: 0.50 }, // rgba(255,255,255,0.5)
      textFaint: { r: 1,      g: 1,      b: 1,      a: 0.30 }, // rgba(255,255,255,0.3)
      hover:     { r: 1,      g: 1,      b: 1,      a: 0.05 }, // rgba(255,255,255,0.05)
    },
  },
  typography: {
    fontSize: { xs: 11, sm: 12, body: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36 },
    fontWeight: { Regular: 400, Medium: 500, 'Semi Bold': 600, Bold: 700 },
    lineHeight: 1.5,
  },
}

// Component definitions for spec frames
const COMPONENTS = [
  {
    name: 'MpPageHeader',
    description: 'Page title, breadcrumbs, and action slot. Used at the top of every page.',
    props: [
      { name: 'title',       type: 'string',   default: 'required', note: 'Page title text' },
      { name: 'subtitle',    type: 'string?',  default: '—',        note: 'Secondary label below title' },
      { name: 'breadcrumbs', type: '{ title, to?, disabled? }[]', default: '[]', note: 'Breadcrumb trail' },
    ],
    slots: ['#actions — right-side buttons', '#tabs — filter tabs below title'],
  },
  {
    name: 'MpKpiCard',
    description: 'KPI metric card with optional trend indicator. Always in a 4-column row.',
    props: [
      { name: 'label',         type: 'string',  default: 'required', note: 'Metric label' },
      { name: 'value',         type: 'string | number', default: 'required', note: 'Metric value' },
      { name: 'icon',          type: 'string?', default: '—',        note: 'MDI icon name' },
      { name: 'color',         type: 'string?', default: 'primary',  note: 'Vuetify color name' },
      { name: 'trend',         type: 'string?', default: '—',        note: 'e.g. "+12%" trend label' },
      { name: 'trendPositive', type: 'boolean', default: 'true',     note: 'Green vs red trend color' },
      { name: 'subStat',       type: 'string?', default: '—',        note: 'Secondary stat below value' },
    ],
    slots: [],
  },
  {
    name: 'MpStatusChip',
    description: 'Polymorphic status badge. Color mapping is automatic based on type + status.',
    props: [
      { name: 'status',   type: 'string',   default: 'required', note: 'Status text, e.g. "Paid", "Shipped"' },
      { name: 'type',     type: "'order'|'fulfillment'|'payment'|'campaign'|'contact'|'ticket'|'coupon'|'general'", default: 'required', note: 'Determines color map' },
      { name: 'size',     type: 'string?',  default: 'small',    note: 'Chip size' },
      { name: 'variant',  type: 'string?',  default: 'tonal',    note: 'Vuetify chip variant' },
      { name: 'showIcon', type: 'boolean',  default: 'true',     note: 'Show leading icon dot' },
    ],
    slots: [],
  },
  {
    name: 'MpDataTableToolbar',
    description: 'Search + filter + action toolbar. Always placed above v-data-table.',
    props: [
      { name: 'searchPlaceholder', type: 'string?', default: 'Search…', note: 'Input placeholder text' },
      { name: 'v-model:search',    type: 'string',  default: '',         note: 'Bound search string (debounced 300ms)' },
    ],
    slots: ['#filters — filter chips / dropdowns', '#actions — right-side action buttons'],
  },
  {
    name: 'MpEmptyState',
    description: 'Empty state with icon and optional CTA. Every table/list MUST include one.',
    props: [
      { name: 'icon',        type: 'string?', default: 'mdi-inbox-outline', note: 'MDI icon name' },
      { name: 'title',       type: 'string',  default: 'required',          note: 'Primary message' },
      { name: 'description', type: 'string?', default: '—',                 note: 'Secondary body text' },
      { name: 'actionLabel', type: 'string?', default: '—',                 note: 'CTA button label' },
      { name: 'actionIcon',  type: 'string?', default: '—',                 note: 'CTA button icon' },
    ],
    slots: [],
    emits: ['@action'],
  },
  {
    name: 'MpFilterTabs',
    description: 'Tab-based filtering above data tables (e.g. All / Completed / Processing).',
    props: [
      { name: 'tabs',      type: '{ label, key, count? }[]', default: 'required', note: 'Tab definitions' },
      { name: 'v-model',   type: 'string',                   default: '',          note: 'Active tab key' },
    ],
    slots: [],
  },
  {
    name: 'MpFloatingBulkBar',
    description: 'Floating bulk action bar. Auto-hides when count = 0.',
    props: [
      { name: 'count', type: 'number', default: 'required', note: 'Number of selected rows' },
    ],
    slots: ['default — action buttons (e.g. Delete, Export)'],
    emits: ['@clear'],
  },
  {
    name: 'MpFormDrawer',
    description: 'Right-side form drawer (480px). Never use v-dialog for forms.',
    props: [
      { name: 'title',    type: 'string',  default: 'required', note: 'Drawer heading' },
      { name: 'subtitle', type: 'string?', default: '—',        note: 'Sub-heading text' },
      { name: 'width',    type: 'number?', default: '480',      note: 'Drawer width in px' },
      { name: 'v-model',  type: 'boolean', default: 'false',    note: 'Open/close state' },
    ],
    slots: ['default — form fields', '#footer — Cancel + Save buttons'],
  },
  {
    name: 'MpSectionHeader',
    description: 'Section heading inside cards on dashboards.',
    props: [
      { name: 'title', type: 'string', default: 'required', note: 'Section title' },
    ],
    slots: ['#actions — right-side button or link'],
  },
]

// Track created frame node IDs
const componentFrameIds = {}

// ── Helpers ──────────────────────────────────────────────────────────────────

function send(type, payload) {
  figma.ui.postMessage(Object.assign({ type: type }, payload || {}))
}

function log(text, level = '') {
  send('log', { text, level })
  console.log(text)
}

/** Find or create a page by name */
async function getOrCreatePage(name) {
  let page = figma.root.children.find((p) => p.name === name)
  if (!page) {
    page = figma.createPage()
    page.name = name
  }
  return page
}

/** Create or reuse a Paint style */
async function upsertPaintStyle(name, rgba) {
  const all = await figma.getLocalPaintStylesAsync()
  const existing = all.find(function(s) { return s.name === name })
  const style = existing || figma.createPaintStyle()
  style.name = name
  style.paints = [{ type: 'SOLID', color: { r: rgba.r, g: rgba.g, b: rgba.b }, opacity: rgba.a }]
  return style
}

/** Create or reuse a Text style */
async function upsertTextStyle(name, fontSize, fontStyle, lineHeight) {
  await figma.loadFontAsync({ family: 'Inter', style: fontStyle })
  const all = await figma.getLocalTextStylesAsync()
  const existing = all.find(function(s) { return s.name === name })
  const style = existing || figma.createTextStyle()
  style.name = name
  style.fontSize = fontSize
  style.fontName = { family: 'Inter', style: fontStyle }
  style.lineHeight = { unit: 'MULTIPLIER', value: lineHeight }
  return style
}

// ── Action: Create Color Styles ───────────────────────────────────────────────

async function createColorStyles() {
  let count = 0

  // Light theme
  for (const [key, rgba] of Object.entries(TOKENS.color.light)) {
    const styleName = `Colors/Light/${key}`
    await upsertPaintStyle(styleName, rgba)
    count++
    log(`  ${styleName}`)
  }

  // Dark theme
  for (const [key, rgba] of Object.entries(TOKENS.color.dark)) {
    const styleName = `Colors/Dark/${key}`
    await upsertPaintStyle(styleName, rgba)
    count++
    log(`  ${styleName}`)
  }

  // Sidebar
  for (const [key, rgba] of Object.entries(TOKENS.color.sidebar)) {
    const styleName = `Colors/Sidebar/${key}`
    await upsertPaintStyle(styleName, rgba)
    count++
    log(`  ${styleName}`)
  }

  send('done', { action: `Created ${count} color styles` })
}

// ── Action: Create Text Styles ────────────────────────────────────────────────

async function createTextStyles() {
  // Font weight key → Inter style name mapping
  const weightToStyle = {
    Regular:      'Regular',
    Medium:       'Medium',
    'Semi Bold':  'SemiBold',
    Bold:         'Bold',
  }

  let count = 0
  for (const [sizeKey, sizePx] of Object.entries(TOKENS.typography.fontSize)) {
    for (const [weightKey, weightToStyleKey] of Object.entries(weightToStyle)) {
      const styleName = `Typography/${sizeKey}/${weightKey}`
      try {
        await upsertTextStyle(styleName, sizePx, weightToStyleKey, TOKENS.typography.lineHeight)
        count++
        log(`  ${styleName}`)
      } catch {
        log(`  ⚠ Could not load Inter ${weightToStyleKey} — skipping ${styleName}`, 'error')
      }
    }
  }

  send('done', { action: `Created ${count} text styles` })
}

// ── Action: Create Component Frames ──────────────────────────────────────────

async function createComponentFrames() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  await figma.loadFontAsync({ family: 'Inter', style: 'SemiBold' })
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' })

  const page = await getOrCreatePage('Components')
  await figma.setCurrentPageAsync(page)

  const FRAME_W = 800
  const COL_GAP = 40
  const ROW_GAP = 40
  const COLS = 2
  let col = 0
  let row = 0
  let prevRowMaxH = 0
  let rowHeights = []

  const frames = []

  for (let i = 0; i < COMPONENTS.length; i++) {
    const comp = COMPONENTS[i]
    const frame = buildComponentFrame(comp)

    const x = col * (FRAME_W + COL_GAP)
    const y = rowHeights.slice(0, row).reduce((a, b) => a + b + ROW_GAP, 0)
    frame.x = x
    frame.y = y

    page.appendChild(frame)
    componentFrameIds[comp.name] = frame.id
    frames.push(frame)
    log(`  Created frame: ${comp.name} (nodeId: ${frame.id})`)

    prevRowMaxH = Math.max(prevRowMaxH, frame.height)

    col++
    if (col >= COLS) {
      rowHeights.push(prevRowMaxH)
      prevRowMaxH = 0
      col = 0
      row++
    }
  }

  send('done', { action: `Created ${frames.length} component frames on "Components" page` })
  send('node-ids', { ids: componentFrameIds })
}

/** Build a single annotated spec frame for a component */
function buildComponentFrame(comp) {
  const FRAME_W = 800
  const PAD = 24
  const ROW_H = 28
  const LINE_GAP = 8

  const frame = figma.createFrame()
  frame.name = comp.name
  frame.resize(FRAME_W, 400) // initial height, will be adjusted
  frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]
  frame.cornerRadius = 12
  frame.strokes = [{ type: 'SOLID', color: { r: 0.8980, g: 0.9059, b: 0.9216 } }]
  frame.strokeWeight = 1

  let curY = PAD

  // Component name heading
  const titleText = figma.createText()
  titleText.fontName = { family: 'Inter', style: 'Bold' }
  titleText.fontSize = 20
  titleText.characters = comp.name
  titleText.fills = [{ type: 'SOLID', color: { r: 0.0667, g: 0.0980, b: 0.1569 } }]
  titleText.resize(FRAME_W - PAD * 2, titleText.height)
  titleText.x = PAD
  titleText.y = curY
  frame.appendChild(titleText)
  curY += titleText.height + LINE_GAP

  // Description
  const descText = figma.createText()
  descText.fontName = { family: 'Inter', style: 'Regular' }
  descText.fontSize = 13
  descText.characters = comp.description
  descText.fills = [{ type: 'SOLID', color: { r: 0.4196, g: 0.4471, b: 0.5020 } }]
  descText.textAutoResize = 'HEIGHT'
  descText.resize(FRAME_W - PAD * 2, descText.height)
  descText.x = PAD
  descText.y = curY
  frame.appendChild(descText)
  curY += descText.height + 20

  // Props section header
  const propHeader = figma.createText()
  propHeader.fontName = { family: 'Inter', style: 'SemiBold' }
  propHeader.fontSize = 11
  propHeader.characters = 'PROPS'
  propHeader.fills = [{ type: 'SOLID', color: { r: 0.1020, g: 0.3373, b: 0.8588 } }]
  propHeader.letterSpacing = { unit: 'PERCENT', value: 5 }
  propHeader.x = PAD
  propHeader.y = curY
  frame.appendChild(propHeader)
  curY += propHeader.height + 8

  // Props table rows
  const colWidths = [180, 240, 100, FRAME_W - PAD * 2 - 180 - 240 - 100 - 12]
  const headers = ['Prop', 'Type', 'Default', 'Notes']
  const rows = [headers, ...comp.props.map((p) => [p.name, p.type, p.default, p.note || ''])]

  rows.forEach((row, rowIdx) => {
    let colX = PAD
    const isTH = rowIdx === 0
    row.forEach((cell, colIdx) => {
      const t = figma.createText()
      t.fontName = { family: 'Inter', style: isTH ? 'Medium' : 'Regular' }
      t.fontSize = isTH ? 11 : 12
      t.characters = String(cell)
      t.fills = [{ type: 'SOLID', color: isTH
        ? { r: 0.2157, g: 0.2549, b: 0.3176 }
        : { r: 0.0667, g: 0.0980, b: 0.1569 } }]
      t.textAutoResize = 'HEIGHT'
      t.resize(colWidths[colIdx] - 6, t.height)
      t.x = colX
      t.y = curY
      frame.appendChild(t)
      colX += colWidths[colIdx]
    })
    curY += ROW_H
  })

  // Slots section (if any)
  if (comp.slots && comp.slots.length > 0) {
    curY += 16

    const slotHeader = figma.createText()
    slotHeader.fontName = { family: 'Inter', style: 'SemiBold' }
    slotHeader.fontSize = 11
    slotHeader.characters = 'SLOTS'
    slotHeader.fills = [{ type: 'SOLID', color: { r: 0.4941, g: 0.2275, b: 0.9490 } }]
    slotHeader.letterSpacing = { unit: 'PERCENT', value: 5 }
    slotHeader.x = PAD
    slotHeader.y = curY
    frame.appendChild(slotHeader)
    curY += slotHeader.height + 8

    comp.slots.forEach((slot) => {
      const t = figma.createText()
      t.fontName = { family: 'Inter', style: 'Regular' }
      t.fontSize = 12
      t.characters = slot
      t.fills = [{ type: 'SOLID', color: { r: 0.0667, g: 0.0980, b: 0.1569 } }]
      t.textAutoResize = 'HEIGHT'
      t.resize(FRAME_W - PAD * 2, t.height)
      t.x = PAD
      t.y = curY
      frame.appendChild(t)
      curY += t.height + 6
    })
  }

  // Emits section (if any)
  if (comp.emits && comp.emits.length > 0) {
    curY += 16

    const emitHeader = figma.createText()
    emitHeader.fontName = { family: 'Inter', style: 'SemiBold' }
    emitHeader.fontSize = 11
    emitHeader.characters = 'EMITS'
    emitHeader.fills = [{ type: 'SOLID', color: { r: 0.0549, g: 0.6235, b: 0.4314 } }]
    emitHeader.letterSpacing = { unit: 'PERCENT', value: 5 }
    emitHeader.x = PAD
    emitHeader.y = curY
    frame.appendChild(emitHeader)
    curY += emitHeader.height + 8

    comp.emits.forEach((emit) => {
      const t = figma.createText()
      t.fontName = { family: 'Inter', style: 'Regular' }
      t.fontSize = 12
      t.characters = emit
      t.fills = [{ type: 'SOLID', color: { r: 0.0667, g: 0.0980, b: 0.1569 } }]
      t.textAutoResize = 'HEIGHT'
      t.resize(FRAME_W - PAD * 2, t.height)
      t.x = PAD
      t.y = curY
      frame.appendChild(t)
      curY += t.height + 6
    })
  }

  // Resize frame to content
  frame.resize(FRAME_W, curY + PAD)

  return frame
}

// ── Action: Log Node IDs ──────────────────────────────────────────────────────

function logNodeIds() {
  if (Object.keys(componentFrameIds).length === 0) {
    send('log', { text: 'No frames created yet. Run "Create Component Frames" first.', level: 'error' })
    return
  }
  send('node-ids', { ids: componentFrameIds })
}

// ── Action: Import Variables ──────────────────────────────────────────────────
// Creates 64 local Variables across 6 collections from figma-variables.json data

const VAR_COLLECTIONS = [
  { name: 'Colors', modes: ['Light', 'Dark'] },
  { name: 'Colors/Sidebar', modes: ['Default'] },
  { name: 'Spacing', modes: ['Default'] },
  { name: 'Border Radius', modes: ['Default'] },
  { name: 'Typography', modes: ['Default'] },
  { name: 'Layout', modes: ['Default'] },
]

const VAR_DEFINITIONS = [
  // ── Colors (Light + Dark) ──────────────────────────────────────────────────
  { col: 'Colors', name: 'Colors/background', type: 'COLOR', vals: { Light: { r: 0.9765, g: 0.9804, b: 0.9843, a: 1 }, Dark: { r: 0.0667, g: 0.098, b: 0.1569, a: 1 } } },
  { col: 'Colors', name: 'Colors/surface', type: 'COLOR', vals: { Light: { r: 1, g: 1, b: 1, a: 1 }, Dark: { r: 0.1216, g: 0.1608, b: 0.2157, a: 1 } } },
  { col: 'Colors', name: 'Colors/surfaceVariant', type: 'COLOR', vals: { Light: { r: 0.9529, g: 0.9569, b: 0.9647, a: 1 }, Dark: { r: 0.2157, g: 0.2549, b: 0.3176, a: 1 } } },
  { col: 'Colors', name: 'Colors/onSurfaceVariant', type: 'COLOR', vals: { Light: { r: 0.4196, g: 0.4471, b: 0.502, a: 1 }, Dark: { r: 0.6118, g: 0.6392, b: 0.6863, a: 1 } } },
  { col: 'Colors', name: 'Colors/primary', type: 'COLOR', vals: { Light: { r: 0.102, g: 0.3373, b: 0.8588, a: 1 }, Dark: { r: 0.3765, g: 0.6471, b: 0.9804, a: 1 } } },
  { col: 'Colors', name: 'Colors/primaryDarken', type: 'COLOR', vals: { Light: { r: 0.0784, g: 0.2784, b: 0.7216, a: 1 }, Dark: { r: 0.2314, g: 0.5098, b: 0.9647, a: 1 } } },
  { col: 'Colors', name: 'Colors/secondary', type: 'COLOR', vals: { Light: { r: 0.4941, g: 0.2275, b: 0.949, a: 1 }, Dark: { r: 0.6549, g: 0.5451, b: 0.9804, a: 1 } } },
  { col: 'Colors', name: 'Colors/secondaryDarken', type: 'COLOR', vals: { Light: { r: 0.4, g: 0.1529, b: 0.8, a: 1 }, Dark: { r: 0.5451, g: 0.3608, b: 0.9647, a: 1 } } },
  { col: 'Colors', name: 'Colors/success', type: 'COLOR', vals: { Light: { r: 0.0549, g: 0.6235, b: 0.4314, a: 1 }, Dark: { r: 0.2039, g: 0.8275, b: 0.6, a: 1 } } },
  { col: 'Colors', name: 'Colors/successDarken', type: 'COLOR', vals: { Light: { r: 0.0196, g: 0.4784, b: 0.3333, a: 1 }, Dark: { r: 0.0196, g: 0.4784, b: 0.3333, a: 1 } } },
  { col: 'Colors', name: 'Colors/warning', type: 'COLOR', vals: { Light: { r: 0.851, g: 0.4667, b: 0.0235, a: 1 }, Dark: { r: 0.9843, g: 0.749, b: 0.1412, a: 1 } } },
  { col: 'Colors', name: 'Colors/warningDarken', type: 'COLOR', vals: { Light: { r: 0.7059, g: 0.3255, b: 0.0353, a: 1 }, Dark: { r: 0.7059, g: 0.3255, b: 0.0353, a: 1 } } },
  { col: 'Colors', name: 'Colors/error', type: 'COLOR', vals: { Light: { r: 0.8784, g: 0.1412, b: 0.1412, a: 1 }, Dark: { r: 0.9725, g: 0.4431, b: 0.4431, a: 1 } } },
  { col: 'Colors', name: 'Colors/errorDarken', type: 'COLOR', vals: { Light: { r: 0.7843, g: 0.1176, b: 0.1176, a: 1 }, Dark: { r: 0.7843, g: 0.1176, b: 0.1176, a: 1 } } },
  { col: 'Colors', name: 'Colors/info', type: 'COLOR', vals: { Light: { r: 0.102, g: 0.3373, b: 0.8588, a: 1 }, Dark: { r: 0.3765, g: 0.6471, b: 0.9804, a: 1 } } },
  { col: 'Colors', name: 'Colors/onPrimary', type: 'COLOR', vals: { Light: { r: 1, g: 1, b: 1, a: 1 }, Dark: { r: 0.0667, g: 0.098, b: 0.1569, a: 1 } } },
  { col: 'Colors', name: 'Colors/onSecondary', type: 'COLOR', vals: { Light: { r: 1, g: 1, b: 1, a: 1 }, Dark: { r: 1, g: 1, b: 1, a: 1 } } },
  { col: 'Colors', name: 'Colors/onSuccess', type: 'COLOR', vals: { Light: { r: 1, g: 1, b: 1, a: 1 }, Dark: { r: 1, g: 1, b: 1, a: 1 } } },
  { col: 'Colors', name: 'Colors/onError', type: 'COLOR', vals: { Light: { r: 1, g: 1, b: 1, a: 1 }, Dark: { r: 1, g: 1, b: 1, a: 1 } } },
  { col: 'Colors', name: 'Colors/onWarning', type: 'COLOR', vals: { Light: { r: 1, g: 1, b: 1, a: 1 }, Dark: { r: 1, g: 1, b: 1, a: 1 } } },
  { col: 'Colors', name: 'Colors/border', type: 'COLOR', vals: { Light: { r: 0.898, g: 0.9059, b: 0.9216, a: 1 }, Dark: { r: 0.2157, g: 0.2549, b: 0.3176, a: 1 } } },
  { col: 'Colors', name: 'Colors/textPrimary', type: 'COLOR', vals: { Light: { r: 0.0667, g: 0.098, b: 0.1569, a: 1 }, Dark: { r: 0.9765, g: 0.9804, b: 0.9843, a: 1 } } },
  { col: 'Colors', name: 'Colors/textMuted', type: 'COLOR', vals: { Light: { r: 0.4196, g: 0.4471, b: 0.502, a: 1 }, Dark: { r: 0.6118, g: 0.6392, b: 0.6863, a: 1 } } },
  // ── Colors/Sidebar ─────────────────────────────────────────────────────────
  { col: 'Colors/Sidebar', name: 'Colors/Sidebar/bg', type: 'COLOR', vals: { Default: { r: 0.0667, g: 0.098, b: 0.1569, a: 1 } } },
  { col: 'Colors/Sidebar', name: 'Colors/Sidebar/surface', type: 'COLOR', vals: { Default: { r: 0.1216, g: 0.1608, b: 0.2157, a: 1 } } },
  { col: 'Colors/Sidebar', name: 'Colors/Sidebar/border', type: 'COLOR', vals: { Default: { r: 1, g: 1, b: 1, a: 0.07 } } },
  { col: 'Colors/Sidebar', name: 'Colors/Sidebar/text', type: 'COLOR', vals: { Default: { r: 1, g: 1, b: 1, a: 0.75 } } },
  { col: 'Colors/Sidebar', name: 'Colors/Sidebar/textMuted', type: 'COLOR', vals: { Default: { r: 1, g: 1, b: 1, a: 0.5 } } },
  { col: 'Colors/Sidebar', name: 'Colors/Sidebar/textFaint', type: 'COLOR', vals: { Default: { r: 1, g: 1, b: 1, a: 0.3 } } },
  { col: 'Colors/Sidebar', name: 'Colors/Sidebar/hover', type: 'COLOR', vals: { Default: { r: 1, g: 1, b: 1, a: 0.05 } } },
  // ── Spacing ────────────────────────────────────────────────────────────────
  { col: 'Spacing', name: 'Spacing/1', type: 'FLOAT', desc: '4px spacing', vals: { Default: 4 } },
  { col: 'Spacing', name: 'Spacing/2', type: 'FLOAT', desc: '8px spacing', vals: { Default: 8 } },
  { col: 'Spacing', name: 'Spacing/3', type: 'FLOAT', desc: '12px spacing', vals: { Default: 12 } },
  { col: 'Spacing', name: 'Spacing/4', type: 'FLOAT', desc: '16px spacing', vals: { Default: 16 } },
  { col: 'Spacing', name: 'Spacing/5', type: 'FLOAT', desc: '20px spacing', vals: { Default: 20 } },
  { col: 'Spacing', name: 'Spacing/6', type: 'FLOAT', desc: '24px spacing', vals: { Default: 24 } },
  { col: 'Spacing', name: 'Spacing/7', type: 'FLOAT', desc: '28px spacing', vals: { Default: 28 } },
  { col: 'Spacing', name: 'Spacing/8', type: 'FLOAT', desc: '32px spacing', vals: { Default: 32 } },
  { col: 'Spacing', name: 'Spacing/10', type: 'FLOAT', desc: '40px spacing', vals: { Default: 40 } },
  { col: 'Spacing', name: 'Spacing/12', type: 'FLOAT', desc: '48px spacing', vals: { Default: 48 } },
  { col: 'Spacing', name: 'Spacing/16', type: 'FLOAT', desc: '64px spacing', vals: { Default: 64 } },
  // ── Border Radius ──────────────────────────────────────────────────────────
  { col: 'Border Radius', name: 'BorderRadius/sm', type: 'FLOAT', desc: '4px', vals: { Default: 4 } },
  { col: 'Border Radius', name: 'BorderRadius/md', type: 'FLOAT', desc: '8px', vals: { Default: 8 } },
  { col: 'Border Radius', name: 'BorderRadius/lg', type: 'FLOAT', desc: '12px', vals: { Default: 12 } },
  { col: 'Border Radius', name: 'BorderRadius/xl', type: 'FLOAT', desc: '16px', vals: { Default: 16 } },
  { col: 'Border Radius', name: 'BorderRadius/full', type: 'FLOAT', desc: '9999px', vals: { Default: 9999 } },
  // ── Typography ─────────────────────────────────────────────────────────────
  { col: 'Typography', name: 'Typography/FontSize/xs', type: 'FLOAT', desc: '11px', vals: { Default: 11 } },
  { col: 'Typography', name: 'Typography/FontSize/sm', type: 'FLOAT', desc: '12px', vals: { Default: 12 } },
  { col: 'Typography', name: 'Typography/FontSize/body', type: 'FLOAT', desc: '14px', vals: { Default: 14 } },
  { col: 'Typography', name: 'Typography/FontSize/md', type: 'FLOAT', desc: '16px', vals: { Default: 16 } },
  { col: 'Typography', name: 'Typography/FontSize/lg', type: 'FLOAT', desc: '18px', vals: { Default: 18 } },
  { col: 'Typography', name: 'Typography/FontSize/xl', type: 'FLOAT', desc: '22px', vals: { Default: 22 } },
  { col: 'Typography', name: 'Typography/FontSize/2xl', type: 'FLOAT', desc: '28px', vals: { Default: 28 } },
  { col: 'Typography', name: 'Typography/FontSize/3xl', type: 'FLOAT', desc: '36px', vals: { Default: 36 } },
  { col: 'Typography', name: 'Typography/FontWeight/regular', type: 'FLOAT', desc: '400 weight', vals: { Default: 400 } },
  { col: 'Typography', name: 'Typography/FontWeight/medium', type: 'FLOAT', desc: '500 weight', vals: { Default: 500 } },
  { col: 'Typography', name: 'Typography/FontWeight/semibold', type: 'FLOAT', desc: '600 weight', vals: { Default: 600 } },
  { col: 'Typography', name: 'Typography/FontWeight/bold', type: 'FLOAT', desc: '700 weight', vals: { Default: 700 } },
  // ── Layout ─────────────────────────────────────────────────────────────────
  { col: 'Layout', name: 'Layout/sidebarWidth', type: 'FLOAT', desc: '260px', vals: { Default: 260 } },
  { col: 'Layout', name: 'Layout/sidebarRailWidth', type: 'FLOAT', desc: '72px', vals: { Default: 72 } },
  { col: 'Layout', name: 'Layout/appbarHeight', type: 'FLOAT', desc: '56px', vals: { Default: 56 } },
  { col: 'Layout', name: 'Layout/drawerWidth', type: 'FLOAT', desc: '480px', vals: { Default: 480 } },
  { col: 'Layout', name: 'Layout/searchMaxWidth', type: 'FLOAT', desc: '360px', vals: { Default: 360 } },
  { col: 'Layout', name: 'Layout/contentMaxWidth', type: 'FLOAT', desc: '1280px', vals: { Default: 1280 } },
]

async function importVariables() {
  const collectionMap = {} // name → { collection, modeMap }
  let createdVars = 0
  let createdCollections = 0

  // Step 1: Create all collections and their modes
  for (const colDef of VAR_COLLECTIONS) {
    const collection = figma.variables.createVariableCollection(colDef.name)
    createdCollections++
    const modeMap = {}

    // First mode is auto-created — just rename it
    const firstModeId = collection.modes[0].modeId
    collection.renameMode(firstModeId, colDef.modes[0])
    modeMap[colDef.modes[0]] = firstModeId

    // Add additional modes (e.g. Dark for Colors)
    for (let i = 1; i < colDef.modes.length; i++) {
      const newModeId = collection.addMode(colDef.modes[i])
      modeMap[colDef.modes[i]] = newModeId
    }

    collectionMap[colDef.name] = { collection, modeMap }
    log(`  Collection: ${colDef.name} (${colDef.modes.join(', ')})`)
  }

  // Step 2: Create all variables and set mode values
  for (const v of VAR_DEFINITIONS) {
    const { collection, modeMap } = collectionMap[v.col]

    const variable = figma.variables.createVariable(
      v.name,
      collection,
      v.type
    )

    if (v.desc) variable.description = v.desc

    for (const [modeName, value] of Object.entries(v.vals)) {
      const modeId = modeMap[modeName]
      variable.setValueForMode(modeId, value)
    }

    createdVars++
  }

  log(`  Total: ${createdVars} variables in ${createdCollections} collections`)
  send('done', { action: `Imported ${createdVars} variables in ${createdCollections} collections` })
}

// ── Message handler ───────────────────────────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'create-color-styles':
        await createColorStyles()
        break
      case 'create-text-styles':
        await createTextStyles()
        break
      case 'create-component-frames':
        await createComponentFrames()
        break
      case 'import-variables':
        await importVariables()
        break
      case 'log-node-ids':
        logNodeIds()
        break
      default:
        send('error', { text: `Unknown message type: ${msg.type}` })
    }
  } catch (err) {
    send('error', { text: err.message || String(err) })
    console.error(err)
  }
}
