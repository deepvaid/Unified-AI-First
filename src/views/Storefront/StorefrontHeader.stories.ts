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

- **Classic** — every theme but the sections drawing's (Vitaheal, Atlas, Neelam's Aurora): the markup
  the storefront has always drawn, unchanged.
- **Sections** — a theme with \`styles.drawing: 'sections'\` (Northfold, Torqline). The theme's
  **header section** decides it:
  - \`menuStyle\`: **Inline** (wordmark and menu in one row), **Centered** (wordmark over the menu),
    **Minimal** (wordmark and a menu button on every screen);
  - \`sticky\`: the header stays at the top while the page scrolls, on a desktop;
  - \`colorScheme\`: **Light**, or **Dark** (the brand colour, with a focus ring in its ink).

Search shows only while the store can search (Merchandise Cloud connected). On a phone the menu
opens in a \`StorefrontDrawer\`: the shop's own links large, then the store's pages, account and cart.
The checkout gets the logo and "Secure checkout" only.

### A11y
- The wordmark is the home link; every icon button has a name ("Cart, 2 items" when it has some)
  and a 44px target; the menu button says it opens a dialog and whether it is open.
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
