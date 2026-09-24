import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayActingRoleBanner from './MaropayActingRoleBanner.vue'
import { grid } from '@/stories/storyTemplate'

const meta = {
  title: 'Product/Maropay/MaropayActingRoleBanner',
  component: MaropayActingRoleBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The reviewer preview of Maropay's access model (plan §2): shown across the workspace while the
prototype acts as a finance or store-operations user, naming what that role can and can't do so a
disabled action is never a mystery. Renders nothing for the owner. Composes \`MpBanner\`.
        `,
      },
    },
  },
  args: { role: 'finance' },
} satisfies Meta<typeof MaropayActingRoleBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: grid({ MaropayActingRoleBanner }, [
    { label: 'finance', args: { role: 'finance' } },
    { label: 'store operations, scoped', args: { role: 'store_ops', storeNames: ['Atlas Outfitters'] } },
    { label: 'owner — renders nothing', args: { role: 'owner' } },
  ], { columns: '1fr' }),
}
