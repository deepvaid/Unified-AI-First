import { onUnmounted } from 'vue'
import type { Decorator, Meta, StoryObj } from '@storybook/vue3'
import { useCommerceStore } from '@/stores/useCommerce'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { isolateStorage, overlayDocs } from '@/stories/decorators'
import StorefrontHeader from './StorefrontHeader.vue'
import { withStorefront } from './sections/storyContext'
import { storefrontProducts } from './storefrontCatalog'

const meta = {
  title: 'Product/Storefront/StorefrontHeader',
  component: StorefrontHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### Overview
The storefront's announcement bar and header, shown here in Northfold's theme. It has two drawings:

- **Classic** — every theme but the sections drawing's (Vitaheal, Atlas, Neelam's Aurora): the markup
  the storefront has always drawn, unchanged.
- **Sections** — a theme with \`styles.drawing: 'sections'\` (Northfold, Torqline, Lumos, Aurora). The
  theme's **header section** decides it:
  - \`menuStyle\`: **Inline** (wordmark and menu in one row), **Centered** (wordmark over the menu),
    **Minimal** (wordmark and a menu button on every screen), **Stacked** (Aurora, below);
  - \`sticky\`: the header stays at the top while the page scrolls, on a desktop;
  - \`colorScheme\`: **Light**, or **Dark** (the brand colour, with a focus ring in its ink).

Search shows only while the store can search (Merchandise Cloud connected). On a phone the menu
opens in a \`StorefrontDrawer\`: the shop's own links large, then the store's pages, account and cart.
The checkout gets the logo and "Secure checkout" only.

The store's chrome adds two things (Lumos):
- \`headerSearch: 'field'\`: search as a visible field (the theme's field: its control height, a
  hairline that turns its accent on focus, the store's placeholder, the magnifier as its button) in
  the bar on a wide screen, and in a row of its own under the bar, the full width, where the menu
  needs the bar (1240px and narrower).
- A **wishlist** (\`'wishlist'\` among \`headerTools\`): a heart beside the cart, leading to \`/wishlist\`,
  with how many saved products the store still sells ("Wishlist, 2 items").

### Stacked (Aurora)
UAT Aurora's header, \`menuStyle: 'Stacked'\`, shown on Aurora Outdoor (demo). Row one: the store's
social links at the start (the header's \`social\` toggle; X gets its own mark), the wordmark in the
middle, then search and the tools at the end, the account, heart and cart drawn filled, the cart's
count in the theme's sale colour. Row two: the menu, centred, 20px in the heading face. No hairline
under it. With \`headerSearch: 'pill'\` search is a pill (the theme's control border, 150–200px
wide) in the bar down to a tablet.

On a phone (900px and narrower): the menu button, the wordmark in the middle and the three tools; the
search field the full width under them, its corners square; no social links or menu row. The menu
button opens the drawer from the start of the page, its links in capitals between hairlines.

### A11y
- The wordmark is the home link; every icon button has a name ("Cart, 2 items" when it has some)
  and a 44px target (40px on a phone in the Stacked style); the menu button says it opens a dialog
  and whether it is open. Social links are named for their network ("Facebook").
- The drawer is a modal dialog: focus stays inside, **Esc** closes it, focus returns to the button.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [withStorefront(), isolateStorage],
} satisfies Meta<typeof StorefrontHeader>

export default meta
type Story = StoryObj<typeof meta>

/** Northfold's header: Inline, light, not sticky, under the announcement bar. */
export const Default: Story = {}

/** The wordmark over the menu. */
export const Centered: Story = {
  decorators: [withStorefront({ header: { menuStyle: 'Centered' } })],
}

/** The wordmark and a menu button, on a desktop too. */
export const Minimal: Story = {
  decorators: [withStorefront({ header: { menuStyle: 'Minimal' } })],
}

/** The brand colour, with its own ink and focus ring. */
export const Dark: Story = {
  decorators: [withStorefront({ header: { colorScheme: 'Dark' } })],
}

/** Search as a field and a wishlist heart, as Lumos's chrome asks for them, here on Northfold's theme. */
export const SearchFieldAndWishlist: Story = {
  decorators: [withStorefront({ chrome: { headerSearch: 'field', headerTools: ['account', 'wishlist'], searchPlaceholder: 'Search the store' } })],
}

/** Aurora Outdoor (demo): its theme's header is Stacked, with its social links on. */
const AURORA = 'aurora-demo'
const aurora = withStorefront({ channelId: AURORA })

/** Two headlamps in Aurora's cart for the story (the cart's count shows), and the cart as it was after it. */
const withTwoInCart: Decorator = (story) => ({
  components: { story },
  setup() {
    const cart = useStorefrontCartStore()
    const headlamp = storefrontProducts(useCommerceStore().products, AURORA).find((p) => p.name === 'Night Trail Headlamp')
    const before = cart.carts[AURORA]
    cart.carts[AURORA] = []
    if (headlamp) cart.add(AURORA, headlamp, 2)
    onUnmounted(() => {
      if (before) cart.carts[AURORA] = before
      else delete cart.carts[AURORA]
    })
    return {}
  },
  template: '<story />',
})

/** Aurora's header: social links, the wordmark in the middle, the search pill and filled tools; the menu centred under them. */
export const Stacked: Story = {
  decorators: [aurora, withTwoInCart],
}

/** Aurora's header on a phone: menu button, wordmark, tools, and the search the full width under them. */
export const StackedOnAPhone: Story = {
  decorators: [aurora, withTwoInCart],
  globals: { viewport: { value: 'mobile375', isRotated: false } },
}

/** Aurora's menu open on a phone: the drawer comes in from the start of the page, its links in capitals. */
export const StackedMenuOpen: Story = {
  decorators: [aurora],
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  parameters: overlayDocs('720px'),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    canvasElement.querySelector<HTMLElement>('button[aria-label="Menu"]')?.click()
  },
}

/** A store that cannot search yet: no search icon, so it never leads to a page that cannot search. */
export const WithoutSearch: Story = {
  decorators: [withStorefront({ unsearchable: true })],
}

/** The menu open, as on a phone: the shop's links large, then the pages, account and cart. */
export const MenuOpen: Story = {
  decorators: [withStorefront({ header: { menuStyle: 'Minimal' } })],
  parameters: overlayDocs('720px'),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    canvasElement.querySelector<HTMLElement>('button[aria-label="Menu"]')?.click()
  },
}

/** Vitaheal's header: the classic drawing, exactly as before the sections drawing. */
export const Classic: Story = {
  decorators: [withStorefront({ channelId: 'vitaheal-demo' })],
}
