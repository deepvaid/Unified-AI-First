import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpOptionCard from './MpOptionCard.vue'

const meta = {
  title: 'Forms/MpOptionCard',
  component: MpOptionCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpOptionCard\` is a selectable option card used in wizards and create flows (journey templates,
campaign templates, audience lists, data-journey templates). The card owns the selection chrome —
hover border, primary ring + check icon when selected — while the view owns the grid/layout wrapper
and any extra body content via slots.

**Use when:** the user picks one option from a visual set of 2–8 alternatives in a wizard or create flow.

**Don't use when:** the choice is binary (use a switch/checkbox), the list is long (use a select or list), or options can't be described in a title + one line. A disabled state is **not supported** — filter unavailable options out instead of rendering them inert.

### Usage
\`\`\`html
<v-col v-for="opt in options" :key="opt.id" cols="12" sm="4">
  <MpOptionCard
    :selected="selectedId === opt.id"
    :title="opt.title"
    :description="opt.description"
    :icon="opt.icon"
    class="h-100"
    @click="selectedId = opt.id"
  />
</v-col>
\`\`\`

### Slots
- **default** — extra body content below the description (chips, meta rows, inset previews).
- **media** — full-bleed footer area (top border + background), e.g. a flow mini preview.

### 🟢 Do's
- **Do** keep exactly one card selected per group and drive it from view state.
- **Do** wire \`@click\` on the card; the component emits native click through the root.

### 🔴 Don'ts
- **Don't** re-implement the selected ring in views — pass \`selected\` instead.
- **Don't** nest interactive controls inside the card body; the whole card is the click target.

### A11y
- **Provides:** \`aria-pressed\` reflects the selection, and the selected state is marked by both a ring **and** a check icon, so it is never color-only.
- **Consumer must:** manage single-selection in view state and pass \`selected\` back down.
- **Gaps:** the root renders as a non-focusable \`div\` — no \`role="button"\`, no \`tabindex\`, no keydown handling and no \`:focus-visible\` ring, so the card cannot be selected by keyboard (\`aria-pressed\` is also invalid without a button role). This is the biggest a11y gap in the P0 set — flagged for the Phase 4 fix pass.
        `,
      },
    },
  },
  args: {
    selected: false,
    title: 'Abandoned cart recovery',
    description: 'Bring shoppers back with a timed three-email nudge sequence.',
    icon: 'shopping-cart',
  },
  argTypes: {
    selected: { control: 'boolean', description: 'Whether this option is currently selected (renders the primary ring + check icon and sets aria-pressed).' },
    title: { control: 'text', description: 'Option name, bold, next to the optional icon avatar.' },
    description: { control: 'text', description: 'One-line supporting copy under the title row.' },
    icon: { control: 'text', description: 'Lucide icon name rendered in a tonal primary avatar before the title.' },
    default: { control: false, description: 'Slot — extra body content below the description (chips, meta rows).', table: { category: 'slots' } },
    media: { control: false, description: 'Slot — full-bleed footer area with top border, e.g. a flow mini preview.', table: { category: 'slots' } },
  },
} satisfies Meta<typeof MpOptionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Unselected: Story = {
  render: (args) => ({
    components: { MpOptionCard },
    setup: () => ({ args }),
    template: `
      <div style="max-width:340px;">
        <MpOptionCard v-bind="args" />
      </div>
    `,
  }),
}

export const Selected: Story = {
  args: { selected: true },
  render: (args) => ({
    components: { MpOptionCard },
    setup: () => ({ args }),
    template: `
      <div style="max-width:340px;">
        <MpOptionCard v-bind="args" />
      </div>
    `,
  }),
}

export const WithMedia: Story = {
  args: { selected: true },
  render: (args) => ({
    components: { MpOptionCard },
    setup: () => ({ args }),
    template: `
      <div style="max-width:340px;">
        <MpOptionCard v-bind="args">
          <div class="d-flex gap-2 mt-3">
            <v-chip size="x-small" variant="tonal" color="primary">4 steps</v-chip>
            <v-chip size="x-small" variant="tonal" color="secondary">1 branch</v-chip>
          </div>
          <template #media>
            <div class="pa-4 d-flex justify-center text-medium-emphasis text-caption">
              Flow preview renders here
            </div>
          </template>
        </MpOptionCard>
      </div>
    `,
  }),
}

export const SelectionGroup: Story = {
  render: () => ({
    components: { MpOptionCard },
    setup() {
      const selectedId = ref('newsletter')
      const options = [
        { id: 'promo', title: 'Promotional Sale', icon: 'heart-handshake', description: 'Highlight discounts and flash deals' },
        { id: 'newsletter', title: 'Newsletter', icon: 'newspaper', description: 'Curated content updates' },
        { id: 'launch', title: 'Product Launch', icon: 'rocket', description: 'Announce a new product arrival' },
      ]
      return { selectedId, options }
    },
    template: `
      <v-row style="max-width:900px;">
        <v-col v-for="opt in options" :key="opt.id" cols="12" sm="4">
          <MpOptionCard
            :selected="selectedId === opt.id"
            :title="opt.title"
            :description="opt.description"
            :icon="opt.icon"
            class="h-100"
            @click="selectedId = opt.id"
          />
        </v-col>
      </v-row>
    `,
  }),
}
