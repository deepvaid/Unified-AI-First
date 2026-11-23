import type { Meta, StoryObj } from '@storybook/vue3'
import type { FitState, Vehicle } from '@/storefront/fitment'
import StorefrontFitBanner from './StorefrontFitBanner.vue'
import { provideTorqline, torqlineFrame } from './product/productStoryFixtures'

const f150: Vehicle = { year: 2019, make: 'Ford', model: 'F-150' }
const STATES: { state: FitState; vehicle: Vehicle | null }[] = [
  { state: 'fits', vehicle: f150 },
  { state: 'no-fit', vehicle: f150 },
  { state: 'universal', vehicle: f150 },
  { state: 'unknown', vehicle: null },
]

const meta = {
  title: 'Product/Storefront/StorefrontFitBanner',
  component: StorefrontFitBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Whether a part fits the shopper's vehicle, on an auto-parts store (Torqline): the banner under the
product page's title and, \`compact\`, the line in quick add. Shown here in Torqline's theme.

### Behaviour
- The words are \`fitLabel\`'s (src/storefront/fitment.ts), the same on every card, page and cart line:
  **Fits your 2019 Ford F-150**, **Doesn’t fit your 2019 Ford F-150**, **Universal fit**, **Check fit**.
- An icon always goes with the words, so the state is never told by colour alone.
- The full banner adds one line: what the fitting rows say (\`detail\`: "Front", "Driver 22 in,
  passenger 22 in"), what the vehicle takes when the choice made doesn't fit ("Your vehicle takes:
  …"), where to look when the part doesn't fit, what universal means, that a part lists no vehicles
  yet, and **Change vehicle** or **Select vehicle**, which open the store's vehicle drawer
  (\`chooseVehicle\`). Compact keeps the words, the \`detail\` line, and Select vehicle while no
  vehicle is chosen.

### Colour
Fixed pairs, not the theme's, so a fit reads the same on any store. Each paints its own fill and
ink; every ink also passes 4.5:1 on white and on a \`#f2f3f5\` panel: fits \`#146c2e\` on
\`#e6f4ea\`, doesn't fit \`#8a4b00\` on \`#fdf0d5\`, universal \`#3d434a\` on \`#eceef1\`, check fit
\`#17191c\` on white.

Out of system on purpose (P4-8): a storefront part, not Marobase chrome.
        `,
      },
    },
  },
  decorators: [torqlineFrame('560px'), provideTorqline(f150)],
  args: { state: 'fits', vehicle: f150, compact: false },
} satisfies Meta<typeof StorefrontFitBanner>

export default meta
type Story = StoryObj<typeof meta>

/** The part fits the shopper's 2019 Ford F-150. */
export const Default: Story = {}

/** The four states, as the product page shows them. */
export const AllStates: Story = {
  render: () => ({
    components: { StorefrontFitBanner },
    setup: () => ({ STATES }),
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <StorefrontFitBanner v-for="s in STATES" :key="s.state" :state="s.state" :vehicle="s.vehicle" />
      </div>
    `,
  }),
}

/** Compact, as quick add shows it: the words, and Select vehicle while none is chosen. */
export const Compact: Story = {
  render: () => ({
    components: { StorefrontFitBanner },
    setup: () => ({ STATES }),
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <StorefrontFitBanner v-for="s in STATES" :key="s.state" :state="s.state" :vehicle="s.vehicle" compact />
      </div>
    `,
  }),
}

/** On the store's quiet panel (#f2f3f5): every ink still reads. */
export const OnASurface: Story = {
  render: () => ({
    components: { StorefrontFitBanner },
    setup: () => ({ STATES }),
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px; padding: 16px; background: var(--sf-surface);">
        <StorefrontFitBanner v-for="s in STATES" :key="s.state" :state="s.state" :vehicle="s.vehicle" compact />
      </div>
    `,
  }),
}

/** Once a choice is made: a 16 in wiper on a truck that takes 22 in, and the line saying what it takes. */
export const ChoiceDoesNotFit: Story = {
  args: { state: 'no-fit', detail: 'Your vehicle takes: Driver 22 in, passenger 22 in' },
}

/** A vehicle chosen, but the part lists no vehicles yet (a new product): no Select vehicle, a way forward instead. */
export const NoVehiclesListed: Story = {
  args: { state: 'unknown' },
}
