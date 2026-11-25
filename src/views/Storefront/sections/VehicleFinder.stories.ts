import type { Meta, StoryObj } from '@storybook/vue3'
import { isolateStorage } from '@/stories/decorators'
import { createSection } from '@/storefront/themeSections'
import type { ThemeSection } from '@/storefront/themeSections'
import { provideTorqline, torqline, torqlineFrame } from '../product/productStoryFixtures'
import FeaturedProducts from './FeaturedProducts.vue'
import VehicleFinder from './VehicleFinder.vue'

// Torqline's home page sections that follow the shopper's vehicle.
const home = torqline.theme.templates.home
const finder = home.find((s) => s.kind === 'vehicle-finder')!
const popular = home.find((s) => s.kind === 'featured-products' && s.settings.vehicle === true)!
const f150 = { year: 2019, make: 'Ford', model: 'F-150' }

const meta = {
  title: 'Product/Storefront/Vehicle finder',
  component: VehicleFinder,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### Overview
An auto-parts store's home page hero (Torqline): the \`vehicle-finder\` section. A photograph with
the headline and a line, then a panel with the **Year → Make → Model** selects in a row
(StorefrontVehicleSelector). Find parts saves the vehicle for the store and opens every part, where
the list shows the parts that fit.

With \`partNumberSearch\`, and once the store can search (Merchandise Cloud connected), the panel
also takes a part number ("TQ-BRK-4471"): the search page sends an exact one straight to its part.
The first banner on the page names it (h1). Settings: \`headline\`, \`subheadline\`, \`image\`,
\`partNumberSearch\`; the theme builder offers the section on the sections drawing.

**Popular parts** (\`featured-products\` with \`vehicle: true\`): with a vehicle chosen, the row
lists the parts that fit it, then the universal ones, and its heading names the vehicle. Without
one, the setting changes nothing.

Out of system on purpose (P4-8): sections draw with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [torqlineFrame('1280px', '0'), provideTorqline(), isolateStorage],
  args: { section: finder, headingLevel: 1 },
} satisfies Meta<typeof VehicleFinder>

export default meta
type Story = StoryObj<typeof meta>

/** Torqline's hero: no vehicle chosen yet. */
export const Default: Story = {}

/** The shopper's 2019 Ford F-150 already chosen: the selects start on it. */
export const WithVehicle: Story = {
  decorators: [provideTorqline(f150)],
}

/** A new section as the builder adds it: no photo yet, on the store's quiet panel colour. */
export const NoPhoto: Story = {
  args: { section: createSection('vehicle-finder', {}, 'story-vehicle-finder') as ThemeSection, headingLevel: 2 },
}

/** On a phone: the selects stack and the button takes the width. */
export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  decorators: [torqlineFrame('375px', '0')],
}

/** Popular parts with no vehicle: the store's first four. */
export const PopularParts: Story = {
  render: () => ({
    components: { FeaturedProducts },
    setup: () => ({ section: popular }),
    template: '<FeaturedProducts :section="section" />',
  }),
}

/** Popular parts for the shopper's 2019 Ford F-150: the parts that fit it, then the universal ones. */
export const PopularPartsForAVehicle: Story = {
  decorators: [provideTorqline(f150)],
  render: () => ({
    components: { FeaturedProducts },
    setup: () => ({ section: popular }),
    template: '<FeaturedProducts :section="section" />',
  }),
}
