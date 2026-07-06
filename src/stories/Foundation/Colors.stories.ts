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
Light theme roles · Dark theme roles · primitive scales (blue / neutral / sidebar) · chart series.
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
