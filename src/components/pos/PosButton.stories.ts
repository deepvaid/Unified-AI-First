import type { Meta, StoryObj } from '@storybook/vue3'
import PosButton from './PosButton.vue'
import { grid } from '@/stories/storyTemplate'
import { posSurface } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosButton',
  component: PosButton,
  tags: ['autodocs'],
  decorators: [posSurface],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The register's one button. Every size clears the 44px touch target (\`component.pos.touchTarget\`);
\`lg\` (52) is for the buttons a cashier hits most — Charge, the payment actions. Figma kit: **Button**.

| Variant | Where |
|---|---|
| \`primary\` | The one next step: Charge, Apply, Save, Done |
| \`secondary\` | Bordered actions beside it: Cancel, Print, Email; \`stacked\` for the cart's Park / Discount / Customer / Clear row |
| \`ghost\` | Back, Cancel inside a sheet; \`tone="danger"\` for Remove |
| \`link\` | An action inside a sentence (\`PosNotice\`) — 32px tall, the one exception to the 44px floor (WCAG 2.5.8 exempts inline targets) |

Icon-only when there is no label — pass \`aria-label\`, and it renders square (the quantity stepper).

### 🔴 Don'ts
- **Don't** put two primaries side by side; the second is \`secondary\`.
- **Don't** shrink below \`md\` — the 44px floor is the point.
- **Don't** fake disabled with a class: pass \`disabled\`, so it is skipped by touch and keyboard alike.

### A11y
- **Provides:** a real \`<button>\` (\`type="button"\` unless you ask for \`submit\`), the global focus ring,
  44/52px targets, disabled that is really disabled.
- **Consumer must:** give icon-only buttons an \`aria-label\`; add \`aria-expanded\` when it toggles a region.
        `,
      },
    },
  },
  args: { variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'link'] },
    tone: { control: 'inline-radio', options: ['neutral', 'danger'] },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
  },
  render: (args) => ({
    components: { PosButton },
    setup: () => ({ args }),
    template: '<PosButton v-bind="args">Apply discount</PosButton>',
  }),
} satisfies Meta<typeof PosButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ PosButton }, [
    { label: 'Primary', args: { variant: 'primary' }, slot: 'Apply' },
    { label: 'Secondary', args: { variant: 'secondary', icon: 'printer' }, slot: 'Print receipt' },
    { label: 'Ghost', args: { variant: 'ghost' }, slot: 'Back' },
    { label: 'Ghost · danger', args: { variant: 'ghost', tone: 'danger' }, slot: 'Remove discount' },
    { label: 'Link', args: { variant: 'link' }, slot: 'Email it instead' },
    { label: 'Stacked secondary', args: { variant: 'secondary', stacked: true, icon: 'pause-circle' }, slot: 'Park' },
    { label: 'Stacked · danger', args: { variant: 'secondary', stacked: true, tone: 'danger', icon: 'trash-2' }, slot: 'Clear' },
  ], { columns: 'repeat(auto-fit, minmax(180px, 1fr))' }),
}

export const Sizes: Story = {
  render: grid({ PosButton }, [
    { label: 'md · 44', args: { size: 'md' }, slot: 'Charge' },
    { label: 'lg · 52 (Charge)', args: { size: 'lg', block: true }, slot: 'Charge $111.90' },
    { label: 'Icon-only md', args: { variant: 'secondary', icon: 'plus', 'aria-label': 'Increase quantity' } },
    { label: 'Icon-only lg', args: { variant: 'secondary', size: 'lg', icon: 'minus', 'aria-label': 'Decrease quantity' } },
  ], { columns: 'repeat(auto-fit, minmax(200px, 1fr))' }),
}

export const States: Story = {
  render: grid({ PosButton }, [
    { label: 'Enabled', args: { size: 'lg', block: true }, slot: 'Charge $111.90' },
    { label: 'Disabled (empty cart)', args: { size: 'lg', block: true, disabled: true }, slot: 'Charge $0.00' },
    { label: 'Disabled secondary', args: { variant: 'secondary', disabled: true, icon: 'printer' }, slot: 'Print' },
    { label: 'Submit', args: { type: 'submit' }, slot: 'Save details' },
  ], { columns: 'repeat(auto-fit, minmax(220px, 1fr))' }),
}
