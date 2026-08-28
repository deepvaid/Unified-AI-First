import type { Meta, StoryObj } from '@storybook/vue3'
import { VContainer } from 'vuetify/components'
import {
  mp_radius_4,
  mp_fontFamily_mono,
  mp_fontSize_11,
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
\`space.*\` is the one spacing scale, and **the token name is the pixel value** — \`space.12\`
*is* 12px. It runs on a 4px grid from 16px up, with 2px half-steps (2 · 6 · 10 · 14) below it;
that sub-grid is a recorded decision (DESIGN_AUDIT.md P1-5), not an accident. Every bar below is
rendered from \`src/design-tokens/generated/tokens.ts\`, so its width **is** the token value.

### How to consume
- In templates, prefer Vuetify utilities (\`pa-4\`, \`ma-2\`, \`ga-3\`) — same 4px grid
  (\`pa-1\` = 4px = \`space.4\`).
- In CSS, use \`var(--mp-space-*)\` (SCSS: \`$mp-space-*\`). Never a raw px literal.
- Layout constants (e.g. drawer width 480px) come from \`layout.*\`, never re-typed.
        `,
      },
    },
  },
} satisfies Meta<typeof VContainer>

export default meta
type Story = StoryObj<typeof meta>

const spacing = tokensByPrefix('mp_space_')
const layout = tokensByPrefix('mp_layout_')

export const SpacingScale: Story = {
  render: () => ({
    setup() {
      return { spacing, mp_radius_4, mp_fontFamily_mono, mp_fontSize_11 }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Spacing scale — space.* (name = px value)</p>
        <div v-for="s in spacing" :key="s.token" class="d-flex align-center ga-4 mb-2">
          <div
            class="text-medium-emphasis"
            :style="{ fontFamily: mp_fontFamily_mono, fontSize: mp_fontSize_11, minWidth: '160px' }"
          >{{ s.name }} · {{ s.value }}</div>
          <div
            :style="{
              width: s.value,
              height: '20px',
              background: 'rgb(var(--v-theme-primary))',
              borderRadius: mp_radius_4,
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
      return { layout, mp_radius_4, mp_fontFamily_mono, mp_fontSize_11 }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Layout dimensions — layout.*</p>
        <div v-for="l in layout" :key="l.token" class="mb-4">
          <div
            class="text-medium-emphasis mb-1"
            :style="{ fontFamily: mp_fontFamily_mono, fontSize: mp_fontSize_11 }"
          >{{ l.name }} · {{ l.value }}</div>
          <div
            :style="{
              width: l.value,
              maxWidth: '100%',
              height: '28px',
              background: 'rgb(var(--v-theme-primary-container))',
              border: '1px solid rgb(var(--v-theme-outline-variant))',
              borderRadius: mp_radius_4,
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
