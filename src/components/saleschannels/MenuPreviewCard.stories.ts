import type { Meta, StoryObj } from '@storybook/vue3'
import MenuPreviewCard from './MenuPreviewCard.vue'
import { createMenuItem, type StoreMenu } from '@/stores/useStoreNavigation'

function mainMenu(): StoreMenu {
  return {
    id: 'story-main-menu',
    channelId: 'story-channel',
    name: 'Main menu',
    handle: 'main-menu',
    status: 'Active',
    updatedAt: 'Jul 8, 2026',
    items: [
      createMenuItem({ title: 'Home', linkType: 'homepage' }, 'story-mi-home'),
      createMenuItem({ title: 'Shop all', linkType: 'collection-list' }, 'story-mi-shop'),
      createMenuItem({ title: 'New arrivals', linkType: 'collection', target: 'col-new-arrivals' }, 'story-mi-new'),
      createMenuItem({ title: 'Blog', linkType: 'blog' }, 'story-mi-blog'),
    ],
  }
}

function footerMenu(): StoreMenu {
  return {
    id: 'story-footer-menu',
    channelId: 'story-channel',
    name: 'Footer menu',
    handle: 'footer-menu',
    status: 'Active',
    updatedAt: 'Jul 2, 2026',
    items: [
      createMenuItem({ title: 'Search', linkType: 'search' }, 'story-mi-search'),
      createMenuItem({ title: 'Privacy policy', linkType: 'page', target: 'page-privacy' }, 'story-mi-privacy'),
      createMenuItem({ title: 'Contact', linkType: 'url', target: 'https://example.com/contact' }, 'story-mi-contact'),
    ],
  }
}

function emptyMenu(): StoreMenu {
  return {
    id: 'story-empty-menu',
    channelId: 'story-channel',
    name: 'New menu',
    handle: '',
    status: 'Inactive',
    updatedAt: '',
    items: [],
  }
}

const meta: Meta<typeof MenuPreviewCard> = {
  title: 'Product/Sales Channels/MenuPreviewCard',
  component: MenuPreviewCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Live mini storefront preview used by the store Navigation menu editor. Auto-selects the header or footer variant from the menu handle/name; each link tooltips its resolved destination.',
      },
    },
  },
  argTypes: {
    menu: {
      control: 'object',
      description:
        '`StoreMenu` — `{ handle, name, items }`. Items render in order; an empty `title` falls back to "Untitled" and is styled as a placeholder. The card picks header vs footer layout automatically when `handle` or `name` contains "footer"; the toggle overrides it.',
    },
    storeName: {
      control: 'text',
      description: 'Store name shown in the simulated storefront chrome. Defaults to "Your store".',
    },
  },
}

export default meta
type Story = StoryObj<typeof MenuPreviewCard>

export const HeaderMenu: Story = {
  args: { menu: mainMenu(), storeName: 'Atlas Outfitters' },
}

export const FooterMenu: Story = {
  args: { menu: footerMenu(), storeName: 'Atlas Outfitters' },
}

export const EmptyMenu: Story = {
  args: { menu: emptyMenu(), storeName: 'Atlas Outfitters' },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a card previewing a storefront menu. Its variants are the menu positions: header and footer. */
export const Variants: Story = {
  render: (args) => ({
    components: { MenuPreviewCard },
    setup: () => ({ args }),
    template: `<MenuPreviewCard v-bind="args" />`,
  }),
}

/** There is no `size` prop — the card spans its column. Its inset is `component.card.*`, so it sits on the same edge as every other card on the page. */
export const Sizes: Story = {
  render: (args) => ({
    components: { MenuPreviewCard },
    setup: () => ({ args }),
    template: `<MenuPreviewCard v-bind="args" />`,
  }),
}

/** Populated and empty — a menu with no items yet. */
export const States: Story = {
  render: (args) => ({
    components: { MenuPreviewCard },
    setup: () => ({ args }),
    template: `<MenuPreviewCard v-bind="args" />`,
  }),
}
