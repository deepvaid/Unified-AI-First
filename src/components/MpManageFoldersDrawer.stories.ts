import { onBeforeUnmount, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpManageFoldersDrawer from './MpManageFoldersDrawer.vue'
import { useFoldersStore } from '@/stores/useFolders'

const meta = {
  title: 'Forms/MpManageFoldersDrawer',
  component: MpManageFoldersDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpManageFoldersDrawer\` is a right-side drawer (480px, wraps \`MpFormDrawer\`) for full folder
CRUD within a scope: create (with optional one-level nesting under a parent), inline rename, and
delete with confirmation. Deleting a folder promotes its subfolders to the top level and emits
\`deleted(folderId)\` so the owning view can re-file affected items to "All folders". Folder data
lives in the global \`useFolders\` store — the drawer reads and writes it directly.

**Use when:** users need to create, rename, nest, or delete folders for a scope — opened from a
page header button or \`MpFolderSelect\`'s "Manage folders" action.

**Don't use when:** picking a folder for one item (\`MpMoveToFolderDialog\`) or filtering by
folder (\`MpFolderSelect\`).

### Usage
\`\`\`html
<MpManageFoldersDrawer
  v-model="manageOpen"
  scope="campaigns"
  :counts="countsByFolder"
  @deleted="id => campaignsStore.reassignFolder(id, null)"
/>
\`\`\`

### 🟢 Do's
- **Do** open it from the page header's "Manage Folders" button and from \`MpFolderSelect\`'s
  "Manage folders" action.
- **Do** listen for \`@deleted\` and call the item store's \`reassignFolder\`.
- **Do** pass \`counts\` — the per-folder item count is what makes deletion decisions safe.

### 🔴 Don'ts
- **Don't** use a centered dialog for this — folder management is a form surface and follows the
  drawer convention.
- **Don't** write to the folders store from the view while the drawer is open; the drawer owns
  folder CRUD.

### A11y
- **Provides:** inherits \`MpFormDrawer\`'s dialog semantics (\`role="dialog"\`, \`aria-modal\`,
  labelled title, focus trap, Escape-close, focus restore); rename/delete/save/cancel icon buttons
  all carry \`aria-label\`s; the rename field autofocuses and commits on Enter / cancels on Escape;
  delete is gated behind a confirmation dialog that names the folder.
- **Consumer must:** handle \`@deleted\` so items don't silently point at a dead folder id.
- **Gaps:** the delete confirmation is a raw \`v-dialog\` without \`aria-labelledby\`; entering
  rename mode replaces the row content, and focus context ("which folder am I renaming?") relies
  on the autofocused field having no label; the "No folders yet" empty text is not a live region
  (noted for the Phase 4 a11y pass).
        `,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — drawer visibility.' },
    scope: { control: 'select', options: ['campaigns', 'contents', 'images'], description: 'Folder scope read from (and written to) the global useFolders store.' },
    counts: { control: 'object', description: 'Item counts per folder id, shown next to each folder name.' },
    deleted: { control: false, description: 'Event — fired with the folder id after deletion so the view can re-file its items.', table: { category: 'events' } },
  },
  render: (args) => ({
    components: { MpManageFoldersDrawer },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:640px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="folder-cog" @click="open = true">Manage folders</v-btn>
        <MpManageFoldersDrawer v-bind="args" v-model="open" />
      </section>
    `,
  }),
} satisfies Meta<typeof MpManageFoldersDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Campaigns: Story = {
  args: {
    modelValue: true,
    scope: 'campaigns',
    counts: { 'cmp-promotions': 7, 'cmp-seasonal': 5, 'cmp-black-friday': 2, 'cmp-automated': 5 },
  },
}

export const Images: Story = {
  args: {
    modelValue: true,
    scope: 'images',
    counts: { 'img-banners': 3, 'img-products': 3, 'img-lifestyle': 2, 'img-logos': 2 },
  },
}

/** The contents scope, whose seed data includes a nested child ("Holiday 2026" under "Campaigns"). */
export const NestedFolders: Story = {
  args: {
    modelValue: true,
    scope: 'contents',
    counts: { 'cnt-templates': 4, 'cnt-campaigns': 6, 'cnt-holiday': 2, 'cnt-automation': 3 },
  },
}

/**
 * Zero folders in the scope — the list shows the "No folders yet" hint and the create form
 * becomes the only affordance.
 *
 * The story temporarily empties the images scope in the shared folders store and restores it on
 * unmount; it is excluded from the docs page so it can't race the other stories' seeded state.
 */
export const EmptyFolderList: Story = {
  args: {
    modelValue: true,
    scope: 'images',
    counts: {},
  },
  parameters: { docs: { disable: true } },
  render: (args) => ({
    components: { MpManageFoldersDrawer },
    setup() {
      const store = useFoldersStore()
      const removed = store.folders.filter(f => f.scope === 'images')
      store.folders = store.folders.filter(f => f.scope !== 'images')
      onBeforeUnmount(() => {
        store.folders = [...store.folders, ...removed]
      })
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:640px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="folder-cog" @click="open = true">Manage folders</v-btn>
        <MpManageFoldersDrawer v-bind="args" v-model="open" />
      </section>
    `,
  }),
}
