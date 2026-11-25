import type { Meta, StoryObj } from '@storybook/vue3'
import { isolateStorage, overlayDocs } from '@/stories/decorators'
import StorefrontHeader from './StorefrontHeader.vue'
import { withStorefront } from './sections/storyContext'

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

- **Classic** — every theme but the sections drawing's (Daybloom, Atlas, Neelam's Aurora): the
  markup the storefront has always drawn.
- **Sections** — a theme with \`styles.drawing: 'sections'\` (Vitaheal, Northfold, Torqline, Lumos).
  The theme's **header section** decides it:
  - \`menuStyle\`: **Inline** (wordmark and menu in one row), **Centered** (wordmark over the menu),
    **Minimal** (wordmark and a menu button on every screen);
  - \`sticky\`: the header stays at the top while the page scrolls, on a desktop;
  - \`colorScheme\`: **Light**, or **Dark** (the brand colour, with a focus ring in its ink).

In both drawings a menu link that carries a \`menu\` (Vitaheal's "Shop" and "About", Daybloom's
"Shop" and "Learn") is a button that opens a **mega menu** (\`StorefrontMegaPanel\`): a panel of
link columns under the header's menu row, the page's full width, with an optional picture tile. It
paints its own surface, so a dark header does not reach it. In the phone menu, and in the sections
drawing's drawer, the same link opens its columns in place (no picture tile).

Search shows only while the store can search (Merchandise Cloud connected). On a phone the menu
opens in a \`StorefrontDrawer\`: the shop's own links large, then the store's pages, account and cart.
The checkout gets the logo and "Secure checkout" only.

The store's chrome adds two things (Lumos):
- \`headerSearch: 'field'\`: search as a visible field (the theme's field: its control height, a
  hairline that turns its accent on focus, the store's placeholder, the magnifier as its button) in
  the bar on a wide screen, and in a row of its own under the bar, the full width, where the menu
  needs the bar (1240px and narrower), and always in the Centered style.
- A **wishlist** (\`'wishlist'\` among \`headerTools\`): a heart beside the cart, leading to \`/wishlist\`,
  with how many saved products the store still sells ("Wishlist, 2 items").

### A11y
- The wordmark is the home link; every icon button has a name ("Cart, 2 items" when it has some)
  and a 44px target; the menu button says it opens a dialog and whether it is open.
- The drawer is a modal dialog: focus stays inside, **Esc** closes it, focus returns to the button.
- A mega menu is a disclosure, not a dialog: its button says whether it is open (\`aria-expanded\`)
  and names its panel; **Tab** walks on into the panel's links; **Esc** closes it and returns to the
  button; a press outside, or the keyboard moving on, closes it too. A mouse opens it on hover.

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

/** Daybloom's header: the classic drawing with a mega menu. "Shop" is open: goals, formats, more ways to shop, and a picture tile. */
export const ClassicWithMegaMenu: Story = {
  decorators: [withStorefront({ channelId: 'daybloom-demo' })],
  parameters: overlayDocs('560px'),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    canvasElement.querySelector<HTMLElement>('.sf-nav__trigger')?.click()
  },
}

/** Vitaheal's header on the sections drawing: Inline, sticky, light. "Shop" is open: goals, more ways to shop, and a picture tile. */
export const SectionsWithMegaMenu: Story = {
  decorators: [withStorefront({ channelId: 'vitaheal-demo' })],
  parameters: overlayDocs('600px'),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    canvasElement.querySelector<HTMLElement>('.sf-nav__trigger')?.click()
  },
}

/** Vitaheal's menu on a phone: "Shop" opens its columns in place, then the pages, account and cart. */
export const SectionsMenuOpenPhone: Story = {
  decorators: [withStorefront({ channelId: 'vitaheal-demo' })],
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  parameters: overlayDocs('720px'),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    canvasElement.querySelector<HTMLElement>('button[aria-label="Menu"]')?.click()
    await new Promise((resolve) => setTimeout(resolve, 300))
    const group = canvasElement.ownerDocument.querySelector<HTMLDetailsElement>('.sfh-drawer__group')
    if (group) group.open = true
  },
}
