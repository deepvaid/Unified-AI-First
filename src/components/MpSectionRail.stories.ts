import type { Meta, StoryObj } from '@storybook/vue3'
import MpSectionRail from './MpSectionRail.vue'
import MpListRow from './MpListRow.vue'
import MpPageHeader from './MpPageHeader.vue'
import MpSectionHeader from './MpSectionHeader.vue'
import type { MpSectionRailGroup, MpSectionRailSwitchOption } from './MpSectionRail.vue'
import { railFrame } from '@/stories/decorators'

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
  title: 'Molecules/MpSectionRail',
  component: MpSectionRail,
  tags: ['autodocs'],
  parameters: {
    canvas: 'full',
    docs: {
      description: {
        component: `
### Overview
\`MpSectionRail\` is the in-content 260px section rail for shell layouts (store editor,
Settings-style workspaces) — sits beside the global \`AppSidebar\`, never replaces it. Two
flavors: **entity** (identity card + switcher menu, e.g. a store) and **module** (plain title,
e.g. "Settings"). Composes an optional back link, identity/switcher or title, optional search
filter, grouped links with icons/counts/external glyphs and an active accent bar, plus a
\`#footer\` slot for a pinned action.

**Use when:** building a workspace shell with its own persistent section navigation (store
editor sections, Settings sub-pages) alongside the global sidebar.

**Don't use when:** the navigation is the page's primary/global navigation (use \`AppSidebar\`),
or there's only 2-3 destinations (inline tabs or \`MpFilterTabs\` are lighter).

### Usage
\`\`\`html
<MpSectionRail
  aria-label="Store editor navigation"
  back-to="/sales-channels"
  back-label="All sales channels"
  :identity="{ name: 'Atlas Outfitters', caption: 'atlas-outfitters.uat.maropost.store', icon: 'globe' }"
  :switcher-options="otherStores"
  switcher-label="Switch store"
  :groups="storeEditorGroups"
  @switch="switchStore"
>
  <template #footer>
    <v-btn color="primary" variant="flat" block prepend-icon="external-link">View live store</v-btn>
  </template>
</MpSectionRail>
\`\`\`

### 🟢 Do's
- **Do** set route meta (\`railShell\`/\`storeEditor\`) on pages that mount this rail — the global
  \`AppSidebar\` auto-minimizes while it's on screen.
- **Do** pass a domain-specific \`ariaLabel\` ("Store editor navigation", "Settings navigation").
- **Do** use \`match\` arrays on each item so the rail stays highlighted across an item's own child routes/editors.

### 🔴 Don'ts
- **Don't** exceed ~7-8 items per group before grouping under a \`title\` — the nav scrolls internally but scanning suffers.
- **Don't** mix the entity and module flavors on the same rail — pick \`identity\`+\`switcherOptions\` or \`title\`, not both.

### A11y
- **Provides:** the root is an \`<aside>\` landmark named by \`ariaLabel\`; the section list is a
  \`<nav>\`; the active item gets \`aria-current="page"\`; the switcher trigger has an
  \`aria-label\` from \`switcherLabel\`; the search input has an \`aria-label\` matching its
  placeholder.
- **Consumer must:** keep \`ariaLabel\` specific to the workspace, and give every item a distinct \`label\`.
- **Gaps:** the active state's left accent bar is decorative only — \`aria-current="page"\` is the
  real signal for assistive tech, so this is not a color-only gap; the search input filters items
  live but doesn't announce the result count to screen readers.
        `,
      },
    },
  },
  argTypes: {
    ariaLabel: { control: 'text', description: 'Required accessible name for the rail\'s `<aside>` landmark, e.g. "Store editor navigation".' },
    groups: { control: 'object', description: 'Section groups: `{ title?, items: [{ slug, label, icon?, to, match?, count?, external? }] }[]`. `match` lists route names that keep the item highlighted.' },
    title: { control: 'text', description: 'Plain heading for the module flavor (e.g. "Settings"). Mutually exclusive with `identity`.' },
    backTo: { control: 'text', description: 'Route target for the optional back link above the rail content.' },
    backLabel: { control: 'text', description: 'Back link text. Default: "Back".' },
    identity: { control: 'object', description: 'Entity identity card `{ name, caption?, icon? }` for the entity flavor (e.g. a store). Mutually exclusive with `title`.' },
    switcherOptions: { control: 'object', description: 'Other entities the user can jump to; renders the switcher menu on the identity card. Only relevant with `identity` set.' },
    switcherLabel: { control: 'text', description: 'Accessible name and menu subheader for the switcher trigger. Default: "Switch".' },
    searchable: { control: 'boolean', description: 'Show the inline search field that filters items (and hides empty groups) client-side.' },
    searchPlaceholder: { control: 'text', description: 'Search input placeholder and accessible label. Default: "Search".' },
    switch: { control: false, description: 'Event — emitted with the picked `switcherOptions` id when a switcher menu item is clicked.', table: { category: 'events' } },
    footer: { control: false, description: 'Slot — pinned below the section list, typically a primary action button.', table: { category: 'slots' } },
  },
  decorators: [railFrame()],
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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * The rail's two flavors, side by side. **Module** (a plain `title`, optional `searchable`,
 * text-only rows) is what Settings uses; **entity** (`identity` + `switcherOptions` + a
 * `backTo` link, icon rows) is what the store editor and Merchandising use. Same component,
 * same row geometry — only the head of the rail differs.
 *
 * Phase 4 (P4-7) deleted `SettingsSidebar.vue`, which was a near-verbatim copy of this
 * component at its own item height. The module flavor below is what replaced it.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpSectionRail },
    setup: () => ({ settings: [
        { title: 'Your Preferences', items: [
          { slug: 'general', label: 'General', to: '/general', match: ['General'] },
          { slug: 'notifications', label: 'Notifications', to: '/notifications', match: ['Notifications'] },
        ]},
        { title: 'Account Management', items: [
          { slug: 'defaults', label: 'Account Defaults', to: '/defaults', match: ['Defaults'] },
          { slug: 'billing', label: 'Account & Billing', to: '/billing', match: ['Billing'], external: true },
          { slug: 'users', label: 'Users', to: '/users', match: ['Users'], count: 24 },
          { slug: 'roles', label: 'Roles & Permissions', to: '/roles', match: ['Roles'] },
        ]},
        { title: 'Platform Setup', items: [
          { slug: 'connections', label: 'Connections', to: '/connections', match: ['Connections'] },
          { slug: 'dns', label: 'DNS Setup', to: '/dns', match: ['DNS'] },
          { slug: 'integrations', label: 'Integrations', to: '/integrations', match: ['Integrations'] },
        ]},
      ], store: [
        { items: [{ slug: 'overview', label: 'Overview', icon: 'layout-dashboard', to: '/overview', match: ['Overview'] }] },
        { title: 'Customize', items: [{ slug: 'theme', label: 'Theme', icon: 'palette', to: '/theme', match: ['Theme'] }] },
        { title: 'Store content', items: [
          { slug: 'pages', label: 'Pages', icon: 'file-text', to: '/pages', match: ['Pages'], count: 12 },
          { slug: 'menus', label: 'Menus', icon: 'menu', to: '/menus', match: ['Menus'] },
          { slug: 'blogs', label: 'Blogs', icon: 'newspaper', to: '/blogs', match: ['Blogs'], count: 4 },
          { slug: 'domains', label: 'Domains', icon: 'globe', to: '/domains', match: ['Domains'] },
        ]},
      ] }),
    template: `
      <div class="d-flex ga-8 align-stretch" style="min-height: 520px">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">module flavor — title + search, text rows</div>
          <MpSectionRail ariaLabel="Settings navigation" title="Settings" searchable search-placeholder="Search Settings" :groups="settings" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">entity flavor — back link, identity + switcher, icon rows</div>
          <MpSectionRail
            ariaLabel="Store editor navigation"
            back-to="/channels"
            back-label="All sales channels"
            :identity="{ name: 'Northwind Supply', caption: 'northwind.example.com', icon: 'globe' }"
            :switcher-options="[{ id: 'b', label: 'Northwind Outlet', caption: 'outlet.example.com', icon: 'globe' }]"
            switcher-label="Switch store"
            :groups="store"
          />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no `size` prop — the rail is a fixed 260px column (`layout.sectionRailWidth`) and
 * stretches to its shell's height. Its rows are `component.listItem.*`: the same 40px floor,
 * 8px block padding and 12px inline inset that `AppSidebar`, `MpListRow` and the app bar's
 * menu rows use. Shown here against a plain button and a list row so the shared baseline is
 * visible.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpSectionRail, MpListRow },
    setup: () => ({ settings: [
        { title: 'Your Preferences', items: [
          { slug: 'general', label: 'General', to: '/general', match: ['General'] },
          { slug: 'notifications', label: 'Notifications', to: '/notifications', match: ['Notifications'] },
        ]},
        { title: 'Account Management', items: [
          { slug: 'defaults', label: 'Account Defaults', to: '/defaults', match: ['Defaults'] },
          { slug: 'billing', label: 'Account & Billing', to: '/billing', match: ['Billing'], external: true },
          { slug: 'users', label: 'Users', to: '/users', match: ['Users'], count: 24 },
          { slug: 'roles', label: 'Roles & Permissions', to: '/roles', match: ['Roles'] },
        ]},
        { title: 'Platform Setup', items: [
          { slug: 'connections', label: 'Connections', to: '/connections', match: ['Connections'] },
          { slug: 'dns', label: 'DNS Setup', to: '/dns', match: ['DNS'] },
          { slug: 'integrations', label: 'Integrations', to: '/integrations', match: ['Integrations'] },
        ]},
      ] }),
    template: `
      <div class="d-flex ga-8 align-start" style="min-height: 480px">
        <MpSectionRail ariaLabel="Settings navigation" title="Settings" :groups="settings" />
        <div class="pt-4" style="min-width: 280px">
          <div class="text-caption text-medium-emphasis mb-2">the same 40px baseline, outside the rail</div>
          <div class="d-flex flex-column ga-3">
            <v-btn variant="outlined" class="text-none" block>A button</v-btn>
            <v-text-field variant="outlined" density="comfortable" hide-details placeholder="A form field" />
            <MpListRow variant="boxed" title="A list row" />
          </div>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * Row states: resting, active (accent bar + primary label + `aria-current="page"`), a count
 * chip, an external-link row, and the empty result of a search that matches nothing. Tab
 * through the rail to see the focus ring.
 */
export const States: Story = {
  render: () => ({
    components: { MpSectionRail },
    setup: () => ({
      groups: [
        { title: 'Row states', items: [
          { slug: 'resting', label: 'Resting row', icon: 'circle', to: '/resting', match: ['Nope'] },
          { slug: 'active', label: 'Active row', icon: 'circle-check', to: '/active', match: ['ActiveRoute'] },
          { slug: 'count', label: 'With a count', icon: 'inbox', to: '/count', match: ['Nope'], count: 24 },
          { slug: 'external', label: 'Leaves this shell', icon: 'credit-card', to: '/ext', match: ['Nope'], external: true },
          { slug: 'long', label: 'A section name long enough to need truncating', icon: 'file-text', to: '/long', match: ['Nope'] },
        ]},
      ],
    }),
    template: `
      <div class="d-flex ga-8 align-start" style="min-height: 420px">
        <MpSectionRail ariaLabel="Row states" title="States" :groups="groups" />
        <div class="pt-4 text-body-2 text-medium-emphasis" style="max-width: 320px">
          The active row is decided by <code>route.name ∈ item.match</code>, so it lights up on a
          section's child routes too. Its accent bar is held off the row's ends by
          <code>component.nav.activeBarInset</code> — the same mark, at the same inset, in every rail.
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The Settings workspace as it actually renders: the rail beside a real
 * settings page. This is the flavor that replaced `SettingsSidebar` in Phase 4 — the rail
 * already had `title` and `searchable` for exactly this, and Retail and Merchandising were
 * already using it.
 */
export const InContextSettingsWorkspace: Story = {
  render: () => ({
    components: { MpSectionRail, MpPageHeader, MpSectionHeader },
    setup: () => ({ groups: [
        { title: 'Your Preferences', items: [
          { slug: 'general', label: 'General', to: '/general', match: ['General'] },
          { slug: 'notifications', label: 'Notifications', to: '/notifications', match: ['Notifications'] },
        ]},
        { title: 'Account Management', items: [
          { slug: 'defaults', label: 'Account Defaults', to: '/defaults', match: ['Defaults'] },
          { slug: 'billing', label: 'Account & Billing', to: '/billing', match: ['Billing'], external: true },
          { slug: 'users', label: 'Users', to: '/users', match: ['Users'], count: 24 },
          { slug: 'roles', label: 'Roles & Permissions', to: '/roles', match: ['Roles'] },
        ]},
        { title: 'Platform Setup', items: [
          { slug: 'connections', label: 'Connections', to: '/connections', match: ['Connections'] },
          { slug: 'dns', label: 'DNS Setup', to: '/dns', match: ['DNS'] },
          { slug: 'integrations', label: 'Integrations', to: '/integrations', match: ['Integrations'] },
        ]},
      ] }),
    template: `
      <div class="d-flex align-stretch" style="min-height: 560px; border: 1px solid var(--border-subtle); border-radius: var(--mp-component-card-radius); overflow: hidden">
        <MpSectionRail ariaLabel="Settings navigation" title="Settings" searchable search-placeholder="Search Settings" :groups="groups" />
        <div class="flex-grow-1 pa-6" style="min-width: 0; background: var(--surface-canvas)">
          <MpPageHeader eyebrow="Settings · Your Preferences" title="General" subtitle="Personal information and global preferences. These apply only to you." />
          <v-card flat border rounded="lg" class="mt-6 pa-5">
            <MpSectionHeader title="Personal Info" />
            <div class="d-flex ga-4 mt-4">
              <v-text-field label="First name" model-value="Ross Andrew" variant="outlined" density="comfortable" hide-details />
              <v-text-field label="Last name" model-value="Paquette" variant="outlined" density="comfortable" hide-details />
            </div>
            <div class="d-flex ga-4 mt-4">
              <v-text-field label="Email" model-value="ross@maropost.com" variant="outlined" density="comfortable" hide-details />
              <v-select label="Timezone" model-value="America/New_York" :items="['America/New_York','UTC']" variant="outlined" density="comfortable" hide-details />
            </div>
          </v-card>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}
