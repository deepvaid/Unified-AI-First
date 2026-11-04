import type { Meta, StoryObj } from '@storybook/vue3'
import PosProductTile from './PosProductTile.vue'
import { posStock } from './posArt'
import { grid } from '@/stories/storyTemplate'
import { posSurface } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosProductTile',
  component: PosProductTile,
  tags: ['autodocs'],
  decorators: [posSurface],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A product in the register grid — artwork, name, one quiet line (variant, variant list or SKU) and the
price, already formatted for the store. Short stock shows on the artwork (\`posStock(qty, 'tile')\`), so a
shortage is seen before it is tapped; a healthy tile carries no badge. Figma kit: **Product Card**.

Two modes: on the Sale screen a tap adds to the sale (no \`selected\`); on the Products screen a tap picks
the product for the details panel — pass \`selected\` and it renders \`aria-pressed\`.

**Hold** the tile (450ms without moving) and it emits \`hold\` instead of \`click\` — the register opens a
quick look there. It sinks slightly while held, so the cashier sees the press charging, and ticks on
Android. \`inSale\` shows "N in sale" once the product is on the sale. It takes the "N variants" pill's
place, since a three-column tablet grid (tiles near 100px) has room for one flag; the meta line still lists the variants.

### A11y
- **Provides:** one button per tile, the accessible name is the visible name, meta, price and "N in sale";
  artwork initials are hidden; selection via \`aria-pressed\`; \`hold\` also fires on right-click and
  Shift+F10 / the Menu key, and a long press never selects text.
- **Consumer must:** keep \`price\` formatted for the store's currency and locale; make whatever \`hold\`
  opens reachable another way too (the Products screen shows the same stock).
        `,
      },
    },
  },
  args: { name: 'Classic crew tee', meta: 'Black · White', price: 'from $39.00', seed: 'TEE-001-BLK-M', variants: 2 },
} satisfies Meta<typeof PosProductTile>

export default meta
type Story = StoryObj<typeof meta>

const columns = 'repeat(auto-fit, minmax(200px, 1fr))'

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ PosProductTile }, [
    { label: 'One variant', args: { name: 'Slim denim', meta: 'Dark, 32', price: '$129.00', seed: 'JEAN-512-DRK-32', variants: 1 } },
    { label: 'Several variants', args: {} },
    { label: 'Products screen (icon, SKU)', args: { name: 'Cap', meta: 'CAP-001-NVY', price: '$35.00', seed: 'CAP-001-NVY', variants: 1, icon: 'package' } },
  ], { columns, itemClass: 'w-100' }),
}

export const Sizes: Story = {
  parameters: { docs: { description: { story: 'One size: the grid sets the width, the artwork band is `component.pos.tileImageHeight` (88). Long names clamp to two lines.' } } },
  render: grid({ PosProductTile }, [
    { label: 'Narrow column', args: { name: 'Merino wool quarter-zip pullover with thumb loops', meta: 'Charcoal, M', price: '$189.00', seed: 'KNIT-9', variants: 1 } },
    { label: 'Wide column', args: { name: 'Leather tote', meta: 'Black', price: '$249.00', seed: 'BAG-LTH-BLK', variants: 1 } },
  ], { columns: '180px 280px', itemClass: 'w-100' }),
}

export const States: Story = {
  render: grid({ PosProductTile }, [
    { label: 'Low stock', args: { name: 'Leather tote', meta: 'Black', price: '$249.00', seed: 'BAG-LTH-BLK', variants: 1, stock: posStock(2, 'tile') } },
    { label: 'Out of stock', args: { name: 'Court sneaker', meta: 'White, 10', price: '$159.00', seed: 'SNEAK-A1-WHT-10', variants: 1, stock: posStock(0, 'tile') } },
    { label: 'In sale', args: { name: 'Cap', meta: 'Navy', price: '$35.00', seed: 'CAP-001-NVY', variants: 1, inSale: 2 } },
    { label: 'In sale, several variants', args: { inSale: 3 } },
    { label: 'Selected', args: { name: 'Slim denim', meta: 'JEAN-512-DRK-32', price: '$129.00', seed: 'JEAN-512-DRK-32', variants: 1, icon: 'package', selected: true } },
    { label: 'Not selected', args: { name: 'Field jacket', meta: 'JACK-220-OLI-M', price: '$219.00', seed: 'JACK-220-OLI-M', variants: 1, icon: 'package', selected: false } },
  ], { columns, itemClass: 'w-100' }),
}
