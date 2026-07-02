import type { Meta, StoryObj } from '@storybook/vue3'
import MpFolderSelect from './MpFolderSelect.vue'
import type { Folder } from '@/stores/useFolders'

const sampleFolders: Folder[] = [
  { id: 'promotions', name: 'Promotions', parentId: null, scope: 'campaigns' },
  { id: 'seasonal', name: 'Seasonal', parentId: null, scope: 'campaigns' },
  { id: 'black-friday', name: 'Black Friday', parentId: 'seasonal', scope: 'campaigns' },
  { id: 'automated', name: 'Automated', parentId: null, scope: 'campaigns' },
  { id: 'newsletter', name: 'Newsletter', parentId: null, scope: 'campaigns' },
]

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
nesting rendered by indentation, and a "Manage folders" action at the bottom.

### 🟢 Do's
- **Do** place it in \`MpDataTableToolbar\`'s \`#actions\` slot, next to search.
- **Do** pass counts that include child items in the parent's count.
- **Do** wire \`@manage\` to open \`MpManageFoldersDrawer\`.

### 🔴 Don'ts
- **Don't** use it as primary navigation — folders filter the current page's items only.
- **Don't** nest more than one level; the store enforces a single parent/child depth.
        `,
      },
    },
  },
} satisfies Meta<typeof MpFolderSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    folders: sampleFolders,
    counts: { promotions: 7, seasonal: 5, 'black-friday': 2, automated: 5, newsletter: 1 },
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

export const EmptyScope: Story = {
  args: {
    folders: [],
    counts: {},
    totalCount: 0,
    modelValue: null,
  },
}
