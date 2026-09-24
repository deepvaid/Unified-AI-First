import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayMethodRow from './MaropayMethodRow.vue'
import { stack } from '@/stories/storyTemplate'
import { storyMethod, storyState } from './storyFixtures'

const fresh = storyState('m06')
const pending = storyState('m15')

const meta = {
  title: 'Product/Maropay/MaropayMethodRow',
  component: MaropayMethodRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
One payment method on one store: its rate, what it needs, and the switch that offers it at checkout.
The switch says on or off; the chip appears only for what a switch can't say — **setup required**,
**pending approval** and **unavailable**. A method that needs a review shows **Set up** instead of a
switch and emits \`setup\`, so the page can collect its requirements first. Composes \`MpListRow\`
and \`MpStatusChip type="method"\`.

**Use when:** a store's Payments page, grouped by category.

**Don't use when:** you only need to show rates — that's \`MaropayRatesTable\`.

### A11y
- **Provides:** the switch is named "Offer {method} at checkout"; a disabled control explains
  itself in a tooltip (\`disabledReason\`) on a focusable wrapper.
- **Consumer must:** pass \`disabledReason\` whenever the acting role can't change methods.
        `,
      },
    },
  },
  args: { method: storyMethod(fresh, 'card') },
} satisfies Meta<typeof MaropayMethodRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: stack({ MaropayMethodRow }, [
    { label: 'Enabled', args: { method: storyMethod(fresh, 'card') } },
    { label: 'Available, off', args: { method: storyMethod(fresh, 'affirm') } },
    { label: 'Setup required', args: { method: storyMethod(fresh, 'klarna') } },
    { label: 'Pending approval', args: { method: storyMethod(pending, 'klarna') } },
    { label: 'Unavailable for the currency', args: { method: storyMethod(fresh, 'ideal') } },
    { label: 'Delayed confirmation', args: { method: storyMethod(fresh, 'us_bank_account') } },
    { label: 'Disabled for a non-owner', args: { method: storyMethod(fresh, 'card'), disabledReason: 'Only the business owner can change this.' } },
  ]),
}
