import type { Meta, StoryObj } from '@storybook/vue3'
import MpSectionRail from './MpSectionRail.vue'
import type { MpSectionRailGroup, MpSectionRailSwitchOption } from './MpSectionRail.vue'

// The Storybook memory router resolves every path to the catch-all route named
// "StorybookRoute" — items with match: ['StorybookRoute'] render as active.

const storeEditorGroups: MpSectionRailGroup[] = [
  {
    items: [
      { slug: 'overview', label: 'Overview', icon: 'layout-dashboard', to: '/store/overview' },
      { slug: 'theme', label: 'Theme', icon: 'palette', to: '/store/theme' },
      { slug: 'navigation', label: 'Navigation', icon: 'list-tree', to: '/store/navigation', match: ['StorybookRoute'] },
      { slug: 'pages', label: 'Pages', icon: 'file-text', to: '/store/pages' },
      { slug: 'blogs', label: 'Blogs', icon: 'rss', to: '/store/blogs' },
      { slug: 'campaigns', label: 'Campaigns', icon: 'megaphone', to: '/store/campaigns' },
      { slug: 'assets', label: 'Assets', icon: 'image', to: '/store/assets', count: 28 },
    ],
  },
]

const switcherOptions: MpSectionRailSwitchOption[] = [
  { id: 'beta', label: 'Beta Sales Channel', caption: 'beta-2000290.uat.maropost.store', icon: 'globe' },
  { id: 'max', label: 'Max Test Store', caption: 'max-test.uat.maropost.store', icon: 'globe' },
]

const settingsGroups: MpSectionRailGroup[] = [
  {
    title: 'Account',
    items: [
      { slug: 'defaults', label: 'Account defaults', to: '/settings/defaults', match: ['StorybookRoute'] },
      { slug: 'users', label: 'Users & permissions', to: '/settings/users', count: 6 },
      { slug: 'billing', label: 'Billing', to: '/settings/billing', external: true },
    ],
  },
  {
    title: 'Connections',
    items: [
      { slug: 'api', label: 'API keys', to: '/settings/api' },
      { slug: 'webhooks', label: 'HTTP Post URLs', to: '/settings/webhooks' },
    ],
  },
  {
    title: 'DNS setup',
    items: [
      { slug: 'sending', label: 'Sending domains', to: '/settings/sending' },
      { slug: 'tracking', label: 'Link tracking domains', to: '/settings/tracking' },
    ],
  },
]

const meta: Meta<typeof MpSectionRail> = {
  title: 'Navigation/MpSectionRail',
  component: MpSectionRail,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'In-content section rail for shell layouts — the workspace pattern used by the store editor and Settings. Two flavors: **entity** (identity card + switcher, e.g. a store) and **module** (title + search, e.g. Settings). Composes a back link, identity + switcher menu, search filter, grouped links with icons/counts/external glyphs and an active accent bar, plus a #footer slot for actions. The global AppSidebar auto-minimizes while a rail shell is on screen.',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div style="display: flex; height: 560px; border: 1px solid var(--hairline); border-radius: 8px; overflow: hidden;"><story /><div style="flex: 1; background: rgb(var(--v-theme-background));" /></div>',
    }),
  ],
}

export default meta
type Story = StoryObj<typeof MpSectionRail>

/** Entity flavor — the store editor: back link, identity card with switcher, icon sections, count chip. */
export const StoreEditor: Story = {
  args: {
    ariaLabel: 'Store editor navigation',
    backTo: '/sales-channels',
    backLabel: 'All sales channels',
    identity: { name: 'Atlas Outfitters', caption: 'atlas-outfitters.uat.maropost.store', icon: 'globe' },
    switcherOptions,
    switcherLabel: 'Switch store',
    groups: storeEditorGroups,
  },
}

/** Module flavor — Settings: plain title, search filter, grouped text links, count + external glyph. */
export const SettingsFlavor: Story = {
  args: {
    ariaLabel: 'Settings navigation',
    title: 'Settings',
    searchable: true,
    searchPlaceholder: 'Search Settings',
    groups: settingsGroups,
  },
}

/** Footer slot carrying a primary action button, on top of the entity flavor. */
export const WithFooterAction: Story = {
  args: {
    ariaLabel: 'Store editor navigation',
    backTo: '/sales-channels',
    backLabel: 'All sales channels',
    identity: { name: 'Atlas Outfitters', caption: 'atlas-outfitters.uat.maropost.store' },
    switcherOptions,
    switcherLabel: 'Switch store',
    groups: storeEditorGroups,
  },
  render: (args) => ({
    components: { MpSectionRail },
    setup: () => ({ args }),
    template: `
      <MpSectionRail v-bind="args">
        <template #footer>
          <v-btn color="primary" variant="flat" size="small" block prepend-icon="external-link" class="text-none">
            View live store
          </v-btn>
        </template>
      </MpSectionRail>
    `,
  }),
}

/** Everything at once — back link, identity + switcher, search, grouped icon links with counts, footer button. */
export const AllElements: Story = {
  args: {
    ariaLabel: 'Workspace navigation',
    backTo: '/back',
    backLabel: 'All workspaces',
    identity: { name: 'Atlas Outfitters', caption: 'Web store · Published', icon: 'store' },
    switcherOptions,
    switcherLabel: 'Switch workspace',
    searchable: true,
    searchPlaceholder: 'Search sections',
    groups: [
      { title: 'Storefront', items: storeEditorGroups[0]!.items.slice(0, 5) },
      {
        title: 'Growth',
        items: [
          { slug: 'campaigns', label: 'Campaigns', icon: 'megaphone', to: '/store/campaigns', count: 3 },
          { slug: 'assets', label: 'Assets', icon: 'image', to: '/store/assets', count: 28 },
          { slug: 'help', label: 'Help center', icon: 'circle-help', to: '/help', external: true },
        ],
      },
    ],
  },
  render: (args) => ({
    components: { MpSectionRail },
    setup: () => ({ args }),
    template: `
      <MpSectionRail v-bind="args">
        <template #footer>
          <v-btn color="primary" variant="flat" size="small" block prepend-icon="plus" class="text-none">
            Add section
          </v-btn>
        </template>
      </MpSectionRail>
    `,
  }),
}
