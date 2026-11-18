import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayBankAccountDrawer from './MaropayBankAccountDrawer.vue'
import { isolateStorage, overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Product/Maropay/MaropayBankAccountDrawer',
  component: MaropayBankAccountDrawer,
  tags: ['autodocs'],
  // Saving the account goes through the Maropay store, which persists to localStorage.
  decorators: [isolateStorage],
  parameters: {
    docs: {
      ...overlayDocs().docs,
      description: {
        component: `
### Overview
Where payouts go. Composes \`MpFormDrawer\` at \`sm\`. The bank code's name and length follow the
registration country (routing number, BSB, sort code…). The details are checked first, then
\`MaropayStepUpDialog\` confirms it's the owner, and only then does the Maropay store change the account.
The full numbers never reach state — the last four digits are kept — and the store sends a security
notice about the change.

**Use when:** fixing a failed payout, confirming or replacing the payout account.

**Don't use when:** entering the first account during setup — the setup wizard has its own step.

### A11y
- **Provides:** labelled fields with inline errors once the owner tries to save.
        `,
      },
    },
  },
  args: {
    modelValue: true,
    current: { bankName: 'Mercury Bank', last4: '4417', holderName: 'Atlas Outfitters LLC', currency: 'USD', addedAt: '2026-07-26T12:00:00.000Z' },
    country: 'US',
    defaultHolder: 'Atlas Outfitters LLC',
  },
  // Storybook does not write `update:modelValue` back into args, so the story holds the open state.
  render: (args) => ({
    components: { MaropayBankAccountDrawer },
    setup() {
      const open = ref(args.modelValue)
      return { args, open }
    },
    template: `
      <div>
        <v-btn variant="outlined" @click="open = true">Reopen</v-btn>
        <MaropayBankAccountDrawer v-bind="args" v-model="open" />
      </div>
    `,
  }),
} satisfies Meta<typeof MaropayBankAccountDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** No payout account yet — the drawer adds one. */
export const AddAccount: Story = {
  args: { current: null },
}

/** An Australian business: the bank code is a 6-digit BSB. */
export const Australia: Story = {
  args: { country: 'AU', current: null },
}
