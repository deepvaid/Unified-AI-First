import type { Meta, StoryObj } from '@storybook/vue3'
import MpFolderSelect from './MpFolderSelect.vue'
import type { Folder } from '@/stores/useFolders'
import { darkModeGlobals } from '@/stories/storybookTheme'

const sampleFolders: Folder[] = [
  { id: 'promotions', name: 'Promotions', parentId: null, scope: 'campaigns' },
  { id: 'seasonal', name: 'Seasonal', parentId: null, scope: 'campaigns' },
  { id: 'black-friday', name: 'Black Friday', parentId: 'seasonal', scope: 'campaigns' },
  { id: 'automated', name: 'Automated', parentId: null, scope: 'campaigns' },
  { id: 'newsletter', name: 'Newsletter', parentId: null, scope: 'campaigns' },
]

const sampleCounts = { promotions: 7, seasonal: 5, 'black-friday': 2, automated: 5, newsletter: 1 }

const meta = {
  title: 'Data Display/MpFolderSelect',
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

/** Folder menu trigger on the dark theme. */
export const DarkMode: Story = {
  ...WithSelection,
  globals: darkModeGlobals,
}
