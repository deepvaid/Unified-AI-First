import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayTimeline from './MaropayTimeline.vue'
import { stack } from '@/stories/storyTemplate'
import { storyPayment } from './storyFixtures'

const refunded = storyPayment('m10', (p) => p.status === 'refunded')
const delayed = storyPayment('m13', (p) => p.status === 'processing')

const meta = {
  title: 'Product/Maropay/MaropayTimeline',
  component: MaropayTimeline,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A payment's history, newest first. The glyph and tone come from each event's **kind** — captured,
refund, dispute, ignored late notification — never from sniffing the text, so a duplicate or late
processor event reads as quietly as it should. Composes \`MpListRow\` + \`MpSectionHeader\`.

**Use when:** a Maropay payment's detail page.

**Don't use when:** you need an order's timeline — orders keep their own, which Maropay writes a
summary line into.

### A11y
- **Provides:** a list; every row states what happened and when in text.
        `,
      },
    },
  },
  args: { events: refunded.timeline },
} satisfies Meta<typeof MaropayTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: stack({ MaropayTimeline }, [
    { label: 'Captured, then refunded', args: { events: refunded.timeline } },
    { label: 'Delayed payment still processing (M13)', args: { events: delayed.timeline } },
    { label: 'Empty', args: { events: [] } },
  ]),
}
