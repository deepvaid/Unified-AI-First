import type { Meta, StoryObj } from '@storybook/vue3'
import { VContainer } from 'vuetify/components'
import {
  mp_borderRadius_sm,
  mp_typography_fontFamily_mono,
  mp_typography_fontSize_xs,
} from '@/design-tokens/generated/tokens'
import { tokensByPrefix } from './foundationTokens'

const meta = {
  title: 'Foundations/Spacing',
  component: VContainer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The spacing scale is a 4px-based ramp defined in \`tokens.json\` (\`spacing.*\`) and rendered here
directly from \`src/design-tokens/generated/tokens.ts\` — each bar's width **is** the token value.
Layout dimensions (sidebar, app bar, drawer, content max) come from \`layout.*\`.

### How to consume
- Prefer Vuetify utilities (\`pa-4\`, \`ma-2\`, \`ga-3\`) — they follow the same 4px grid
  (\`pa-1\` = 4px = \`spacing.1\`).
- In CSS, use the generated \`--mp-spacing-*\` variables or SCSS \`$mp-spacing-*\`.
- Layout constants (e.g. drawer width 480px) must come from \`layout.*\` tokens, never re-typed.
        `,
      },
    },
  },
} satisfies Meta<typeof VContainer>

export default meta
type Story = StoryObj<typeof meta>

const spacing = tokensByPrefix('mp_spacing_')
const layout = tokensByPrefix('mp_layout_')

export const SpacingScale: Story = {
  render: () => ({
    setup() {
      return { spacing, mp_borderRadius_sm, mp_typography_fontFamily_mono, mp_typography_fontSize_xs }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Spacing scale — spacing.* (4px base)</p>
        <div v-for="s in spacing" :key="s.token" class="d-flex align-center ga-4 mb-2">
          <div
            class="text-medium-emphasis"
            :style="{ fontFamily: mp_typography_fontFamily_mono, fontSize: mp_typography_fontSize_xs, minWidth: '160px' }"
          >{{ s.name }} · {{ s.value }}</div>
          <div
            :style="{
              width: s.value,
              height: '20px',
              background: 'rgb(var(--v-theme-primary))',
              borderRadius: mp_borderRadius_sm,
            }"
          />
        </div>
      </div>
    `,
  }),
}

export const LayoutDimensions: Story = {
  render: () => ({
    setup() {
      return { layout, mp_borderRadius_sm, mp_typography_fontFamily_mono, mp_typography_fontSize_xs }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Layout dimensions — layout.*</p>
        <div v-for="l in layout" :key="l.token" class="mb-4">
          <div
            class="text-medium-emphasis mb-1"
            :style="{ fontFamily: mp_typography_fontFamily_mono, fontSize: mp_typography_fontSize_xs }"
          >{{ l.name }} · {{ l.value }}</div>
          <div
            :style="{
              width: l.value,
              maxWidth: '100%',
              height: '28px',
              background: 'rgb(var(--v-theme-primary-container))',
              border: '1px solid rgb(var(--v-theme-outline-variant))',
              borderRadius: mp_borderRadius_sm,
            }"
          />
        </div>
        <p class="text-caption text-medium-emphasis mt-2">
          Bars render at the real token width (capped at the container edge).
        </p>
      </div>
    `,
  }),
}
