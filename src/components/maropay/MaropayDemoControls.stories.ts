import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayDemoControls from './MaropayDemoControls.vue'
import { surfaceFrame } from '@/stories/decorators'

const meta = {
  title: 'Product/Maropay/MaropayDemoControls',
  component: MaropayDemoControls,
  tags: ['autodocs'],
  decorators: [surfaceFrame({ width: '360px' })],
  parameters: {
    docs: {
      story: { inline: false, height: '360px' },
      description: {
        component: `
### Overview
Reviewer controls for the Maropay prototype, mounted in the user menu's demo block: load one of the
review scenarios M01–M17 for the active account, reset Maropay's saved state (nothing else),
preview the access model as a finance or store-operations user, and make the next request time out
(a list shows its error state, an action its safe retry). Reads and writes \`useMaropayStore\`
directly; the same scenarios load from \`?maropay=m01…m17\`.

**Don't use when:** building merchant-facing UI — this is instrumentation, never product.
        `,
      },
    },
  },
} satisfies Meta<typeof MaropayDemoControls>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
