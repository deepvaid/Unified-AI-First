import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayDemoPanel from './MaropayDemoPanel.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'

const meta = {
  title: 'Product/Maropay/MaropayDemoPanel',
  component: MaropayDemoPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Reviewer controls — simulating our payments partner, the bank or a shopper — kept visibly apart
from the product. One quiet, dashed, collapsed panel, always the last block on a Maropay page and
the same everywhere. Compose its rows as \`MpListRow variant="divided"\` with the control in
\`#trailing\`. \`v-model:open\` is optional.

**Use when:** a page needs demo-only actions (approve a method, deliver a bank event, decide a
dispute).

**Don't use when:** choosing a whole scenario or role — that's the user menu's
\`MaropayDemoControls\`.

### A11y
- **Provides:** a native \`<details>\` disclosure — Enter and Space toggle it, and the summary
  carries the focus ring.
        `,
      },
    },
  },
} satisfies Meta<typeof MaropayDemoPanel>

export default meta
type Story = StoryObj<typeof meta>

const rows = `
  <MpListRow variant="divided" title="Approve Klarna" subtitle="Our payments partner's decision on a method that needed review">
    <template #trailing><v-btn size="small" variant="outlined" class="text-none">Approve</v-btn></template>
  </MpListRow>
  <MpListRow variant="divided" title="Make test checkouts fail" subtitle="The next activation test checkout is declined">
    <template #trailing><v-btn size="small" variant="text" class="text-none">Arm</v-btn></template>
  </MpListRow>
`

export const Default: Story = {
  render: () => ({ components: { MaropayDemoPanel, MpListRow }, template: `<MaropayDemoPanel>${rows}</MaropayDemoPanel>` }),
}

export const Variants: Story = {
  render: () => ({
    components: { MaropayDemoPanel, MpListRow, MpSegmentedControl },
    setup: () => ({ outcome: 'won' }),
    template: `
      <div class="d-flex flex-column ga-6">
        <MaropayDemoPanel :open="true">${rows}</MaropayDemoPanel>
        <MaropayDemoPanel :open="true" title="Dispute outcome" description="Decide what the shopper's bank rules.">
          <MpListRow variant="divided" title="Outcome">
            <template #trailing>
              <MpSegmentedControl v-model="outcome" size="sm" aria-label="Outcome" :items="[{ value: 'won', label: 'Won' }, { value: 'lost', label: 'Lost' }]" />
            </template>
          </MpListRow>
        </MaropayDemoPanel>
        <MaropayDemoPanel :open="true">
          <MpListRow variant="divided" title="Next request times out" subtitle="One-shot: the next refund or capture fails, retrying is safe">
            <template #trailing><v-checkbox-btn aria-label="Next request times out" /></template>
          </MpListRow>
        </MaropayDemoPanel>
      </div>
    `,
  }),
}

/** No size prop — the panel spans its container. Narrow and wide containers. */
export const Sizes: Story = {
  render: () => ({
    components: { MaropayDemoPanel, MpListRow },
    template: `
      <div class="d-flex flex-column ga-6">
        <div style="max-width: 360px"><MaropayDemoPanel :open="true">${rows}</MaropayDemoPanel></div>
        <MaropayDemoPanel :open="true">${rows}</MaropayDemoPanel>
      </div>
    `,
  }),
}

/** Collapsed (default) and open. Tab to the summary to see its focus ring. */
export const States: Story = {
  render: () => ({
    components: { MaropayDemoPanel, MpListRow },
    template: `
      <div class="d-flex flex-column ga-6">
        <MaropayDemoPanel>${rows}</MaropayDemoPanel>
        <MaropayDemoPanel :open="true">${rows}</MaropayDemoPanel>
      </div>
    `,
  }),
}
