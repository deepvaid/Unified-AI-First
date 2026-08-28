import type { Meta, StoryObj } from '@storybook/vue3'
import { VContainer } from 'vuetify/components'
import {
  mp_radius_12,
  mp_shadow_dark_lg,
  mp_shadow_dark_md,
  mp_shadow_dark_sm,
  mp_fontFamily_mono,
  mp_fontSize_11,
} from '@/design-tokens/generated/tokens'
import { tokensByPrefix } from './foundationTokens'

const meta = {
  title: 'Foundations/Radius & Shadows',
  component: VContainer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Corner radii and elevation, rendered directly from \`src/design-tokens/generated/tokens.ts\`.

### Radius
One scale, named by pixel value — \`radius.4 · 8 · 10 · 12 · 16 · 20 · full\`. It reads as a
concentric language: **16** for outer surfaces (cards, dialogs, drawers), **12** for anything
nested inside one, **10** for controls and inputs, **8** for chips and menu items, **4** for
micro-marks, \`full\` for pills, buttons and avatars.

Reach for a role token when the system has already made the decision —
\`component.{button,chip,input,menu,card,dialog}.radius\` alias into the scale and are wired into
the Vuetify global defaults, so a plain \`v-btn\` or \`v-card\` picks them up automatically.

### Shadows
Three softly-tinted levels only. Depth in this system comes from hairline borders + tint, not
heavy drop shadows — cards are \`flat border rounded="lg"\` by default. Use \`sm\` for resting
cards, \`md\` for hover/popovers, \`lg\` for modals and drawers. Never stack shadows.
        `,
      },
    },
  },
} satisfies Meta<typeof VContainer>

export default meta
type Story = StoryObj<typeof meta>

const radii = tokensByPrefix('mp_radius_')
const componentRadii = tokensByPrefix('mp_component_').filter((t) => t.name.endsWith('radius'))
const shadows = tokensByPrefix('mp_shadow_')
const motion = tokensByPrefix('mp_motion_')

const TileLabel = {
  props: ['entry'],
  setup() {
    return { mp_fontFamily_mono, mp_fontSize_11 }
  },
  template: `
    <div
      class="text-medium-emphasis mt-2"
      :style="{ fontFamily: mp_fontFamily_mono, fontSize: mp_fontSize_11, wordBreak: 'break-all' }"
    >{{ entry.name }} · {{ entry.value }}</div>
  `,
}

export const RadiusScale: Story = {
  render: () => ({
    components: { TileLabel },
    setup() {
      return { radii }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Radius scale — radius.* (name = px value)</p>
        <div class="d-flex flex-wrap ga-4">
          <div v-for="r in radii" :key="r.token" style="width: 140px;">
            <div
              :style="{
                borderRadius: r.value,
                height: '96px',
                background: 'rgb(var(--v-theme-primary-container))',
                border: '1px solid rgb(var(--v-theme-outline-variant))',
              }"
            />
            <TileLabel :entry="r" />
          </div>
        </div>
      </div>
    `,
  }),
}

export const ComponentRadius: Story = {
  render: () => ({
    components: { TileLabel },
    setup() {
      return { componentRadii }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Component radius — component.*.radius.* (wired into Vuetify defaults)</p>
        <div class="d-flex flex-wrap ga-4">
          <div v-for="r in componentRadii" :key="r.token" style="width: 180px;">
            <div
              :style="{
                borderRadius: r.value,
                height: '72px',
                background: 'rgb(var(--v-theme-surface))',
                border: '1px solid rgb(var(--v-theme-outline))',
              }"
            />
            <TileLabel :entry="r" />
          </div>
        </div>
      </div>
    `,
  }),
}

export const Shadows: Story = {
  render: () => ({
    components: { TileLabel },
    setup() {
      const lightShadows = shadows.filter((s) => !s.name.startsWith('dark_'))
      const darkShadowTokens = [
        { name: 'dark_sm', value: mp_shadow_dark_sm, token: 'mp_shadow_dark_sm' },
        { name: 'dark_md', value: mp_shadow_dark_md, token: 'mp_shadow_dark_md' },
        { name: 'dark_lg', value: mp_shadow_dark_lg, token: 'mp_shadow_dark_lg' },
      ]
      return { lightShadows, darkShadowTokens, motion, mp_radius_12 }
    },
    template: `
      <div class="pa-6" style="background: rgb(var(--v-theme-background));">
        <p class="text-overline text-medium-emphasis mb-4">Light elevation — shadow.sm / md / lg</p>
        <div class="d-flex flex-wrap ga-6 mb-8">
          <div v-for="s in lightShadows" :key="s.token" style="width: 220px;">
            <div
              :style="{
                boxShadow: s.value,
                height: '96px',
                borderRadius: mp_radius_12,
                background: 'rgb(var(--v-theme-surface))',
                border: '1px solid rgb(var(--v-theme-outline-variant))',
              }"
            />
            <TileLabel :entry="s" />
          </div>
        </div>
        <p class="text-overline text-medium-emphasis mb-4">Dark elevation — shadow.dark.* (generated tokens)</p>
        <div class="d-flex flex-wrap ga-6 mb-8">
          <div v-for="s in darkShadowTokens" :key="s.token" style="width: 220px;">
            <div
              :style="{
                boxShadow: s.value,
                height: '96px',
                borderRadius: mp_radius_12,
                background: 'var(--surface-primary)',
                border: '1px solid var(--border-subtle)',
              }"
            />
            <TileLabel :entry="s" />
          </div>
        </div>
        <p class="text-overline text-medium-emphasis mb-2">Motion — motion.*</p>
        <TileLabel v-for="t in motion" :key="t.token" :entry="t" />
      </div>
    `,
  }),
}

/** Semantic elevation aliases paired with borders — never shadow without a boundary. */
export const ElevationAliases: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      return { mp_radius_12 }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Semantic elevation — --elevation-* aliases</p>
        <div class="d-flex flex-wrap ga-6">
          <div style="width: 220px;">
            <div
              :style="{
                boxShadow: 'var(--elevation-raised)',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: mp_radius_12,
                height: '96px',
              }"
            />
            <p class="text-caption text-medium-emphasis mt-2 font-weight-medium">L2 raised</p>
            <code class="text-caption">--elevation-raised</code>
          </div>
          <div style="width: 220px;">
            <div
              :style="{
                boxShadow: 'var(--elevation-overlay)',
                background: 'var(--surface-overlay)',
                border: '1px solid var(--border-default)',
                borderRadius: mp_radius_12,
                height: '96px',
              }"
            />
            <p class="text-caption text-medium-emphasis mt-2 font-weight-medium">L3 overlay</p>
            <code class="text-caption">--elevation-overlay</code>
          </div>
          <div style="width: 220px;">
            <div
              :style="{
                boxShadow: 'var(--elevation-modal)',
                background: 'var(--surface-overlay)',
                border: '1px solid var(--border-default)',
                borderRadius: mp_radius_12,
                height: '96px',
              }"
            />
            <p class="text-caption text-medium-emphasis mt-2 font-weight-medium">L4 modal</p>
            <code class="text-caption">--elevation-modal</code>
          </div>
        </div>
      </div>
    `,
  }),
}
