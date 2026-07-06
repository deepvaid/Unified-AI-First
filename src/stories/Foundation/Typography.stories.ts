import type { Meta, StoryObj } from '@storybook/vue3'
import { VContainer } from 'vuetify/components'
import {
  mp_typography_fontFamily_base,
  mp_typography_fontFamily_mono,
  mp_typography_fontSize_xs,
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
- **Primitives:** \`typography.fontSize\` (xs → 3xl), \`fontWeight\` (regular → heavy),
  \`lineHeight\`, \`letterSpacing\`.
- **Display styles:** composite \`typography.display.{sm,md,lg,xl}\` for hero/marketing surfaces.
- **Semantic styles:** composite \`typography.semantic.*\` — pageTitle, kpiValue, sectionTitle,
  body, caption, eyebrow — the styles product pages should actually use.

### Rules
- Use semantic styles (or Vuetify text utilities) before reaching for raw sizes.
- **Never** write \`font-size: 13px\` in a component — pick a token stop. The token-sync plan
  (docs/design-system/token-sync-plan.md) tracks the migration of legacy px literals.
        `,
      },
    },
  },
} satisfies Meta<typeof VContainer>

export default meta
type Story = StoryObj<typeof meta>

const fontSizes = tokensByPrefix('mp_typography_fontSize_')
const fontWeights = tokensByPrefix('mp_typography_fontWeight_')
const lineHeights = tokensByPrefix('mp_typography_lineHeight_')
const letterSpacings = tokensByPrefix('mp_typography_letterSpacing_')

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

const displayStyles = compositeStyles(tokensByPrefix('mp_typography_display_'))
const semanticStyles = compositeStyles(tokensByPrefix('mp_typography_semantic_'))

const SpecimenLabel = {
  props: ['entry'],
  setup() {
    return { mp_typography_fontFamily_mono, mp_typography_fontSize_xs }
  },
  template: `
    <div
      class="text-medium-emphasis"
      :style="{ fontFamily: mp_typography_fontFamily_mono, fontSize: mp_typography_fontSize_xs, minWidth: '220px' }"
    >{{ entry.name }} · {{ entry.value }}</div>
  `,
}

export const TypeScale: Story = {
  render: () => ({
    components: { SpecimenLabel },
    setup() {
      return { fontSizes, mp_typography_fontFamily_base, mp_typography_fontFamily_mono }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-2">Font families</p>
        <p :style="{ fontFamily: mp_typography_fontFamily_base }" class="mb-1">base — {{ mp_typography_fontFamily_base }}</p>
        <p :style="{ fontFamily: mp_typography_fontFamily_mono }" class="mb-6">mono — {{ mp_typography_fontFamily_mono }}</p>

        <p class="text-overline text-medium-emphasis mb-2">Font-size scale — typography.fontSize.*</p>
        <div v-for="s in fontSizes" :key="s.token" class="d-flex align-center ga-4 mb-3">
          <SpecimenLabel :entry="s" />
          <div :style="{ fontSize: s.value, fontFamily: mp_typography_fontFamily_base, lineHeight: 1.2, whiteSpace: 'nowrap' }">
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
        <p class="text-overline text-medium-emphasis mb-2">Font weights — typography.fontWeight.*</p>
        <div v-for="w in fontWeights" :key="w.token" class="d-flex align-center ga-4 mb-2">
          <SpecimenLabel :entry="w" />
          <div :style="{ fontWeight: w.value }">The quick brown fox jumps over the lazy dog</div>
        </div>

        <p class="text-overline text-medium-emphasis mb-2 mt-8">Letter spacing — typography.letterSpacing.*</p>
        <div v-for="l in letterSpacings" :key="l.token" class="d-flex align-center ga-4 mb-2">
          <SpecimenLabel :entry="l" />
          <div :style="{ letterSpacing: l.value }">The quick brown fox jumps over the lazy dog</div>
        </div>

        <p class="text-overline text-medium-emphasis mb-2 mt-8">Line height — typography.lineHeight.*</p>
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
      return { displayStyles, mp_typography_fontFamily_mono, mp_typography_fontSize_xs }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Display styles — typography.display.*</p>
        <div v-for="d in displayStyles" :key="d.name" class="mb-6">
          <div
            class="text-medium-emphasis mb-1"
            :style="{ fontFamily: mp_typography_fontFamily_mono, fontSize: mp_typography_fontSize_xs }"
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
      return { semanticStyles, samples, mp_typography_fontFamily_mono, mp_typography_fontSize_xs }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Semantic styles — typography.semantic.*</p>
        <div v-for="s in semanticStyles" :key="s.name" class="mb-5">
          <div
            class="text-medium-emphasis mb-1"
            :style="{ fontFamily: mp_typography_fontFamily_mono, fontSize: mp_typography_fontSize_xs }"
          >semantic.{{ s.name }} · {{ Object.entries(s.css).map(([k, v]) => k + ': ' + v).join(' · ') }}</div>
          <div :style="s.css">{{ samples[s.name] ?? 'Specimen' }}</div>
        </div>
      </div>
    `,
  }),
}
