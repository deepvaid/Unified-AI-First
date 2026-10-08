import type { Meta, StoryObj } from '@storybook/vue3'
import StoreProviderRow from './StoreProviderRow.vue'
import { stack } from '@/stories/storyTemplate'
import { storyState } from '@/components/maropay/storyFixtures'
import { connectionFor, storeProvidersFor } from '@/maropay/providers'

const ATLAS = 'retest-sales-notification'
const m05 = storeProvidersFor(storyState('m05'), ATLAS)
const live = storeProvidersFor(storyState('m10'), ATLAS)
const stripe = m05.connections.find((c) => c.kind === 'stripe')!
const bank = m05.connections.find((c) => c.kind === 'bank_deposit')!
const zip = connectionFor('zip', '2026-10-01T00:00:00.000Z', 'setup_incomplete')
const paypalOff = { ...live.connections.find((c) => c.kind === 'paypal')!, status: 'inactive' as const }

const meta = {
  title: 'Product/Sales Channels/StoreProviderRow',
  component: StoreProviderRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
One of the merchant's own providers on a store's Payments page — PayPal, Stripe, eWay, Afterpay, Zip, or a
manual method — as an \`MpListRow\`: the provider's tile, what it offers now, its rate and the illustrative
Maropost platform fee (\`providerSubtitle\`), a \`connection\` status chip and a kebab (Configure · Turn on/off ·
Remove). A provider still to connect also gets a visible **Finish setup** and an inline nag.

**Use when:** the Payment providers and Manual payment methods cards on \`StorePayments\`.

**Don't use when:** listing Maropay's own methods — that's \`MaropayMethodRow\`.

### A11y
- **Provides:** a static row (never a button, so the kebab isn't nested-interactive), a named kebab
  ("Stripe actions"), chips with icons so the state is never colour alone.
- **Consumer must:** wrap rows in \`role="list"\` and pass \`role="listitem"\`; handle \`configure\`, \`toggle\`
  and \`remove\`.
        `,
      },
    },
  },
  args: { connection: stripe, setup: m05, canManage: true },
} satisfies Meta<typeof StoreProviderRow>

export default meta
type Story = StoryObj<typeof meta>

/** Stripe taking cards and wallets before Maropay (M05). */
export const Default: Story = {}

export const States: Story = {
  render: stack({ StoreProviderRow }, [
    { label: 'Active gateway (Stripe, M05)', args: { connection: stripe, setup: m05, canManage: true } },
    { label: 'Setup incomplete (Zip, just added)', args: { connection: zip, setup: m05, canManage: true } },
    { label: 'Inactive (PayPal switched off)', args: { connection: paypalOff, setup: live, canManage: true } },
    { label: 'Manual method (Bank deposit)', args: { connection: bank, setup: m05, canManage: true } },
    { label: 'Gateway after Maropay took cards (Stripe beside a live store)', args: { connection: { ...stripe }, setup: { ...m05, cardProcessor: 'maropay' }, canManage: true } },
    { label: 'Read-only (store operations)', args: { connection: stripe, setup: m05, canManage: false } },
  ]),
}
