import type { Meta, StoryObj } from '@storybook/vue3'
import { VContainer } from 'vuetify/components'
import {
  mp_fontFamily_base,
  mp_fontFamily_mono,
  mp_fontSize_11,
} from '@/design-tokens/generated/tokens'
import { tokensByPrefix, type TokenEntry } from './foundationTokens'

const meta = {
  title: 'Foundations/Typography',
  component: VContainer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Every specimen on this page is styled programmatically from \`src/design-tokens/generated/tokens.ts\`
(source: \`tokens.json\`, rebuilt via \`npm run tokens:build\`). The base font is **Inter**; mono is
JetBrains Mono for token values and code.

### The scale
- **UI ramp:** \`fontSize.*\` — 10 · 11 · 12 · 13 · 14 · 15 · 16 · 18 · 20 · 24 · 28 · 32 · 40 · 48.
  **The token name is the pixel value**, so there is no \`md\`-means-16-or-13 guesswork. **Body is
  14px** — the one canonical body size. No fractional sizes exist in this system.
- **Other primitives:** \`fontWeight\` (regular → heavy), \`lineHeight\`, \`letterSpacing\`.
- **Text roles:** composite \`text.*\` — pageTitle, kpiValue, sectionTitle, body, caption,
  eyebrow — the styles product pages should actually use. Every one resolves to a stop on the ramp.
- **Display styles:** composite \`display.{sm,md,lg,xl}\` — a deliberately separate hero ramp
  (32/44/60/80) for marketing surfaces and page heroes, never product chrome.

### Rules
- Use text roles (or Vuetify text utilities) before reaching for raw sizes.
- **Never** write \`font-size: 13px\` in a component — write \`var(--mp-fontSize-13)\`.
  DESIGN_AUDIT.md P1-6 records the snapping rules for the legacy fractional literals.
        `,
      },
    },
  },
} satisfies Meta<typeof VContainer>

export default meta
type Story = StoryObj<typeof meta>

const fontSizes = tokensByPrefix('mp_fontSize_')
const fontWeights = tokensByPrefix('mp_fontWeight_')
const lineHeights = tokensByPrefix('mp_lineHeight_')
const letterSpacings = tokensByPrefix('mp_letterSpacing_')

/** Groups composite tokens like `sm_fontSize`/`sm_lineHeight` into per-style CSS objects. */
function compositeStyles(entries: TokenEntry[]): { name: string; css: Record<string, string> }[] {
  const groups = new Map<string, Record<string, string>>()
  for (const { name, value } of entries) {
    const split = name.lastIndexOf('_')
    const group = name.slice(0, split)
    const prop = name.slice(split + 1)
    if (!groups.has(group)) groups.set(group, {})
    groups.get(group)![prop] = value
  }
  return Array.from(groups.entries()).map(([name, css]) => ({ name, css }))
}

const displayStyles = compositeStyles(tokensByPrefix('mp_display_'))
const textStyles = compositeStyles(tokensByPrefix('mp_text_'))

const SpecimenLabel = {
  props: ['entry'],
  setup() {
    return { mp_fontFamily_mono, mp_fontSize_11 }
  },
  template: `
    <div
      class="text-medium-emphasis"
      :style="{ fontFamily: mp_fontFamily_mono, fontSize: mp_fontSize_11, minWidth: '220px' }"
    >{{ entry.name }} · {{ entry.value }}</div>
  `,
}

export const TypeScale: Story = {
  render: () => ({
    components: { SpecimenLabel },
    setup() {
      return { fontSizes, mp_fontFamily_base, mp_fontFamily_mono }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-2">Font families</p>
        <p :style="{ fontFamily: mp_fontFamily_base }" class="mb-1">base — {{ mp_fontFamily_base }}</p>
        <p :style="{ fontFamily: mp_fontFamily_mono }" class="mb-6">mono — {{ mp_fontFamily_mono }}</p>

        <p class="text-overline text-medium-emphasis mb-2">Font-size scale — fontSize.* (name = px value)</p>
        <div v-for="s in fontSizes" :key="s.token" class="d-flex align-center ga-4 mb-3">
          <SpecimenLabel :entry="s" />
          <div :style="{ fontSize: s.value, fontFamily: mp_fontFamily_base, lineHeight: 1.2, whiteSpace: 'nowrap' }">
            The quick brown fox
          </div>
        </div>
      </div>
    `,
  }),
}

export const WeightsAndSpacing: Story = {
  render: () => ({
    components: { SpecimenLabel },
    setup() {
      return { fontWeights, letterSpacings, lineHeights }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-2">Font weights — fontWeight.*</p>
        <div v-for="w in fontWeights" :key="w.token" class="d-flex align-center ga-4 mb-2">
          <SpecimenLabel :entry="w" />
          <div :style="{ fontWeight: w.value }">The quick brown fox jumps over the lazy dog</div>
        </div>

        <p class="text-overline text-medium-emphasis mb-2 mt-8">Letter spacing — letterSpacing.*</p>
        <div v-for="l in letterSpacings" :key="l.token" class="d-flex align-center ga-4 mb-2">
          <SpecimenLabel :entry="l" />
          <div :style="{ letterSpacing: l.value }">The quick brown fox jumps over the lazy dog</div>
        </div>

        <p class="text-overline text-medium-emphasis mb-2 mt-8">Line height — lineHeight.*</p>
        <div class="d-flex flex-wrap ga-6">
          <div v-for="l in lineHeights" :key="l.token" style="max-width: 240px;">
            <SpecimenLabel :entry="l" />
            <p :style="{ lineHeight: l.value }" class="mt-1">
              Merchants scan dashboards quickly. Line height controls how dense each block of copy feels on the page.
            </p>
          </div>
        </div>
      </div>
    `,
  }),
}

export const DisplayStyles: Story = {
  render: () => ({
    setup() {
      return { displayStyles, mp_fontFamily_mono, mp_fontSize_11 }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Display styles — display.*</p>
        <div v-for="d in displayStyles" :key="d.name" class="mb-6">
          <div
            class="text-medium-emphasis mb-1"
            :style="{ fontFamily: mp_fontFamily_mono, fontSize: mp_fontSize_11 }"
          >display.{{ d.name }} · {{ d.css.fontSize }} / {{ d.css.lineHeight }} / {{ d.css.letterSpacing }} / {{ d.css.fontWeight }}</div>
          <div :style="d.css">Grow revenue</div>
        </div>
      </div>
    `,
  }),
}

export const SemanticStyles: Story = {
  render: () => ({
    setup() {
      const samples: Record<string, string> = {
        pageTitle: 'Sales orders',
        kpiValue: '$48,920',
        sectionTitle: 'Recent activity',
        body: 'Body copy for cards, tables and forms.',
        caption: 'Updated 4 minutes ago',
        eyebrow: 'COMMERCE',
      }
      return { textStyles, samples, mp_fontFamily_mono, mp_fontSize_11 }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Text roles — text.*</p>
        <div v-for="s in textStyles" :key="s.name" class="mb-5">
          <div
            class="text-medium-emphasis mb-1"
            :style="{ fontFamily: mp_fontFamily_mono, fontSize: mp_fontSize_11 }"
          >text.{{ s.name }} · {{ Object.entries(s.css).map(([k, v]) => k + ': ' + v).join(' · ') }}</div>
          <div :style="s.css">{{ samples[s.name] ?? 'Specimen' }}</div>
        </div>
      </div>
    `,
  }),
}
