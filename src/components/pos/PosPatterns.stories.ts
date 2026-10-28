import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PosButton from './PosButton.vue'
import PosCartLine, { type PosLineNote } from './PosCartLine.vue'
import PosChip from './PosChip.vue'
import PosCustomerChip from './PosCustomerChip.vue'
import PosField from './PosField.vue'
import PosSheet from './PosSheet.vue'
import PosTotals from './PosTotals.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import { DISCOUNT_REASONS } from '@/views/Retail/pos/saleModel'
import { posScreen } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Patterns',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
How the POS components compose on the register — the same compositions \`PosPreview\` renders, with the
sale's numbers as fixtures. Copy the structure, not the fixture.
        `,
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const LINES: { id: string; name: string; meta: string; qty: number; unitLabel?: string; wasLabel?: string; totalLabel: string; seed: string; notes: PosLineNote[] }[] = [
  {
    id: 'L1', name: 'Classic crew tee', meta: 'Black · TEE-001-BLK-M', qty: 2, unitLabel: '2 × $39.00', wasLabel: '$78.00', totalLabel: '$54.60', seed: 'TEE-001-BLK-M',
    notes: [{ kind: 'promo', label: 'Spring sale 30%', amount: '−$23.40' }],
  },
  {
    id: 'L2', name: 'Pullover hoodie', meta: 'Grey, L · HOOD-101-GRY-L', qty: 1, wasLabel: '$89.00', totalLabel: '$57.30', seed: 'HOOD-101-GRY-L',
    notes: [
      { kind: 'promo', label: 'Spring sale 30%', amount: '−$26.70' },
      { kind: 'discount', label: 'Damaged', amount: '−$5.00' },
      { kind: 'note', label: 'Gift wrap' },
    ],
  },
  {
    id: 'L3', name: 'Court sneaker', meta: 'White, 10 · SNEAK-A1-WHT-10', qty: 1, totalLabel: '$159.00', seed: 'SNEAK-A1-WHT-10',
    notes: [{ kind: 'stock', label: '1 more than in stock' }],
  },
]

const TOTALS = {
  subtotal: '$326.00',
  discounts: [
    { key: 'promo', label: 'Spring sale 30%', amount: '−$50.10' },
    { key: 'items', label: 'Item discounts', amount: '−$5.00' },
    { key: 'coupon', label: 'Coupon REFER20', amount: '−$20.00', removable: true },
  ],
  discountTotal: '−$75.10',
  taxNote: 'Includes GST $22.81',
  total: '$250.90',
}

export const Cart: Story = {
  decorators: [posScreen('760px')],
  parameters: { docs: { description: { story: 'The cart pane: customer chip, lines with every kind of note, totals, the labelled cart actions with Clear set apart, and Charge.' } } },
  render: () => ({
    components: { PosButton, PosCartLine, PosCustomerChip, PosTotals },
    setup: () => ({ lines: LINES, totals: TOTALS, open: ref(true) }),
    template: `
      <div style="display: flex; flex-direction: column; width: min(100%, var(--mp-component-drawer-width-sm)); height: 100%; margin-left: auto; background: var(--mp-color-light-pos-surface); border-left: 1px solid var(--mp-color-light-pos-hairline);">
        <div style="display: flex; align-items: baseline; justify-content: space-between; padding: var(--mp-space-16) var(--mp-space-16) var(--mp-space-8);">
          <strong style="font-size: var(--mp-fontSize-16);">Current sale</strong>
          <span style="font-size: var(--mp-fontSize-12); color: var(--mp-color-light-pos-muted);">4 items</span>
        </div>
        <PosCustomerChip name="Hannah Cole" tier="gold" :points="2840" style="margin: 0 var(--mp-space-16) var(--mp-space-8);" />
        <div style="flex: 1; overflow-y: auto;">
          <PosCartLine
            v-for="l in lines"
            :key="l.id"
            v-bind="l"
            :aria-label="l.name + ', quantity ' + l.qty + ', ' + l.totalLabel + '. Edit line'"
          />
        </div>
        <PosTotals v-model:open="open" v-bind="totals" style="padding: var(--mp-space-12) var(--mp-space-16); border-top: 1px solid var(--mp-color-light-pos-hairline);" />
        <div style="display: flex; gap: var(--mp-space-6); padding: var(--mp-space-8) var(--mp-space-16) 0;">
          <PosButton variant="secondary" stacked icon="pause-circle" style="flex: 1;">Park</PosButton>
          <PosButton variant="secondary" stacked icon="percent" style="flex: 1;">Discount</PosButton>
          <PosButton variant="secondary" stacked icon="user-plus" style="flex: 1;">Customer</PosButton>
          <PosButton variant="secondary" stacked tone="danger" icon="trash-2" style="flex: 1; margin-left: var(--mp-space-8);">Clear</PosButton>
        </div>
        <PosButton size="lg" style="margin: var(--mp-space-12) var(--mp-space-16) var(--mp-space-16);">Charge {{ totals.total }}</PosButton>
      </div>
    `,
  }),
}

export const LineDiscountSheet: Story = {
  name: 'Line discount sheet',
  decorators: [posScreen('720px')],
  parameters: { docs: { description: { story: 'A line\'s discount: amount or percent, quick presets, a required reason, and the line total it will become — the message line switches to the error when the entry is wrong.' } } },
  render: () => ({
    components: { PosButton, PosChip, PosField, PosSheet, MpSegmentedControl },
    setup: () => {
      const kind = ref<'percent' | 'amount'>('percent')
      const value = ref('15')
      const reason = ref<string | null>('Price match')
      const error = () => (Number(value.value) > 100 && kind.value === 'percent' ? 'Enter a percentage from 1 to 100' : undefined)
      return { kind, value, reason, error, reasons: DISCOUNT_REASONS, presets: [10, 15, 20, 25], open: ref(true) }
    },
    template: `
      <PosSheet v-model="open" title="Classic crew tee — Black" subtitle="SKU: TEE-001-BLK-M" close-label="Close line actions">
        <div style="display: flex; flex-direction: column; gap: var(--mp-space-8); padding: var(--mp-space-12) var(--mp-space-14) var(--mp-space-6); overflow-y: auto;">
          <MpSegmentedControl v-model="kind" :items="[{ value: 'percent', label: 'Percent' }, { value: 'amount', label: 'Amount' }]" ariaLabel="Discount type" />
          <PosField
            id="pattern-discount"
            v-model="value"
            :label="kind === 'percent' ? 'Percent off this line' : 'Amount off this line'"
            type="number"
            inputmode="decimal"
            :error="error()"
            hint="Line total becomes $66.30"
          />
          <div v-if="kind === 'percent'" role="group" aria-label="Quick percentages" style="display: flex; flex-wrap: wrap; gap: var(--mp-space-6);">
            <PosChip v-for="p in presets" :key="p" :active="value === String(p)" @click="value = String(p)">{{ p }}%</PosChip>
          </div>
          <div id="pattern-reason" style="font-size: var(--mp-fontSize-12); font-weight: var(--mp-fontWeight-bold); color: var(--mp-color-light-pos-muted); text-transform: uppercase; letter-spacing: 0.04em;">Reason</div>
          <div role="group" aria-labelledby="pattern-reason" style="display: flex; flex-wrap: wrap; gap: var(--mp-space-6);">
            <PosChip v-for="r in reasons" :key="r" :active="reason === r" @click="reason = r">{{ r }}</PosChip>
          </div>
          <PosButton>Apply discount</PosButton>
          <PosButton variant="ghost">Back</PosButton>
        </div>
      </PosSheet>
    `,
  }),
}
