import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PosField from './PosField.vue'
import { posSurface, constrain } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosField',
  component: PosField,
  tags: ['autodocs'],
  decorators: [posSurface, constrain('drawer')],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A labelled register input — unit price, line discount, note, receipt email, buyer ABN. 44px tall with
15px type for arm's-length reading. The hint and the error share one line under the box, so typing never
shifts the sheet. Extra attributes (\`type\`, \`inputmode\`, \`min\`, \`step\`, \`autocomplete\`,
\`placeholder\`) go straight to the input.

Forms that live in the app's own chrome (the customer form) keep Vuetify fields; \`PosField\` is for the
register's sheets.

### A11y
- **Provides:** a \`<label for>\`, \`aria-invalid\` and \`aria-describedby\` wired to the message, and any
  \`aria-describedby\` you pass is kept alongside it. \`hide-label\` keeps the label for screen readers.
- **Consumer must:** pass a unique \`id\`; give numbers \`inputmode="decimal"\` so tablets show a keypad.
        `,
      },
    },
  },
  args: { id: 'story-price', label: 'Unit price', hint: 'Original price $49.00', modelValue: '42.00' },
} satisfies Meta<typeof PosField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => ({
    components: { PosField },
    setup: () => ({ price: ref(''), note: ref('Gift wrap this item'), cash: ref('') }),
    template: `
      <div style="display: grid; gap: var(--mp-space-20);">
        <PosField id="v-price" v-model="price" label="Price" type="number" inputmode="decimal" placeholder="25.00" hint="GST is included in the shelf price" />
        <PosField id="v-note" v-model="note" label="Line note" :rows="3" />
        <PosField id="v-cash" v-model="cash" label="Other amount handed over" hide-label type="number" inputmode="decimal" placeholder="Other amount" />
      </div>
    `,
  }),
}

export const States: Story = {
  render: () => ({
    components: { PosField },
    setup: () => ({ empty: ref(''), bad: ref('120'), ok: ref('10') }),
    template: `
      <div style="display: grid; gap: var(--mp-space-20);">
        <PosField id="s-empty" v-model="empty" label="Email address" type="email" placeholder="name@example.com" hint="Sent once. It doesn’t sign the shopper up for marketing." />
        <PosField id="s-ok" v-model="ok" label="Percent off this line" type="number" hint="Line total becomes $35.10" />
        <PosField id="s-bad" v-model="bad" label="Percent off this line" type="number" error="Enter a percentage from 1 to 100" />
      </div>
    `,
  }),
}
