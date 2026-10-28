import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import ReceiptPaper from './ReceiptPaper.vue'
import {
  RECEIPT_LIBRARY, libraryTemplate, renderReceipt, sampleSale,
  type ReceiptLocation, type SectionKind,
} from '@/views/Retail/receipts/receiptModel'

// The seeded Bondi Junction (AU) and Robson Street (CA) stores, as receipts see them.
const BONDI: ReceiptLocation = {
  brand: 'Maropost Apparel', name: 'Bondi Junction', address: '500 Oxford St, Bondi Junction NSW 2022',
  country: 'AU', region: 'NSW', phone: '+61 2 9387 1000', taxId: '12 345 678 901',
}
const ROBSON: ReceiptLocation = {
  brand: 'Maropost Apparel', name: 'Robson Street', address: '1025 Robson St, Vancouver BC V6E 1A9',
  country: 'CA', region: 'BC', phone: '+1 (604) 555-0100', taxId: '123456789 RT0001',
}

const doc = (id: string, location = BONDI, gift = false) =>
  renderReceipt(libraryTemplate(id)!, sampleSale(), location, { gift })

const meta = {
  title: 'Product/POS/Components/ReceiptPaper',
  component: ReceiptPaper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`ReceiptPaper\` draws a register receipt the way the thermal printer prints it. It renders the
fixed-width lines from \`receiptModel\` (48 columns at 80 mm, 32 at 58 mm). The paper stays white in
both themes, because real paper does.

It's used in three places: the Receipts gallery thumbnails (\`scale\` below 1), the receipt designer
canvas (\`selectable\`, where each section is a button that emits \`select\`), and the POS receipt sheet.

Tax lines come from the selling location. Bondi Junction prints TAX INVOICE, its ABN and
"Includes GST". Robson Street prints its GST/HST number, with GST and PST added on top.
        `,
      },
    },
  },
  args: { doc: doc('standard') },
} satisfies Meta<typeof ReceiptPaper>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The four ready-made templates side by side. */
export const Variants: Story = {
  render: () => ({
    components: { ReceiptPaper },
    setup: () => ({ docs: RECEIPT_LIBRARY.map((t) => ({ id: t.id, name: t.name, doc: doc(t.id) })) }),
    template: `
      <div class="d-flex flex-wrap align-start ga-6">
        <div v-for="d in docs" :key="d.id" class="d-flex flex-column ga-2">
          <span class="text-caption text-medium-emphasis">{{ d.name }}</span>
          <ReceiptPaper :doc="d.doc" :scale="0.8" />
        </div>
      </div>`,
  }),
}

/** 80 mm and 58 mm paper, Australia and Canada. */
export const Sizes: Story = {
  render: () => ({
    components: { ReceiptPaper },
    setup: () => ({
      docs: [
        { label: '80 mm · Bondi (AU)', doc: doc('standard') },
        { label: '58 mm · Robson (CA)', doc: doc('compact', ROBSON) },
      ],
    }),
    template: `
      <div class="d-flex flex-wrap align-start ga-6">
        <div v-for="d in docs" :key="d.label" class="d-flex flex-column ga-2">
          <span class="text-caption text-medium-emphasis">{{ d.label }}</span>
          <ReceiptPaper :doc="d.doc" />
        </div>
      </div>`,
  }),
}

/** Designer mode (click a section to select it), and a gift receipt with no prices. */
export const States: Story = {
  render: () => ({
    components: { ReceiptPaper },
    setup: () => {
      const selected = ref<SectionKind | null>('items')
      return { selected, detailed: doc('detailed'), gift: doc('detailed', BONDI, true) }
    },
    template: `
      <div class="d-flex flex-wrap align-start ga-6">
        <div class="d-flex flex-column ga-2">
          <span class="text-caption text-medium-emphasis">Selectable — {{ selected }}</span>
          <ReceiptPaper :doc="detailed" selectable :selected-section-id="selected" @select="selected = $event" />
        </div>
        <div class="d-flex flex-column ga-2">
          <span class="text-caption text-medium-emphasis">Gift receipt</span>
          <ReceiptPaper :doc="gift" />
        </div>
      </div>`,
  }),
}
