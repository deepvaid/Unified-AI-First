import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpMoveToFolderDialog from './MpMoveToFolderDialog.vue'
import MpRowActionsMenu from './MpRowActionsMenu.vue'
import MpMenuItem from './MpMenuItem.vue'
import MpStatusChip from './MpStatusChip.vue'
import { CAMPAIGNS } from '@/stories/fixtures'
import { useFoldersStore, type FolderScope } from '@/stores/useFolders'
import { liquidskyDocs } from '@/stories/storyTemplate'
import { overlayDocs } from '@/stories/decorators'

/** Every `FolderScope` in `src/stores/useFolders.ts`. */
const FOLDER_SCOPES: FolderScope[] = [
  'campaigns', 'contents', 'images', 'forms', 'landing_pages', 'content_templates', 'content_feeds', 'image_groups',
]

const meta = {
  title: 'Molecules/MpMoveToFolderDialog',
  component: MpMoveToFolderDialog,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('molecules-mpmovetofolderdialog') + `
### Overview
\`MpMoveToFolderDialog\` is a small centered picker for filing a single item into a folder.
Open it from a row or card's 3-dot actions menu ("Move to folder"). It preselects the item's
current folder, supports an inline "New folder" create, and emits \`move(folderId)\` — the owning
view applies the move via its item store. Folders come from the global \`useFolders\` store for
the given \`scope\`; the Move button stays disabled until the selection actually changes.

**Use when:** filing one item (campaign, content block, image) into a folder from its row actions.

**Don't use when:** moving many items at once (pair \`MpFloatingBulkBar\` with its own action), or
confirming a yes/no decision (\`MpConfirmDialog\`).

### Usage
\`\`\`html
<MpMoveToFolderDialog
  v-model="moveOpen"
  scope="campaigns"
  :current-folder-id="movingItem?.folderId ?? null"
  :item-label="movingItem?.name"
  @move="id => campaignsStore.setFolder(movingItem.id, id)"
/>
\`\`\`

### 🟢 Do's
- **Do** pass \`itemLabel\` so users see what they're moving.
- **Do** keep Move disabled until the selection actually changes (built in — don't work around it).
- **Do** rely on the inline "New folder" affordance instead of forcing a detour through
  \`MpManageFoldersDrawer\`.

### 🔴 Don'ts
- **Don't** use this for bulk moves — pair \`MpFloatingBulkBar\` with its own action instead.
- **Don't** mutate folder state yourself on \`@move\` — the dialog already created any new folder;
  you only re-file the item.

### A11y
- **Provides:** Vuetify's \`v-dialog\` traps focus, closes on Escape and backdrop click, and
  restores focus on close; the folder list has \`aria-label="Choose a folder"\`; the inline
  new-folder field autofocuses; Move is disabled while the selection is unchanged.
- **Consumer must:** pass \`itemLabel\` — without it the dialog announces only "Move to folder"
  with no object.
- **Provides (Phase 4):** the dialog surface is wired to its "Move to folder" title via
  \`aria-labelledby\`, so it announces with its name on open.
- **Gaps:** the selected folder is conveyed by a check icon + active styling without
  \`aria-selected\` semantics; child indentation is visual only (backlog).
        `,
      },
    },
  },
  args: {
    modelValue: true,
    scope: 'campaigns',
    currentFolderId: 'cmp-promotions',
    itemLabel: 'Black Friday 2025 — Early Access VIP',
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — dialog visibility. Re-opening resets the selection to currentFolderId.' },
    scope: { control: 'select', options: FOLDER_SCOPES, description: 'Folder scope read from the global useFolders store — one of the eight `FolderScope` values.' },
    currentFolderId: { control: 'text', description: 'The item\'s current folder id (null = unfiled). Preselected, and Move stays disabled until the choice differs.' },
    itemLabel: { control: 'text', description: 'Context line under the title, e.g. the campaign name being moved.' },
    move: { control: false, description: 'Event — emitted with the chosen folder id (or null for "No folder") when Move is clicked; the dialog closes itself.', table: { category: 'events' } },
    onMove: { action: 'move', table: { disable: true } },
  },
  render: (args) => ({
    components: { MpMoveToFolderDialog },
    setup() {
      // The dialog preselects `currentFolderId` when it opens, so the story opens it after mount
      // (as a page does) and then follows the `modelValue` control.
      const open = ref(false)
      onMounted(() => { open.value = args.modelValue ?? false })
      watch(() => args.modelValue, (value) => { open.value = value ?? false })
      return { args, open }
    },
    template: `
      <div>
        <v-btn variant="outlined" prepend-icon="folder-input" @click="open = true">Move to folder</v-btn>
        <MpMoveToFolderDialog v-bind="args" v-model="open" />
      </div>
    `,
  }),
} satisfies Meta<typeof MpMoveToFolderDialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Bound to the Controls panel on the Canvas tab (the docs page shows it in its own frame, which the Controls table there cannot drive); `move` is logged in the Actions panel. The item's current folder
 * is preselected and Move stays disabled until the choice changes. It opens on load, so it gets
 * its own frame on the docs page.
 */
export const Default: Story = {
  parameters: overlayDocs(),
}

// ── Template: States ─────────────────────────────────────────────────────────

/**
 * The states that matter: unfiled ("No folder" selected), already in a folder (Move is disabled
 * until the choice changes), a nested child folder selected (indented with a corner icon), and a
 * scope with no folders — only "No folder" and the inline "New folder" affordance remain, so the
 * first folder can be created without leaving the dialog.
 *
 * There is no `size` prop and no structural variant: this is `MpDialog`'s `sm` (440px) — a
 * folder list is a single column of short labels, and a wider measure would only stretch them.
 *
 * The story empties the `image_groups` scope in the shared folders store while it is mounted and
 * puts it back on unmount.
 */
export const States: Story = {
  render: () => ({
    components: { MpMoveToFolderDialog },
    setup() {
      const store = useFoldersStore()
      const removed = store.folders.filter(f => f.scope === 'image_groups')
      store.folders = store.folders.filter(f => f.scope !== 'image_groups')
      onBeforeUnmount(() => {
        store.folders = [...store.folders.filter(f => f.scope !== 'image_groups'), ...removed]
      })
      return { which: ref('') }
    },
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'unfiled'">Unfiled</v-btn>
        <v-btn variant="outlined" @click="which = 'current'">Already in a folder</v-btn>
        <v-btn variant="outlined" @click="which = 'nested'">Nested folder</v-btn>
        <v-btn variant="outlined" @click="which = 'empty'">Empty scope</v-btn>

        <MpMoveToFolderDialog :model-value="which === 'unfiled'" scope="contents" :current-folder-id="null" item-label="Blank Canvas Starter" @update:model-value="which = ''" />
        <MpMoveToFolderDialog :model-value="which === 'current'" scope="campaigns" current-folder-id="cmp-promotions" item-label="Welcome — Day 1" @update:model-value="which = ''" />
        <MpMoveToFolderDialog :model-value="which === 'nested'" scope="campaigns" current-folder-id="cmp-black-friday" item-label="Doorbuster Reminder — Wave 2" @update:model-value="which = ''" />
        <MpMoveToFolderDialog :model-value="which === 'empty'" scope="image_groups" :current-folder-id="null" item-label="hero-banner-v3.png" @update:model-value="which = ''" />
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The real flow: a row's kebab opens the picker, and confirming moves the
 * record.
 */
export const InContextMoveACampaign: Story = {
  render: () => ({
    components: { MpMoveToFolderDialog, MpRowActionsMenu, MpMenuItem, MpStatusChip },
    setup() {
      const open = ref(false)
      const pending = ref<string | null>(null)
      const placed = ref<Record<string, string>>({})
      return {
        open, pending, placed,
        rows: CAMPAIGNS.slice(0, 4),
        headers: [
          { title: 'Campaign', key: 'name' },
          { title: 'Folder', key: 'folder' },
          { title: 'Status', key: 'status' },
          { title: 'Actions', key: 'actions', headerProps: { class: 'mp-th-sr' }, sortable: false, align: 'end' as const },
        ],
        ask: (name: string) => { pending.value = name; open.value = true },
        onMove: (folderId: string | null) => {
          if (pending.value) placed.value = { ...placed.value, [pending.value]: folderId ?? 'Unfiled' }
        },
      }
    },
    template: `
      <v-card flat border rounded="lg">
        <v-data-table :headers="headers" :items="rows" item-value="id" hide-default-footer>
          <template #item.folder="{ item }">
            <span class="text-medium-emphasis">{{ placed[item.name] ?? '—' }}</span>
          </template>
          <template #item.status="{ item }">
            <MpStatusChip :status="item.status" type="campaign" size="sm" />
          </template>
          <template #item.actions="{ item }">
            <MpRowActionsMenu ariaLabel="Campaign actions" :item-label="item.name">
              <MpMenuItem title="Move to folder…" icon="folder-input" @click="ask(item.name)" />
              <MpMenuItem title="Duplicate" icon="copy" />
            </MpRowActionsMenu>
          </template>
        </v-data-table>

        <MpMoveToFolderDialog
          v-model="open"
          scope="campaigns"
          :current-folder-id="null"
          :item-label="pending ?? undefined"
          @move="onMove"
        />
      </v-card>
    `,
  }),
  args: {} as never,
}
