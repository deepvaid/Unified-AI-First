import type { Meta, StoryObj } from '@storybook/vue3'
import { overlayDocs } from '@/stories/decorators'
import { searchStore } from '@/storefront/search'
import { DEFAULT_GRID } from '@/storefront/listing'
import StorefrontProductListing from './StorefrontProductListing.vue'
import { northfoldCollection, northfoldProducts, northfoldStore } from './listingStoryFixtures'
import { northfold, storefrontFrame } from './storefrontStoryFixtures'

const women = northfoldCollection('Women')
const page = storefrontFrame('100%', '0')

/** What "jumper" finds on Northfold, with its search rules: the sweaters, by the "sweater" synonym. */
const merch = northfold.merchandising
const jumper = searchStore('jumper', northfoldProducts, {
  synonyms: merch.synonyms,
  redirects: merch.redirects,
  pins: merch.searchPins,
  hiddenProductIds: [],
})

const meta = {
  title: 'Product/Storefront/StorefrontProductListing',
  component: StorefrontProductListing,
  tags: ['autodocs'],
  parameters: {
    // Each story keeps its filters in its own URL, so each gets its own frame on the docs page.
    ...overlayDocs('900px'),
    docs: {
      ...overlayDocs('900px').docs,
      description: {
        component: `
### Overview
A product list on a store with the richer theme drawing (Northfold, Torqline): the **collection
page** and the **search results**. Shown here with Northfold's own products and theme. The classic
drawing keeps its own pages, so Vitaheal, Atlas and Neelam are unchanged.

### Anatomy
- **Title and intro** (the collection's description from Products › Collections), and a \`#lead\`
  slot under them (the search box on the search page).
- **Toolbar**: the result count ("5 of 12 styles") and **Sort by** (Featured, or Most relevant on
  search; Newest; Price, low to high; Price, high to low; Name).
- **Filters** from what the products have (StorefrontFilters): a rail on a desktop; on a tablet or
  phone a **Filter and sort (2)** button opens them in a sheet with the sort, **Clear all** and
  **Show 5 styles**.
- **Chips**, one per filter in use ("Size M ×", named "Remove filter Size M"), and **Clear all**.
  After a chip is removed, focus goes to the chip now in its place, else to the count.
- **Cards** (StorefrontListingCard) with quick add (StorefrontQuickAdd). Products sold out in every
  variant go last.
- **No match**: "No styles match these filters. Try removing a filter." with **Clear all filters**.
  An empty list shows the page's \`#empty\` slot.

### Behaviour
- Filters and sort live in the **URL** (\`?size=m&color=black&sort=price-asc\`): a filtered list can be
  shared and reloaded, Back undoes the last change, and the page's own keys (search's \`q\`) stay.
- Each change is said to screen readers ("5 of 12 styles", "Sorted by price, low to high").
- What it calls its products follows them: styles (clothes in sizes), parts (fitment), products.
- \`settings\` is the collection template's product grid: \`filters\`, \`sort\`, \`quickAdd\`, \`columns\`.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  args: {
    products: women,
    title: 'Women',
    intro: 'Tees, shirts, knitwear, coats and trousers for women.',
    settings: { ...DEFAULT_GRID },
  },
} satisfies Meta<typeof StorefrontProductListing>

export default meta
type Story = StoryObj<typeof meta>

/** The Women collection, nothing chosen yet. */
export const Default: Story = {
  decorators: [page, northfoldStore()],
}

/** Size M and Black chosen: five of twelve styles, with their chips; the cards lead with their black photos. */
export const Filtered: Story = {
  decorators: [page, northfoldStore({ size: 'm', color: 'black' })],
}

/** Sorted by price, high to low. */
export const SortedByPrice: Story = {
  decorators: [page, northfoldStore({ sort: 'price-desc' })],
}

/** A filter nothing matches: the empty state offers to clear it. */
export const NothingMatches: Story = {
  decorators: [page, northfoldStore({ color: 'sage' }, 'collections/knitwear')],
  args: {
    products: northfoldCollection('Knitwear'),
    title: 'Knitwear',
    intro: 'Merino, lambswool and cotton knits for women and men.',
  },
}

/** Search results for "jumper": the best match first, and the sort says so. */
export const SearchResults: Story = {
  decorators: [page, northfoldStore({ q: 'jumper' }, 'search')],
  args: {
    products: jumper.products,
    title: 'Results for “jumper”',
    intro: 'Including results for sweater and pullover.',
    page: 'search',
  },
}

/** On a phone: two cards to a row, and the filters and sort in the Filter and sort sheet. */
export const Phone: Story = {
  decorators: [page, northfoldStore({ size: 'm' })],
  globals: { viewport: { value: 'mobile375', isRotated: false } },
}
