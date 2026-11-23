import { inject, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { overlayDocs } from '@/stories/decorators'
import { vehicleLabel } from '@/storefront/fitment'
import StorefrontVehicleDrawer from './StorefrontVehicleDrawer.vue'
import { STOREFRONT } from './storefrontContext'
import { provideTorqline, torqlineFrame } from './product/productStoryFixtures'

/** A storefront button, as Torqline's theme draws one. */
const BUTTON = 'min-height: 44px; padding: 0 20px; border: 1px solid var(--sf-text); border-radius: var(--sf-radius); background: transparent; color: var(--sf-text); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer;'

/** The drawer with the button that opens it, and the vehicle as the store keeps it. */
const render = (startOpen: boolean) => () => ({
  components: { StorefrontVehicleDrawer },
  setup() {
    const storefront = inject(STOREFRONT)!
    return { open: ref(startOpen), storefront, vehicleLabel, BUTTON }
  },
  template: `
    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px;">
      <button type="button" :style="BUTTON" aria-haspopup="dialog" @click="open = true">
        {{ storefront.vehicle.value ? vehicleLabel(storefront.vehicle.value) : 'Select vehicle' }}
      </button>
      <p style="margin: 0;">Vehicle: {{ storefront.vehicle.value ? vehicleLabel(storefront.vehicle.value) : 'none chosen' }}</p>
      <StorefrontVehicleDrawer v-model="open" />
    </div>
  `,
})

const meta = {
  title: 'Product/Storefront/StorefrontVehicleDrawer',
  component: StorefrontVehicleDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The vehicle selector in a \`StorefrontDrawer\`, on an auto-parts store (Torqline). StorefrontLayout
mounts it once, for a store that sells parts, and opens it from anywhere through \`chooseVehicle\`:
the header's vehicle chip, a list's "Change", the fit banner's Select vehicle, the chat.

### Behaviour
- Each opening starts the selects on the vehicle the store has now.
- **Save vehicle** keeps it for the store (the browser tab's session), closes the drawer and, once
  focus is back on the page, says "Showing parts for 2019 Ford F-150" to screen readers.
- **Clear vehicle** forgets it ("Vehicle cleared"). It shows only while a vehicle is chosen.
- A modal dialog: focus stays inside, **Esc** closes it, focus returns to what opened it.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [torqlineFrame('480px'), provideTorqline()],
  render: render(false),
} satisfies Meta<typeof StorefrontVehicleDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** Closed, with the button that opens it. */
export const Default: Story = {}

/** Open, nothing chosen yet. */
export const Open: Story = {
  parameters: overlayDocs('640px'),
  render: render(true),
}

/** Open on the vehicle chosen before, with Clear vehicle. */
export const WithVehicle: Story = {
  parameters: overlayDocs('640px'),
  decorators: [provideTorqline({ year: 2019, make: 'Ford', model: 'F-150' })],
  render: render(true),
}
