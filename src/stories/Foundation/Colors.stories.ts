import type { Meta, StoryObj } from '@storybook/vue3'
import {
  mp_color_dark_background,
  mp_color_dark_border,
  mp_color_dark_surface,
  mp_color_dark_textMuted,
  mp_color_dark_textPrimary,
  mp_color_light_background,
  mp_color_light_border,
  mp_color_light_surface,
  mp_color_light_textMuted,
  mp_color_light_textPrimary,
} from '@/design-tokens/generated/tokens'
import { tokensByPrefix, type TokenEntry } from './foundationTokens'
import { SwatchGrid } from './SwatchGrid'

const meta: Meta = {
  title: 'Foundations/Colors',
  tags: ['autodocs'],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component: `
### Overview
Every swatch on this page is rendered programmatically from \`src/design-tokens/generated/tokens.ts\`,
which is generated from \`src/design-tokens/tokens.json\` (\`npm run tokens:build\`). If a value looks
wrong here, fix it in \`tokens.json\` — never in a component.

### How to consume
- **In components:** use Vuetify theme channels — \`rgb(var(--v-theme-primary))\`, \`color="success"\`,
  \`bg-surface\` — so light/dark theming is automatic. The themes in \`src/plugins/maropostTheme.ts\` are
  built from these same tokens.
- **In CSS:** the generated \`variables.css\` exposes each token as \`--mp-color-*\`.
- **Never** hardcode hex values in components; the token name is the API.

### Sections
Light theme roles · Dark theme roles · **semantic aliases** (surface, text, border, accent, feedback) ·
primitive scales (blue / neutral / sidebar) · chart series.

Each theme's roles are split by family: the **core roles** every component may use come first, then
one grid per family (\`color.light.accent.*\`, \`color.light.tag.*\`, …). A family that belongs to one
product area says so in its caption: the Da Vinci and POS palettes are not general-purpose colours.

Semantic aliases (\`--surface-*\`, \`--text-*\`, \`--border-*\`, \`--accent-*\`) resolve through
\`mp-theme-aliases.css\` and switch with the Storybook **Theme** and **Accent** toolbars — the same
path as the app. Never hardcode hex in components; use aliases or Vuetify theme channels.
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * The families under `color.<theme>.*`, in display order, with a caption for the ones that are
 * scoped to one area. A family that is in tokens.json but not listed here still renders, after
 * these, under its own key.
 */
const FAMILIES: { key: string; label: string; caption: string }[] = [
  { key: 'accent', label: 'Accent presets', caption: 'The four Accent presets (cyan is the default). Components read the active one through the --accent-* aliases, never a preset directly.' },
  { key: 'blue', label: 'Blue ramp', caption: 'The dark-theme counterpart of color.blue.*.' },
  { key: 'neutral', label: 'Neutral ramp', caption: 'The dark-theme counterpart of color.neutral.*.' },
  { key: 'inkPanel', label: 'Ink panel', caption: 'The inverted ink panel and its foregrounds (--ink-panel-*).' },
  { key: 'cloud', label: 'Cloud identity', caption: 'One accent and one text ink per cloud. Used by MpSourceCloudChip.' },
  { key: 'tag', label: 'Tag hues', caption: 'Service desk tags (MpTagChip): a container and its ink per hue. Categories, not states.' },
  { key: 'moduleTile', label: 'Module tiles', caption: 'Categorical tile accents for ModuleLandingPage cards.' },
  { key: 'flowLogic', label: 'Flow logic', caption: 'Journey builder only: the logic / filter step category.' },
  { key: 'aiAccent', label: 'AI accent', caption: 'Da Vinci only: AI surfaces.' },
  { key: 'aiMetric', label: 'AI metric', caption: 'Da Vinci only: draft metric deltas.' },
  { key: 'dv', label: 'Da Vinci', caption: 'Da Vinci only: the copilot and Orbit voice palette.' },
  { key: 'pos', label: 'POS', caption: 'POS only: the in-store register palette. Light-only by design, so there is no color.dark.pos.' },
]

interface ColorFamily {
  key: string
  heading: string
  caption?: string
  swatches: TokenEntry[]
}

/** One theme's roles, grouped by the first sub-key after `mp_color_<theme>_`. Core roles (no sub-key) first. */
function colorFamilies(theme: 'light' | 'dark'): ColorFamily[] {
  const core: TokenEntry[] = []
  const byFamily = new Map<string, TokenEntry[]>()
  for (const entry of tokensByPrefix(`mp_color_${theme}_`)) {
    const split = entry.name.indexOf('_')
    if (split === -1) {
      core.push(entry)
      continue
    }
    const key = entry.name.slice(0, split)
    if (!byFamily.has(key)) byFamily.set(key, [])
    byFamily.get(key)!.push({ ...entry, name: entry.name.slice(split + 1) })
  }

  const known = FAMILIES.filter((family) => byFamily.has(family.key))
  const unlisted = [...byFamily.keys()]
    .filter((key) => !FAMILIES.some((family) => family.key === key))
    .map((key) => ({ key, label: key, caption: undefined }))

  return [
    { key: 'core', heading: `Core roles — color.${theme}.* (${core.length})`, swatches: core },
    ...[...known, ...unlisted].map(({ key, label, caption }) => ({
      key,
      heading: `${label} — color.${theme}.${key}.* (${byFamily.get(key)!.length})`,
      caption,
      swatches: byFamily.get(key)!,
    })),
  ]
}

const lightFamilies = colorFamilies('light')
const darkFamilies = colorFamilies('dark')
const blueScale = tokensByPrefix('mp_color_blue_')
const neutralScale = tokensByPrefix('mp_color_neutral_')
const sidebarColors = tokensByPrefix('mp_color_sidebar_')
const chartLight = tokensByPrefix('mp_color_chart_light_')
const chartDark = tokensByPrefix('mp_color_chart_dark_')

const lightPanel = {
  panelBg: mp_color_light_background,
  panelText: mp_color_light_textPrimary,
  panelMuted: mp_color_light_textMuted,
  panelBorder: mp_color_light_border,
}

const darkPanel = {
  panelBg: mp_color_dark_background,
  panelText: mp_color_dark_textPrimary,
  panelMuted: mp_color_dark_textMuted,
  panelBorder: mp_color_dark_border,
}

export const LightTheme: Story = {
  render: () => ({
    components: { SwatchGrid },
    setup() {
      return { lightFamilies, lightPanel }
    },
    template: `
      <div>
        <SwatchGrid
          v-for="family in lightFamilies"
          :key="family.key"
          :heading="family.heading"
          :caption="family.caption"
          :swatches="family.swatches"
          v-bind="lightPanel"
        />
      </div>
    `,
  }),
}

export const DarkTheme: Story = {
  render: () => ({
    components: { SwatchGrid },
    setup() {
      return { darkFamilies, darkPanel }
    },
    template: `
      <div>
        <p class="text-caption text-medium-emphasis mb-4">Every grid below is drawn on the dark background token, whatever the toolbar Theme is.</p>
        <SwatchGrid
          v-for="family in darkFamilies"
          :key="family.key"
          :heading="family.heading"
          :caption="family.caption"
          :swatches="family.swatches"
          v-bind="darkPanel"
        />
      </div>
    `,
  }),
}

export const PrimitiveScales: Story = {
  render: () => ({
    components: { SwatchGrid },
    setup() {
      return { blueScale, neutralScale, sidebarColors, lightPanel }
    },
    template: `
      <div>
        <SwatchGrid heading="Blue scale — color.blue.*" :swatches="blueScale" v-bind="lightPanel" />
        <SwatchGrid heading="Neutral scale — color.neutral.*" :swatches="neutralScale" v-bind="lightPanel" />
        <SwatchGrid heading="Sidebar palette — color.sidebar.*" :swatches="sidebarColors" v-bind="lightPanel" />
      </div>
    `,
  }),
}

export const ChartSeries: Story = {
  render: () => ({
    components: { SwatchGrid },
    setup() {
      return { chartLight, chartDark, lightPanel, darkPanel }
    },
    template: `
      <div>
        <SwatchGrid heading="Chart series — light theme order" :swatches="chartLight" v-bind="lightPanel" />
        <SwatchGrid heading="Chart series — dark theme order" :swatches="chartDark" v-bind="darkPanel" />
      </div>
    `,
  }),
}

/** Semantic alias rows — values resolve from mp-theme-aliases.css at runtime. */
const AliasRow = {
  props: ['rows', 'heading'],
  template: `
    <section class="mb-6">
      <p class="text-overline text-medium-emphasis mb-3">{{ heading }}</p>
      <div style="display: grid; gap: 12px;">
        <div
          v-for="row in rows"
          :key="row.alias"
          class="d-flex align-center justify-space-between pa-3"
          :style="{
            background: row.bg ?? 'var(--surface-primary)',
            color: row.fg ?? 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
          }"
        >
          <div>
            <div class="text-body-2 font-weight-medium">{{ row.label }}</div>
            <code class="text-caption text-medium-emphasis">{{ row.alias }}</code>
          </div>
          <div
            v-if="row.swatch"
            :style="{
              width: '48px',
              height: '32px',
              borderRadius: '6px',
              background: row.swatch,
              border: '1px solid var(--border-default)',
            }"
          />
        </div>
      </div>
    </section>
  `,
}

const surfaceRows = [
  { label: 'L0 — canvas / sunken wells', alias: '--surface-canvas', swatch: 'var(--surface-canvas)' },
  { label: 'L1 — cards, tables, AppBar', alias: '--surface-primary', swatch: 'var(--surface-primary)' },
  { label: 'L1 nested — inset groups', alias: '--surface-secondary', swatch: 'var(--surface-secondary)' },
  { label: 'L2 — raised / sticky / bulk bar', alias: '--surface-raised', swatch: 'var(--surface-raised)' },
  { label: 'L3/L4 — menus, modals, drawers', alias: '--surface-overlay', swatch: 'var(--surface-overlay)' },
  { label: 'Interactive hover', alias: '--surface-interactive-hover', swatch: 'var(--surface-interactive-hover)' },
  { label: 'Interactive selected', alias: '--surface-interactive-selected', swatch: 'var(--surface-interactive-selected)' },
  { label: 'Scrim / backdrop', alias: '--scrim-overlay', swatch: 'var(--scrim-overlay)' },
]

const textRows = [
  { label: 'Primary body / headings', alias: '--text-primary', fg: 'var(--text-primary)' },
  { label: 'Secondary / meta', alias: '--text-secondary', fg: 'var(--text-secondary)' },
  { label: 'Muted / helper', alias: '--text-muted', fg: 'var(--text-muted)' },
  { label: 'Disabled', alias: '--text-disabled', fg: 'var(--text-disabled)' },
]

const borderRows = [
  { label: 'Subtle / hairline', alias: '--border-subtle', swatch: 'var(--border-subtle)' },
  { label: 'Default control / card', alias: '--border-default', swatch: 'var(--border-default)' },
  { label: 'Strong boundary', alias: '--border-strong', swatch: 'var(--border-strong)' },
  { label: 'Focus ring (opaque accent)', alias: '--focus-ring', swatch: 'var(--focus-ring)' },
]

const accentRows = [
  { label: 'Accent default', alias: '--accent-default', swatch: 'var(--accent-default)' },
  { label: 'Accent hover', alias: '--accent-hover', swatch: 'var(--accent-hover)' },
  { label: 'Accent active', alias: '--accent-active', swatch: 'var(--accent-active)' },
  { label: 'Selected background', alias: '--accent-selected-bg', swatch: 'var(--accent-selected-bg)' },
  { label: 'Subtle background', alias: '--accent-subtle-bg', swatch: 'var(--accent-subtle-bg)' },
]

/**
 * Surface / foreground pairs: each row is painted with its surface and written in the foreground
 * declared for it (CLAUDE.md, "Colour pairing"). `surface` and `on` are CSS values; a bare
 * `--name` is an alias from mp-theme-aliases.css.
 */
const PairRow = {
  props: ['rows', 'heading'],
  setup() {
    const paint = (name: string) => (name.startsWith('--') ? `var(${name})` : name)
    return { paint }
  },
  template: `
    <section class="mb-6">
      <p class="text-overline text-medium-emphasis mb-3">{{ heading }}</p>
      <div class="d-flex flex-column ga-3">
        <div
          v-for="row in rows"
          :key="row.surface"
          class="d-flex flex-wrap align-center justify-space-between ga-2 pa-3"
          :style="{
            background: paint(row.surface),
            color: paint(row.on),
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--mp-radius-8)',
          }"
        >
          <span class="text-body-2 font-weight-medium">{{ row.label }}</span>
          <span class="text-caption" style="font-family: var(--mp-fontFamily-mono);">{{ row.on }} on {{ row.surface }}</span>
        </div>
      </div>
    </section>
  `,
}

const accentPairs = [
  { label: 'Accent fill', surface: '--accent-default', on: '--accent-on' },
  { label: 'Accent container', surface: '--accent-container', on: '--accent-on-container' },
]

const feedbackPairs = [
  { label: 'Success, solid', surface: '--pos', on: '--on-pos' },
  { label: 'Success, soft', surface: '--pos-soft', on: '--pos-ink' },
  { label: 'Danger, solid', surface: '--neg', on: '--on-neg' },
  { label: 'Danger, soft', surface: '--neg-soft', on: '--neg-ink' },
  { label: 'Warning, solid', surface: '--warn', on: '--on-warn' },
  { label: 'Warning, soft', surface: '--warn-soft', on: '--warn-ink' },
]

/** Info has no alias of its own: the solid fill is the Vuetify channel, the soft block is the accent container. */
const infoPairs = [
  { label: 'Info, solid (Vuetify channel)', surface: 'rgb(var(--v-theme-info))', on: 'rgb(var(--v-theme-on-info))' },
  { label: 'Info, soft (what MpAlert paints)', surface: '--accent-container', on: '--accent-on-container' },
]

export const SemanticSurfaces: Story = {
  render: () => ({
    components: { AliasRow },
    setup() {
      return { surfaceRows }
    },
    template: `<AliasRow heading="Surface hierarchy — active theme" :rows="surfaceRows" />`,
  }),
}

export const SemanticTextAndIcons: Story = {
  render: () => ({
    components: { AliasRow },
    setup() {
      const iconRows = [
        { label: 'Primary icon', alias: '--icon-primary', fg: 'var(--icon-primary)' },
        { label: 'Secondary icon', alias: '--icon-secondary', fg: 'var(--icon-secondary)' },
        { label: 'Disabled icon', alias: '--icon-disabled', fg: 'var(--icon-disabled)' },
      ]
      return { textRows, iconRows }
    },
    template: `
      <div>
        <AliasRow heading="Text hierarchy — active theme" :rows="textRows" />
        <AliasRow heading="Icon hierarchy — active theme" :rows="iconRows" />
      </div>
    `,
  }),
}

export const SemanticBordersAndFocus: Story = {
  render: () => ({
    components: { AliasRow },
    setup() {
      return { borderRows }
    },
    template: `<AliasRow heading="Borders and focus — active theme" :rows="borderRows" />`,
  }),
}

export const SemanticAccents: Story = {
  render: () => ({
    components: { AliasRow, PairRow },
    setup() {
      return { accentRows, accentPairs }
    },
    template: `
      <div>
        <p class="text-caption text-medium-emphasis mb-4">
          Use the <strong>Accent</strong> toolbar to preview blue, gray, or purple. Default cyan omits
          <code>data-accent</code> — same as the app.
        </p>
        <AliasRow heading="Accent roles — active accent + theme" :rows="accentRows" />
        <PairRow heading="Accent pairs — foreground on its surface" :rows="accentPairs" />
      </div>
    `,
  }),
}

export const SemanticFeedback: Story = {
  render: () => ({
    components: { PairRow },
    setup() {
      return { feedbackPairs, infoPairs }
    },
    template: `
      <div>
        <PairRow heading="Feedback pairs — foreground on its surface, active theme" :rows="feedbackPairs" />
        <PairRow heading="Info — no alias of its own" :rows="infoPairs" />
      </div>
    `,
  }),
}

/** Side-by-side light and dark surface tiers using generated token literals (not Storybook-only). */
export const LightDarkSurfaceComparison: Story = {
  render: () => ({
    setup() {
      return {
        mp_color_light_background,
        mp_color_light_surface,
        mp_color_light_textPrimary,
        mp_color_light_border,
        mp_color_dark_background,
        mp_color_dark_surface,
        mp_color_dark_textPrimary,
        mp_color_dark_border,
      }
    },
    template: `
      <div class="d-flex flex-wrap ga-4">
        <div
          class="pa-4 flex-grow-1"
          :style="{
            background: mp_color_light_background,
            color: mp_color_light_textPrimary,
            border: '1px solid ' + mp_color_light_border,
            borderRadius: '12px',
            minWidth: '280px',
          }"
        >
          <p class="text-overline mb-2">Light canvas</p>
          <div
            class="pa-3"
            :style="{
              background: mp_color_light_surface,
              border: '1px solid ' + mp_color_light_border,
              borderRadius: '8px',
            }"
          >
            L1 card surface
          </div>
        </div>
        <div
          class="pa-4 flex-grow-1"
          :style="{
            background: mp_color_dark_background,
            color: mp_color_dark_textPrimary,
            border: '1px solid ' + mp_color_dark_border,
            borderRadius: '12px',
            minWidth: '280px',
          }"
        >
          <p class="text-overline mb-2">Dark canvas</p>
          <div
            class="pa-3"
            :style="{
              background: mp_color_dark_surface,
              border: '1px solid ' + mp_color_dark_border,
              borderRadius: '8px',
            }"
          >
            L1 card surface
          </div>
        </div>
      </div>
    `,
  }),
}
