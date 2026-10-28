import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PosSheet from './PosSheet.vue'
import PosButton from './PosButton.vue'
import PosBadge from './PosBadge.vue'
import { posArt, posStock } from './posArt'
import { posScreen } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosSheet',
  component: PosSheet,
  tags: ['autodocs'],
  decorators: [posScreen()],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The register's bottom sheet — variants, line actions, customers, stock elsewhere, the receipt. It rises
inside the register screen (its nearest positioned ancestor), not over the whole page, and covers 72% of it
(\`tall\`: 92%, for forms and receipts). Figma kit: **Sheet**.

Slots: \`#lead\` (a 40px square: product art, avatar, status icon), \`#title\` / \`#subtitle\` when the
heading needs markup, \`#aside\` (a badge beside the close button), default (the body — the sheet scrolls
its own lists).

Use \`v-model\` when closing is always fine. When it isn't (unsaved edits), pass \`:model-value\` and handle
\`@close\` — the sheet asks, you decide.

### A11y
- **Provides:** \`role="dialog"\`, \`aria-modal\`, named by its title; closes on the scrim, the close
  button (32px mark, 44px hit area) and Escape; moves focus in on open (unless a field inside took it),
  keeps Tab inside and returns focus to the trigger on close (\`useFocusTrap\`, as \`MpDialog\`); motion
  drops to near-zero under \`prefers-reduced-motion\`.
- **Consumer must:** give the close button a specific \`close-label\` ("Close line actions").
        `,
      },
    },
  },
  args: { modelValue: true, title: 'Classic crew tee', subtitle: '2 variants available', closeLabel: 'Close variants' },
} satisfies Meta<typeof PosSheet>

export default meta
type Story = StoryObj<typeof meta>

const variants = [
  { label: 'Black / M', sku: 'TEE-001-BLK-M', qty: 14, price: '$39.00' },
  { label: 'White / M', sku: 'TEE-001-WHT-M', qty: 3, price: '$39.00' },
]

export const Default: Story = {
  render: (args) => ({
    components: { PosSheet, PosButton, PosBadge },
    setup: () => ({ args, open: ref(true), variants, posArt, posStock }),
    template: `
      <PosButton style="margin: var(--mp-space-24);" @click="open = true">Open sheet</PosButton>
      <PosSheet v-bind="args" v-model="open">
        <template #lead>
          <div :style="{ width: '100%', height: '100%', background: posArt('TEE-001-BLK-M') }" />
        </template>
        <div style="display: flex; flex-direction: column; overflow-y: auto;">
          <button
            v-for="v in variants"
            :key="v.sku"
            type="button"
            style="display: flex; align-items: center; gap: var(--mp-space-10); min-height: var(--mp-component-pos-touchTarget); padding: var(--mp-space-10) var(--mp-space-14); border: 0; border-bottom: 1px solid var(--mp-color-light-pos-hairline); background: none; font: inherit; text-align: left; cursor: pointer;"
          >
            <span style="flex: 1; font-weight: var(--mp-fontWeight-semibold);">{{ v.label }}</span>
            <PosBadge :tone="posStock(v.qty).tone" :icon="posStock(v.qty).icon">{{ posStock(v.qty).label }}</PosBadge>
            <span style="font-weight: var(--mp-fontWeight-bold);">{{ v.price }}</span>
          </button>
        </div>
      </PosSheet>
    `,
  }),
}

export const Variants: Story = {
  parameters: { docs: { description: { story: 'Lead icon + `#aside` badge: the transaction sheet header.' } } },
  render: () => ({
    components: { PosSheet, PosBadge },
    setup: () => ({ open: ref(true) }),
    template: `
      <PosSheet v-model="open" close-label="Close transaction">
        <template #title><span style="font-family: var(--mp-fontFamily-mono);">POS-12048</span></template>
        <template #aside><PosBadge tone="success">Completed</PosBadge></template>
        <p style="margin: 0; padding: var(--mp-space-16) var(--mp-space-14); color: var(--mp-color-light-pos-muted);">
          Today · 5:30 AM · Sienna Mitchell · Front counter
        </p>
      </PosSheet>
    `,
  }),
}

export const Sizes: Story = {
  parameters: { docs: { description: { story: '`tall` — 92% of the screen, for forms and receipts.' } } },
  render: () => ({
    components: { PosSheet, PosButton },
    setup: () => ({ open: ref(true) }),
    template: `
      <PosSheet v-model="open" title="Email the receipt" subtitle="POS-12122 · Standard template" close-label="Close receipt" tall>
        <template #lead>
          <div style="display: grid; place-items: center; width: 100%; height: 100%; background: var(--mp-color-light-pos-accentSoft); color: var(--mp-color-light-pos-accentInk);">
            <v-icon size="18">mail</v-icon>
          </div>
        </template>
        <div style="flex: 1; padding: var(--mp-space-14);" />
        <div style="padding: var(--mp-space-8) var(--mp-space-14) 0;"><PosButton block @click="open = false">Done</PosButton></div>
      </PosSheet>
    `,
  }),
}

export const States: Story = {
  parameters: { docs: { description: { story: 'Guarded close: the sheet emits `close`, the consumer keeps it open and asks first.' } } },
  render: () => ({
    components: { PosSheet, PosButton },
    setup: () => {
      const asked = ref(false)
      return { asked }
    },
    template: `
      <PosSheet :model-value="true" title="Edit customer details" subtitle="Gold · 2,840 pts · 18 visits" close-label="Close customer details" @close="asked = true">
        <p style="margin: 0; padding: var(--mp-space-16) var(--mp-space-14); color: var(--mp-color-light-pos-muted);">
          {{ asked ? 'Close was asked for — the form shows "Discard your changes?" instead of closing.' : 'Press Escape or the close button.' }}
        </p>
      </PosSheet>
    `,
  }),
}
