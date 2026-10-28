import type { Meta, StoryObj } from '@storybook/vue3'
import PosNotice from './PosNotice.vue'
import PosButton from './PosButton.vue'
import { posSurface, constrain } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosNotice',
  component: PosNotice,
  tags: ['autodocs'],
  decorators: [posSurface, constrain('drawer')],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A short note inside a sheet — a duplicate customer, no printer paired, the $1,000 buyer rule. The words
wrap around inline \`PosButton variant="link"\` actions, so the fix sits where the problem is read.

Give it \`role="alert"\` when it reports something the cashier just caused, \`role="note"\` when it is
advice. \`tone="warn"\` is for a problem; neutral for guidance.

### 🔴 Don'ts
- **Don't** use it for page-level feedback outside the register — that's \`MpAlert\`.
- **Don't** stack more than one in a sheet; lead with the one that blocks the sale.
        `,
      },
    },
  },
  args: { tone: 'neutral', icon: 'file-text' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'warn'] } },
  render: (args) => ({
    components: { PosNotice, PosButton },
    setup: () => ({ args }),
    template: `
      <PosNotice v-bind="args" role="note">
        <span>Over $1,000: the tax invoice needs the buyer's name or ABN.</span>
        <PosButton variant="link">Add customer</PosButton>
        <span>or enter it on the receipt.</span>
      </PosNotice>
    `,
  }),
} satisfies Meta<typeof PosNotice>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => ({
    components: { PosNotice, PosButton },
    template: `
      <div style="display: grid; gap: var(--mp-space-16);">
        <PosNotice icon="users" role="alert">
          <span>Hannah Cole already has this mobile. Keep one profile per shopper.</span>
          <PosButton variant="link">Use Hannah Cole</PosButton>
        </PosNotice>
        <PosNotice tone="warn" icon="printer-x" role="alert">
          <span>Front counter has no printer paired.</span>
          <PosButton variant="link">Email it instead</PosButton>
        </PosNotice>
      </div>
    `,
  }),
}

export const States: Story = {
  render: () => ({
    components: { PosNotice, PosButton },
    template: `
      <div style="display: grid; gap: var(--mp-space-16);">
        <PosNotice tone="warn" icon="triangle-alert" role="alert">
          <span>Discard your changes?</span>
          <PosButton variant="link">Keep editing</PosButton>
          <PosButton variant="link" tone="danger">Discard</PosButton>
        </PosNotice>
        <PosNotice icon="file-text" role="note">
          <span>Tax invoices of $1,000 or more need the buyer's name or ABN. It prints as you type.</span>
        </PosNotice>
      </div>
    `,
  }),
}
