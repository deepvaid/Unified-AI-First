import type { Meta, StoryObj } from '@storybook/vue3'
import StoreLaunchChecklist from './StoreLaunchChecklist.vue'
import { launchChecklist } from '@/storefront/storeLaunch'
import type { LaunchFacts } from '@/storefront/storeLaunch'
import { constrain } from '@/stories/decorators'

// A store made from the Daybloom theme, as its page reads it.
const FROM_THEME: LaunchFacts = {
  name: 'Sunday Wellness',
  brand: 'Daybloom',
  locations: ['Oxford Warehouse'],
  products: 10,
  theme: 'Daybloom 1.0',
  countries: 5,
  paymentMethods: ['Stripe'],
  domain: 'sunday-wellness.maropost.store',
  confirmed: [],
}

const meta = {
  title: 'Product/Sales Channels/StoreLaunchChecklist',
  component: StoreLaunchChecklist,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
**Launch your store**: the eight steps that take a store made with Create sales channel to launch, on
the store's Overview (where other stores have "Finish setup"). In order: a location, the first product,
the store's name and logo, a theme, shipping, taxes, payments, the store's address.

The steps come from \`launchChecklist\` in \`src/storefront/storeLaunch.ts\`:

- **Five are read from the store itself** (it has a product, a published theme, a way to pay…). Each says
  what is true now and leads to where it is done.
- **Three have nothing to read** (name and logo, shipping, taxes): the merchant presses **Mark as done**.
  What is marked is kept in this browser with the store's other data, and forgotten when the store is
  restored or deleted.

With every step done, the card says the store is ready to launch.

### Behaviour
- A step's buttons sit **under** its words, never beside them: the card is often a narrow column.
- \`run\` is emitted with where a button leads; \`confirm\` with the step marked done. The page does both.

### A11y
- An ordered list. Each step starts with "Done:" or "To do:" for a screen reader; the icon is decoration.
- Every button is named with its step: "Mark as done: Check your shipping".
- The progress bar is named "5 of 8 launch steps done".
        `,
      },
    },
  },
  decorators: [constrain('compact')],
  args: { steps: launchChecklist(FROM_THEME), canView: true },
} satisfies Meta<typeof StoreLaunchChecklist>

export default meta
type Story = StoryObj<typeof meta>

/** A store made from a theme: five steps done from the start, three for the merchant to check. */
export const Default: Story = {}

/** A blank store: its first product and its theme are still to do, and there is no store to view yet. */
export const BlankStore: Story = {
  args: {
    steps: launchChecklist({ ...FROM_THEME, name: 'New store', brand: 'New store', locations: ['Oxford warehouse', 'Main Warehouse - FL', 'Retail Hub - TX'], products: 0, theme: null, domain: 'new-store.maropost.store' }),
    canView: false,
  },
}

/** No way to pay yet: the step says what that means for shoppers. */
export const WithoutPayments: Story = {
  args: { steps: launchChecklist({ ...FROM_THEME, paymentMethods: [], confirmed: ['branding', 'shipping'] }) },
}

/** Every step done: the store is ready to launch. */
export const ReadyToLaunch: Story = {
  args: { steps: launchChecklist({ ...FROM_THEME, confirmed: ['branding', 'shipping', 'taxes'] }) },
}
