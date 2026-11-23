import { computed, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { emptyFilters, facetGroups, toggleFilter } from '@/storefront/facets'
import type { FacetKey, ListingFilters } from '@/storefront/facets'
import StorefrontFilters from './StorefrontFilters.vue'
import { northfoldCollection, northfoldProducts } from './listingStoryFixtures'
import { storefrontFrame } from './storefrontStoryFixtures'

const NOUN = { one: 'style', other: 'styles' }
/** As wide as the rail beside a desktop list. */
const rail = storefrontFrame('260px')

/** The panel over a set of products, choosing as a shopper would (the list puts the choices in the URL). */
function panel(products: typeof northfoldProducts, start: Partial<ListingFilters> = {}, layout: 'rail' | 'sheet' = 'rail') {
  return () => ({
    components: { StorefrontFilters },
    setup() {
      const filters = ref<ListingFilters>({ ...emptyFilters(), ...start })
      const groups = computed(() => facetGroups(products, filters.value, { currency: 'USD' }))
      const toggle = (key: FacetKey, value: string) => { filters.value = toggleFilter(filters.value, key, value) }
      return { groups, toggle, layout, noun: NOUN }
    },
    template: '<StorefrontFilters :groups="groups" :noun="noun" :layout="layout" @toggle="toggle" />',
  })
}

const meta = {
  title: 'Product/Storefront/StorefrontFilters',
  component: StorefrontFilters,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The filter panel of a product list on a store with the richer theme drawing (Northfold, Torqline),
from what the products have (\`src/storefront/facets.ts\`): **Category, Size, Color, Price** and
**Brand**. A group with one value says nothing and is left out. Shown here over Northfold's products.

StorefrontProductListing shows it as a **rail** beside the products on a desktop, and in its
**Filter and sort** sheet on a phone (\`layout="sheet"\`: 44px rows).

### Behaviour
- Each group is a disclosure (a button with \`aria-expanded\`), with **real checkboxes**: Tab moves
  between them, Space ticks one, and values of one group can be combined.
- **Sizes** are boxes like the product page's; **colours** carry their swatch.
- Each value says how many products it would list with the other filters as they are
  ("Black, 5 styles" for screen readers). A value that would list none is unavailable unless chosen.
- A long list (colours) shows its first six and **Show all 15**.
- It emits \`toggle(key, value)\`; the list puts the change in the URL, so Back undoes it.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  args: { groups: facetGroups(northfoldCollection('Women'), emptyFilters(), { currency: 'USD' }), noun: NOUN },
} satisfies Meta<typeof StorefrontFilters>

export default meta
type Story = StoryObj<typeof meta>

/** The Women collection's filters, as a desktop rail. Ticking a value updates the counts. */
export const Default: Story = {
  decorators: [rail],
  render: panel(northfoldCollection('Women')),
}

/** Size M and Black chosen: the counts follow, and values that would list nothing are unavailable. */
export const WithChoices: Story = {
  decorators: [rail],
  render: panel(northfoldCollection('Women'), { size: ['m'], color: ['black'] }),
}

/** Every product: Category leads, and the colour list shows its first six. */
export const AllProducts: Story = {
  decorators: [rail],
  render: panel(northfoldProducts),
}

/** In the phone's Filter and sort sheet: rows and size boxes are 44px touch targets. */
export const PhoneSheet: Story = {
  decorators: [storefrontFrame('375px', '16px')],
  render: panel(northfoldCollection('Men'), {}, 'sheet'),
}
