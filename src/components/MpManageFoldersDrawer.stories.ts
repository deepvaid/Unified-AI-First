import { onBeforeUnmount, ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpManageFoldersDrawer from './MpManageFoldersDrawer.vue'
import MpFolderSelect from './MpFolderSelect.vue'
import MpDataTableToolbar from './MpDataTableToolbar.vue'
import MpStatusChip from './MpStatusChip.vue'
import { CAMPAIGNS, CAMPAIGN_HEADERS, FOLDERS, FOLDER_COUNTS } from '@/stories/fixtures'
import { useFoldersStore, type FolderScope } from '@/stores/useFolders'
import { liquidskyDocs } from '@/stories/storyTemplate'
import { overlayDocs } from '@/stories/decorators'

/** Every `FolderScope` in `src/stores/useFolders.ts`. */
const FOLDER_SCOPES: FolderScope[] = [
  'campaigns', 'contents', 'images', 'forms', 'landing_pages', 'content_templates', 'content_feeds', 'image_groups',
]

/** Item counts for the seeded campaigns scope. */
const CAMPAIGN_COUNTS = { 'cmp-promotions': 7, 'cmp-seasonal': 5, 'cmp-black-friday': 2, 'cmp-automated': 5 }

const meta = {
  title: 'Molecules/MpManageFoldersDrawer',
  component: MpManageFoldersDrawer,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('molecules-mpmanagefoldersdrawer') + `
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
- **Provides (Phase 4):** the delete confirmation dialog is wired to its title and message via
  \`aria-labelledby\`/\`aria-describedby\`, and the rename field carries an \`aria-label\` naming
  the folder being renamed ("New name for X").
- **Gaps:** the "No folders yet" empty text is not a live region (backlog).
        `,
      },
    },
  },
  args: {
    modelValue: false,
    scope: 'campaigns',
    counts: CAMPAIGN_COUNTS,
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — drawer visibility.' },
    scope: { control: 'select', options: FOLDER_SCOPES, description: 'Folder scope read from (and written to) the global useFolders store — one of the eight `FolderScope` values.' },
    counts: { control: 'object', description: 'Item counts per folder id, shown next to each folder name.' },
    deleted: { control: false, description: 'Event — fired with the folder id after deletion so the view can re-file its items.', table: { category: 'events' } },
    onDeleted: { action: 'deleted', table: { disable: true } },
  },
  render: (args) => ({
    components: { MpManageFoldersDrawer },
    setup() {
      // Follows the `modelValue` control, so the drawer can be closed and reopened from Controls
      // as well as from the trigger button.
      const open = ref(args.modelValue ?? false)
      watch(() => args.modelValue, (value) => { open.value = value ?? false })
      return { args, open }
    },
    template: `
      <div>
        <v-btn variant="outlined" prepend-icon="folder-cog" @click="open = true">Manage folders</v-btn>
        <MpManageFoldersDrawer v-bind="args" v-model="open" />
      </div>
    `,
  }),
} satisfies Meta<typeof MpManageFoldersDrawer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Starts closed behind its trigger, bound to the Controls panel: press **Manage folders**, or
 * switch `modelValue` on. Change `scope` to manage another folder tree; `deleted` is logged in
 * the Actions panel.
 */
export const Default: Story = {}

/**
 * The drawer open on the campaigns scope, whose seed data includes a nested child ("Black
 * Friday" under "Seasonal"). It opens on load, so it gets its own frame on the docs page.
 */
export const Campaigns: Story = {
  args: { modelValue: true },
  parameters: overlayDocs(),
}

// ── Template: States ─────────────────────────────────────────────────────────

/**
 * A populated tree with a nested child, and a scope with no folders yet — the list shows the
 * "No folders yet" hint and the create form is the only affordance.
 *
 * There is no `size` prop and no structural variant: this composes `MpFormDrawer` at its
 * default `md` (480px) and inherits its header/body/footer rhythm and its full-bleed collapse
 * below 640px.
 *
 * The story empties the `image_groups` scope in the shared folders store while it is mounted and
 * puts it back on unmount.
 */
export const States: Story = {
  render: () => ({
    components: { MpManageFoldersDrawer },
    setup() {
      const store = useFoldersStore()
      const removed = store.folders.filter(f => f.scope === 'image_groups')
      store.folders = store.folders.filter(f => f.scope !== 'image_groups')
      onBeforeUnmount(() => {
        store.folders = [...store.folders.filter(f => f.scope !== 'image_groups'), ...removed]
      })
      return { which: ref(''), counts: CAMPAIGN_COUNTS }
    },
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'full'">Populated</v-btn>
        <v-btn variant="outlined" @click="which = 'empty'">Empty scope</v-btn>

        <MpManageFoldersDrawer :model-value="which === 'full'" scope="campaigns" :counts="counts" @update:model-value="which = ''" />
        <MpManageFoldersDrawer :model-value="which === 'empty'" scope="image_groups" @update:model-value="which = ''" />
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The real entry point: `MpFolderSelect` in a table toolbar's `#actions` slot,
 * whose "Manage folders" row opens this drawer.
 */
export const InContextFromTheFolderMenu: Story = {
  render: () => ({
    components: { MpManageFoldersDrawer, MpFolderSelect, MpDataTableToolbar, MpStatusChip },
    setup() {
      const manage = ref(false)
      return { manage, folders: FOLDERS, counts: FOLDER_COUNTS, rows: CAMPAIGNS, headers: CAMPAIGN_HEADERS }
    },
    template: `
      <v-card flat border rounded="lg">
        <MpDataTableToolbar title="Campaigns" :total-count="rows.length" search-placeholder="Search campaigns…">
          <template #actions>
            <MpFolderSelect :folders="folders" :counts="counts" :total-count="102" @manage="manage = true" />
          </template>
        </MpDataTableToolbar>
        <v-data-table :headers="headers" :items="rows" item-value="id" hide-default-footer>
          <template #item.status="{ item }">
            <MpStatusChip :status="item.status" type="campaign" size="sm" />
          </template>
        </v-data-table>
        <MpManageFoldersDrawer v-model="manage" scope="campaigns" />
      </v-card>
    `,
  }),
  args: {} as never,
}
