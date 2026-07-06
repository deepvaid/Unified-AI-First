import type { Meta, StoryObj } from '@storybook/vue3'
import { VContainer } from 'vuetify/components'
import {
  mp_borderRadius_lg,
  mp_typography_fontFamily_mono,
  mp_typography_fontSize_xs,
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
Choose by element type, not aesthetic preference: \`sm\`/\`chip\` for dense controls and chips,
\`md\`/\`lg\` for list items and secondary cards, \`xl\`/\`2xl\` for primary cards and dialogs,
\`full\` for pills, buttons and avatars. Component-level tokens (\`component.button.radius.*\`,
\`component.card.radius.*\`, …) are already wired into the Vuetify global defaults — a plain
\`v-btn\` or \`v-card\` picks them up automatically.

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

const radii = tokensByPrefix('mp_borderRadius_')
const componentRadii = tokensByPrefix('mp_component_').filter((t) => t.name.includes('radius_'))
const shadows = tokensByPrefix('mp_shadow_')
const transitions = tokensByPrefix('mp_transition_')

const TileLabel = {
  props: ['entry'],
  setup() {
    return { mp_typography_fontFamily_mono, mp_typography_fontSize_xs }
  },
  template: `
    <div
      class="text-medium-emphasis mt-2"
      :style="{ fontFamily: mp_typography_fontFamily_mono, fontSize: mp_typography_fontSize_xs, wordBreak: 'break-all' }"
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
        <p class="text-overline text-medium-emphasis mb-4">Radius scale — borderRadius.*</p>
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
      return { shadows, transitions, mp_borderRadius_lg }
    },
    template: `
      <div class="pa-6" style="background: rgb(var(--v-theme-background));">
        <p class="text-overline text-medium-emphasis mb-4">Elevation — shadow.*</p>
        <div class="d-flex flex-wrap ga-6">
          <div v-for="s in shadows" :key="s.token" style="width: 220px;">
            <div
              :style="{
                boxShadow: s.value,
                height: '96px',
                borderRadius: mp_borderRadius_lg,
                background: 'rgb(var(--v-theme-surface))',
                border: '1px solid rgb(var(--v-theme-outline-variant))',
              }"
            />
            <TileLabel :entry="s" />
          </div>
        </div>
        <p class="text-overline text-medium-emphasis mb-2 mt-8">Motion — transition.*</p>
        <TileLabel v-for="t in transitions" :key="t.token" :entry="t" />
      </div>
    `,
  }),
}
