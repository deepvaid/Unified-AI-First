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

### Slots
- **default** — extra body content below the description (chips, meta rows, inset previews).
- **media** — full-bleed footer area (top border + background), e.g. a flow mini preview.

### 🟢 Do's
- **Do** keep exactly one card selected per group and drive it from view state.
- **Do** wire \`@click\` on the card; the component emits native click through the root.

### 🔴 Don'ts
- **Don't** re-implement the selected ring in views — pass \`selected\` instead.
- **Don't** nest interactive controls inside the card body; the whole card is the click target.
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
    selected: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    icon: { control: 'text' },
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
