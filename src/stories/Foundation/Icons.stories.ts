import type { Meta, StoryObj } from '@storybook/vue3'
import { computed, ref } from 'vue'
import { VContainer, VIcon, VTextField } from 'vuetify/components'
import * as LucideIcons from 'lucide-vue-next'
import { MDI_TO_LUCIDE } from '@/plugins/lucideIcons'
import {
  mp_borderRadius_md,
  mp_typography_fontFamily_mono,
  mp_typography_fontSize_xs,
} from '@/design-tokens/generated/tokens'

const meta = {
  title: 'Foundations/Icons',
  component: VContainer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Icons are [Lucide](https://lucide.dev) SVGs, wired into Vuetify through the custom icon set in
\`src/plugins/lucideIcons.ts\` (registered as the \`defaultSet\`). Every glyph below is rendered
**through that bridge** — the catalog is derived at runtime from the \`lucide-vue-next\` exports the
bridge resolves against, so it is always in sync with the installed icon package.

### Usage
Use kebab-case names with any Vuetify icon prop:
\`\`\`html
<v-icon>settings</v-icon>
<v-btn prepend-icon="plus">Create</v-btn>
<v-text-field prepend-inner-icon="search" />
\`\`\`
The name maps to the PascalCase Lucide export (\`chevron-down\` → \`ChevronDown\`).

### Rules
- **No \`mdi-*\` strings in new code.** The bridge keeps a small alias map (second story) only so
  Vuetify's internal icons (checkboxes, paginators, expand chevrons) render as Lucide SVGs.
- Icon-only buttons need an \`aria-label\` — the SVG itself is decorative.
        `,
      },
    },
  },
} satisfies Meta<typeof VContainer>

export default meta
type Story = StoryObj<typeof meta>

/** PascalCase Lucide export → the kebab-case name the bridge resolves ('Trash2' → 'trash-2'). */
function toKebabCase(pascal: string): string {
  return pascal
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Za-z])(\d)/g, '$1-$2')
    .toLowerCase()
}

/** Mirrors the bridge's kebab → PascalCase resolution ('trash-2' → 'Trash2'). */
function toPascalCase(kebab: string): string {
  return kebab.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

/** Every icon name resolvable by the bridge, deduplicated (lucide exports `X` + `XIcon` aliases). */
const allIconNames = Array.from(
  new Set(
    Object.keys(LucideIcons)
      .filter((name) => /^[A-Z][A-Za-z0-9]*$/.test(name) && !name.startsWith('Lucide') && !name.endsWith('Icon'))
      .map(toKebabCase),
  ),
)
  // Keep only names that round-trip through the bridge's own lookup (drops e.g. `AArrowDown`,
  // whose consecutive capitals can't be expressed in kebab-case).
  .filter((kebab) => Boolean((LucideIcons as unknown as Record<string, unknown>)[toPascalCase(kebab)]))
  .sort()

const PAGE_SIZE = 120

export const Catalog: Story = {
  render: () => ({
    components: { VIcon, VTextField },
    setup() {
      const query = ref('')
      const matches = computed(() =>
        allIconNames.filter((name) => name.includes(query.value.trim().toLowerCase())),
      )
      const shown = computed(() => matches.value.slice(0, PAGE_SIZE))
      return {
        query,
        matches,
        shown,
        total: allIconNames.length,
        PAGE_SIZE,
        mp_borderRadius_md,
        mp_typography_fontFamily_mono,
        mp_typography_fontSize_xs,
      }
    },
    template: `
      <div class="pa-6">
        <v-text-field
          v-model="query"
          label="Search icons"
          prepend-inner-icon="search"
          clearable
          hide-details
          style="max-width: 360px;"
          class="mb-2"
        />
        <p class="text-caption text-medium-emphasis mb-4">
          {{ matches.length }} of {{ total }} bridge-resolvable icons<span v-if="matches.length > PAGE_SIZE"> (showing first {{ PAGE_SIZE }})</span>
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
          <div
            v-for="name in shown"
            :key="name"
            class="d-flex flex-column align-center text-center pa-3"
            :style="{
              background: 'rgb(var(--v-theme-surface))',
              border: '1px solid rgb(var(--v-theme-outline-variant))',
              borderRadius: mp_borderRadius_md,
              gap: '8px',
            }"
          >
            <v-icon :icon="name" size="24" color="primary" />
            <span
              :style="{ fontFamily: mp_typography_fontFamily_mono, fontSize: mp_typography_fontSize_xs, wordBreak: 'break-all' }"
              class="text-medium-emphasis"
            >{{ name }}</span>
          </div>
        </div>
      </div>
    `,
  }),
}

export const MdiAliases: Story = {
  render: () => ({
    components: { VIcon },
    setup() {
      const aliases = Object.entries(MDI_TO_LUCIDE).map(([mdi, lucide]) => ({ mdi, lucide }))
      return { aliases, mp_borderRadius_md, mp_typography_fontFamily_mono, mp_typography_fontSize_xs }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-1">MDI alias bridge — MDI_TO_LUCIDE</p>
        <p class="text-caption text-medium-emphasis mb-4">
          Vuetify's internal mdi-* strings are routed to these Lucide glyphs. Do not use mdi-* names in new code.
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;">
          <div
            v-for="a in aliases"
            :key="a.mdi"
            class="d-flex align-center pa-3"
            :style="{
              background: 'rgb(var(--v-theme-surface))',
              border: '1px solid rgb(var(--v-theme-outline-variant))',
              borderRadius: mp_borderRadius_md,
              gap: '12px',
            }"
          >
            <v-icon :icon="a.mdi" size="22" color="primary" />
            <span :style="{ fontFamily: mp_typography_fontFamily_mono, fontSize: mp_typography_fontSize_xs }" class="text-medium-emphasis">
              {{ a.mdi }} → {{ a.lucide }}
            </span>
          </div>
        </div>
      </div>
    `,
  }),
}
