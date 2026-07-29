import type { Meta, StoryObj } from '@storybook/vue3'
import { VContainer } from 'vuetify/components'
import {
  mp_borderRadius_md,
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
  mp_spacing_3,
  mp_spacing_6,
  mp_typography_fontFamily_mono,
  mp_typography_fontSize_sm,
  mp_typography_fontSize_xs,
} from '@/design-tokens/generated/tokens'
import { tokensByPrefix } from './foundationTokens'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Foundations/Colors',
  component: VContainer,
  tags: ['autodocs'],
  parameters: {
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

Semantic aliases (\`--surface-*\`, \`--text-*\`, \`--border-*\`, \`--accent-*\`) resolve through
\`mp-theme-aliases.css\` and switch with the Storybook **Theme** and **Accent** toolbars — the same
path as the app. Never hardcode hex in components; use aliases or Vuetify theme channels.
        `,
      },
    },
  },
} satisfies Meta<typeof VContainer>

export default meta
type Story = StoryObj<typeof meta>

const lightColors = tokensByPrefix('mp_color_light_')
const darkColors = tokensByPrefix('mp_color_dark_')
const blueScale = tokensByPrefix('mp_color_blue_')
const neutralScale = tokensByPrefix('mp_color_neutral_')
const sidebarColors = tokensByPrefix('mp_color_sidebar_')
const chartLight = tokensByPrefix('mp_color_chart_light_')
const chartDark = tokensByPrefix('mp_color_chart_dark_')

/** Reusable swatch-grid section. `panel` styles let dark tokens render on a dark canvas. */
const SwatchGrid = {
  props: ['swatches', 'heading', 'panelBg', 'panelText', 'panelMuted', 'panelBorder'],
  setup() {
    return {
      mp_borderRadius_md,
      mp_spacing_3,
      mp_spacing_6,
      mp_typography_fontFamily_mono,
      mp_typography_fontSize_sm,
      mp_typography_fontSize_xs,
    }
  },
  template: `
    <section
      :style="{
        background: panelBg,
        color: panelText,
        padding: mp_spacing_6,
        borderRadius: mp_borderRadius_md,
        border: '1px solid ' + panelBorder,
        marginBottom: mp_spacing_6,
      }"
    >
      <p class="text-overline" :style="{ color: panelMuted, marginBottom: mp_spacing_3 }">{{ heading }}</p>
      <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: mp_spacing_3 }">
        <div v-for="s in swatches" :key="s.token">
          <div
            :style="{
              background: s.value,
              height: '56px',
              borderRadius: mp_borderRadius_md,
              border: '1px solid ' + panelBorder,
            }"
          />
          <div :style="{ fontSize: mp_typography_fontSize_sm, fontWeight: 600, marginTop: '6px', wordBreak: 'break-all' }">{{ s.name }}</div>
          <div :style="{ fontFamily: mp_typography_fontFamily_mono, fontSize: mp_typography_fontSize_xs, color: panelMuted, wordBreak: 'break-all' }">{{ s.value }}</div>
        </div>
      </div>
    </section>
  `,
}

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
      return { lightColors, lightPanel }
    },
    template: `<SwatchGrid :heading="'Light theme — color.light.* (' + lightColors.length + ' roles)'" :swatches="lightColors" v-bind="lightPanel" />`,
  }),
}

export const DarkTheme: Story = {
  render: () => ({
    components: { SwatchGrid },
    setup() {
      return { darkColors, darkPanel }
    },
    template: `<SwatchGrid heading="Dark theme — color.dark.* (rendered on the dark background token)" :swatches="darkColors" v-bind="darkPanel" />`,
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
  { label: 'On accent (foreground)', alias: '--accent-on', swatch: 'var(--accent-on)' },
  { label: 'Container / on-container', alias: '--accent-container', swatch: 'var(--accent-container)' },
]

const feedbackRows = [
  { label: 'Success (--pos)', alias: '--pos', swatch: 'rgb(var(--v-theme-success))' },
  { label: 'Success container', alias: '--pos-soft', swatch: 'rgb(var(--v-theme-success-container))' },
  { label: 'Danger (--neg)', alias: '--neg', swatch: 'rgb(var(--v-theme-error))' },
  { label: 'Danger container', alias: '--neg-soft', swatch: 'rgb(var(--v-theme-error-container))' },
  { label: 'Warning fill', alias: 'rgb(var(--v-theme-warning))', swatch: 'rgb(var(--v-theme-warning))' },
  { label: 'Info fill', alias: 'rgb(var(--v-theme-info))', swatch: 'rgb(var(--v-theme-info))' },
]

export const SemanticSurfaces: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { AliasRow },
    setup() {
      return { surfaceRows }
    },
    template: `<AliasRow heading="Surface hierarchy — active theme" :rows="surfaceRows" />`,
  }),
}

/** Pinned dark — same surface tiers, forced to the dark theme regardless of the toolbar. */
export const DarkModeSemanticSurfaces: Story = {
  globals: darkModeGlobals,
  ...SemanticSurfaces,
}

export const SemanticTextAndIcons: Story = {
  parameters: { controls: { disable: true } },
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

/** Pinned dark — text + icon hierarchy, forced to the dark theme regardless of the toolbar. */
export const DarkModeSemanticTextAndIcons: Story = {
  globals: darkModeGlobals,
  ...SemanticTextAndIcons,
}

export const SemanticBordersAndFocus: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { AliasRow },
    setup() {
      return { borderRows }
    },
    template: `<AliasRow heading="Borders and focus — active theme" :rows="borderRows" />`,
  }),
}

/** Pinned dark — border tiers, forced to the dark theme regardless of the toolbar. */
export const DarkModeSemanticBordersAndFocus: Story = {
  globals: darkModeGlobals,
  ...SemanticBordersAndFocus,
}

export const SemanticAccents: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { AliasRow },
    setup() {
      return { accentRows }
    },
    template: `
      <div>
        <p class="text-caption text-medium-emphasis mb-4">
          Use the <strong>Accent</strong> toolbar to preview blue, gray, or purple. Default cyan omits
          <code>data-accent</code> — same as the app.
        </p>
        <AliasRow heading="Accent roles — active accent + theme" :rows="accentRows" />
      </div>
    `,
  }),
}

export const SemanticFeedback: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { AliasRow },
    setup() {
      return { feedbackRows }
    },
    template: `<AliasRow heading="Feedback colours — active theme" :rows="feedbackRows" />`,
  }),
}

/** Pinned dark — feedback colours, forced to the dark theme regardless of the toolbar. */
export const DarkModeSemanticFeedback: Story = {
  globals: darkModeGlobals,
  ...SemanticFeedback,
}

/** Side-by-side light and dark surface tiers using generated token literals (not Storybook-only). */
export const LightDarkSurfaceComparison: Story = {
  parameters: { controls: { disable: true } },
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
