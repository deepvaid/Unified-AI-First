import type { Meta, StoryObj } from '@storybook/vue3'
import MpFolderSelect from './MpFolderSelect.vue'
import MpDataTableToolbar from './MpDataTableToolbar.vue'
import MpStatusChip from './MpStatusChip.vue'
import { CAMPAIGNS, CAMPAIGN_HEADERS, FOLDERS, FOLDER_COUNTS } from '@/stories/fixtures'
import type { Folder } from '@/stores/useFolders'

const sampleFolders: Folder[] = [
  { id: 'promotions', name: 'Promotions', parentId: null, scope: 'campaigns' },
  { id: 'seasonal', name: 'Seasonal', parentId: null, scope: 'campaigns' },
  { id: 'black-friday', name: 'Black Friday', parentId: 'seasonal', scope: 'campaigns' },
  { id: 'automated', name: 'Automated', parentId: null, scope: 'campaigns' },
  { id: 'newsletter', name: 'Newsletter', parentId: null, scope: 'campaigns' },
]

const sampleCounts = { promotions: 7, seasonal: 5, 'black-friday': 2, automated: 5, newsletter: 1 }

const meta = {
  title: 'Molecules/MpFolderSelect',
  component: MpFolderSelect,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpFolderSelect\` is a toolbar dropdown that filters a table or grid by folder — the traditional
replacement for a persistent folder-tree side panel. Folders are treated as **metadata filtering**,
not navigation: the dropdown shows "All folders" by default, per-folder item counts, one level of
nesting rendered by indentation, and a "Manage folders" action at the bottom. The activator button
shows the selected folder's name.

**Use when:** a list view's items are organized into folders (campaigns, content, images) and
users need to narrow the table to one folder.

**Don't use when:** folders are the page's primary navigation (use the sidebar), or the items
have no folder metadata (use \`MpFilterTabs\` or the filter drawer).

### Usage
\`\`\`html
<MpFolderSelect
  v-model="folderId"
  :folders="foldersStore.foldersByScope('campaigns')"
  :counts="countsByFolder"
  :total-count="campaigns.length"
  @manage="manageFoldersOpen = true"
/>
\`\`\`

### 🟢 Do's
- **Do** place it in \`MpDataTableToolbar\`'s \`#actions\` slot, next to search.
- **Do** pass counts that include child items in the parent's count.
- **Do** wire \`@manage\` to open \`MpManageFoldersDrawer\`.

### 🔴 Don'ts
- **Don't** use it as primary navigation — folders filter the current page's items only.
- **Don't** nest more than one level; the store enforces a single parent/child depth.

### 💡 Best Practices
- **Empty scope:** with zero folders the menu still shows "All folders" and "Manage folders",
  so users can bootstrap their first folder from here.
- **Model:** \`v-model\` is the folder id (\`string\`) or \`null\` for "All folders".

### A11y
- **Provides:** the activator is a real button and Vuetify's \`v-menu\` adds
  \`aria-haspopup\`/\`aria-expanded\`; the menu closes on Escape and restores focus; the list has
  \`aria-label="Folders"\` and items are keyboard-navigable \`v-list-item\`s; counts are visible text.
- **Consumer must:** keep folder names short and unique — the name is each option's only label.
- **Provides (Phase 4):** the activator's \`aria-label\` is dynamic ("Filter by folder: X"), so
  screen readers hear both the control's purpose and the current selection; the selected option
  carries \`aria-current="true"\` in addition to active styling.
- **Gaps:** child indentation is visual only — nesting is not announced (backlog).
        `,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'text', description: 'v-model — selected folder id, or null for "All folders".' },
    folders: { control: 'object', description: 'Flattened folder list: parents followed by their children (see useFoldersStore.foldersByScope).' },
    counts: { control: 'object', description: 'Item counts per folder id. A parent\'s count should include its children\'s items.' },
    totalCount: { control: 'number', description: 'Count shown next to "All folders".' },
    label: { control: 'text', description: 'Activator text when nothing is selected. Defaults to "All folders".' },
    manage: { control: false, description: 'Event — "Manage folders" clicked. Open MpManageFoldersDrawer.', table: { category: 'events' } },
  },
} satisfies Meta<typeof MpFolderSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    folders: sampleFolders,
    counts: sampleCounts,
    totalCount: 25,
    modelValue: null,
  },
}

export const WithSelection: Story = {
  args: {
    ...Default.args,
    modelValue: 'seasonal',
  },
}

/** Zero folders — the menu still offers "All folders" and "Manage folders" to bootstrap the first one. */
export const EmptyScope: Story = {
  args: {
    folders: [],
    counts: {},
    totalCount: 0,
    modelValue: null,
  },
}

/**
 * The menu opened automatically: "All folders" with the total count, one nested child
 * ("Black Friday" under "Seasonal", indented with a corner icon), per-folder counts, and
 * the "Manage folders" action at the bottom.
 */
export const OpenMenu: Story = {
  args: {
    folders: sampleFolders,
    counts: sampleCounts,
    totalCount: 25,
    modelValue: 'black-friday',
  },
  render: (args) => ({
    components: { MpFolderSelect },
    setup: () => ({ args }),
    template: `
      <div style="min-height: 420px;">
        <MpFolderSelect v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Filter by folder"]')
    trigger?.click()
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * One structure — an outlined activator opening a folder menu. What varies is the tree it is
 * given: flat, nested (children render with a `corner-down-right` glyph and a deeper inset),
 * and empty.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpFolderSelect },
    setup: () => ({
      flat: FOLDERS.filter(f => !f.parentId),
      nested: FOLDERS,
      counts: FOLDER_COUNTS,
    }),
    template: `
      <div class="d-flex ga-10 flex-wrap">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">flat</div>
          <MpFolderSelect :folders="flat" :counts="counts" :total-count="102" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">nested</div>
          <MpFolderSelect :folders="nested" :counts="counts" :total-count="102" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">empty — only "All folders" and Manage</div>
          <MpFolderSelect :folders="[]" :total-count="0" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no `size` prop. The activator resolves to `component.control.height` (40) so it
 * lines up with the Filter button and search field it sits beside in a table toolbar — Phase 4
 * (P4-7) replaced its `height="40"` attribute with the token, which is the same number stated
 * as a decision rather than a literal.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpFolderSelect },
    setup: () => ({ folders: FOLDERS, counts: FOLDER_COUNTS }),
    template: `
      <div class="d-flex align-center ga-3 flex-wrap">
        <MpFolderSelect :folders="folders" :counts="counts" :total-count="102" />
        <v-btn variant="outlined" class="text-none" prepend-icon="list-filter">Filter</v-btn>
        <v-text-field variant="outlined" density="comfortable" hide-details placeholder="Search…" style="max-width: 220px" />
        <div class="text-caption text-medium-emphasis">← all --mp-component-control-height</div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Nothing selected (shows the `label`), a folder selected (shows its name), and a child selected. */
export const States: Story = {
  render: () => ({
    components: { MpFolderSelect },
    setup: () => ({ folders: FOLDERS, counts: FOLDER_COUNTS }),
    template: `
      <div class="d-flex ga-10 flex-wrap">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">no selection</div>
          <MpFolderSelect :model-value="null" :folders="folders" :counts="counts" :total-count="102" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">parent selected</div>
          <MpFolderSelect model-value="f-promos" :folders="folders" :counts="counts" :total-count="102" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">child selected</div>
          <MpFolderSelect model-value="f-winback" :folders="folders" :counts="counts" :total-count="102" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">custom label</div>
          <MpFolderSelect :model-value="null" :folders="folders" :counts="counts" :total-count="102" label="All campaigns" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** Where this component actually lives: the `#actions` slot of a table toolbar,
 * filtering the list below it. Its activator and the toolbar's other controls all resolve to
 * one control height, so the row reads as a single band rather than three sizes.
 */
export const InContextCampaignsToolbar: Story = {
  render: () => ({
    components: { MpFolderSelect, MpDataTableToolbar, MpStatusChip },
    setup: () => ({
      folders: FOLDERS,
      counts: FOLDER_COUNTS,
      rows: CAMPAIGNS,
      headers: CAMPAIGN_HEADERS,
    }),
    template: `
      <v-card flat border rounded="lg">
        <MpDataTableToolbar title="Campaigns" :total-count="rows.length" search-placeholder="Search campaigns…">
          <template #actions>
            <MpFolderSelect :folders="folders" :counts="counts" :total-count="102" />
          </template>
        </MpDataTableToolbar>
        <v-data-table :headers="headers" :items="rows" item-value="id" hide-default-footer>
          <template #item.status="{ item }">
            <MpStatusChip :status="item.status" type="campaign" size="sm" />
          </template>
        </v-data-table>
      </v-card>
    `,
  }),
  args: {} as never,
}
