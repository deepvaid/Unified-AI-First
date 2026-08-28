import { onBeforeUnmount, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpMoveToFolderDialog from './MpMoveToFolderDialog.vue'
import MpRowActionsMenu from './MpRowActionsMenu.vue'
import MpStatusChip from './MpStatusChip.vue'
import { CAMPAIGNS } from '@/stories/fixtures'
import { useFoldersStore } from '@/stores/useFolders'

const meta = {
  title: 'Molecules/MpMoveToFolderDialog',
  component: MpMoveToFolderDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
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
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — dialog visibility. Re-opening resets the selection to currentFolderId.' },
    scope: { control: 'select', options: ['campaigns', 'contents', 'images'], description: 'Folder scope read from the global useFolders store.' },
    currentFolderId: { control: 'text', description: 'The item\'s current folder id (null = unfiled). Preselected, and Move stays disabled until the choice differs.' },
    itemLabel: { control: 'text', description: 'Context line under the title, e.g. the campaign name being moved.' },
    move: { control: false, description: 'Event — emitted with the chosen folder id (or null for "No folder") when Move is clicked; the dialog closes itself.', table: { category: 'events' } },
  },
  render: (args) => ({
    components: { MpMoveToFolderDialog },
    setup() {
      const open = ref(true)
      const lastMove = ref('—')
      return { args, open, lastMove }
    },
    template: `
      <section style="min-height:560px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="folder-input" @click="open = true">Move to folder</v-btn>
        <div class="text-caption text-medium-emphasis mt-3">Last move event: {{ lastMove }}</div>
        <MpMoveToFolderDialog v-bind="args" v-model="open" @move="id => lastMove = String(id)" />
      </section>
    `,
  }),
} satisfies Meta<typeof MpMoveToFolderDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    modelValue: true,
    scope: 'campaigns',
    currentFolderId: 'cmp-promotions',
    itemLabel: 'Black Friday 2025 — Early Access VIP',
  },
}

export const Unfiled: Story = {
  args: {
    modelValue: true,
    scope: 'contents',
    currentFolderId: null,
    itemLabel: 'Blank Canvas Starter',
  },
}

/** A nested child folder ("Black Friday" under "Seasonal") preselected — indented with a corner icon. */
export const NestedFolderSelected: Story = {
  args: {
    modelValue: true,
    scope: 'campaigns',
    currentFolderId: 'cmp-black-friday',
    itemLabel: 'Doorbuster Reminder — Wave 2',
  },
}

/**
 * Zero folders in the scope — only "No folder" and the inline "New folder" affordance remain,
 * so the first folder can be created without leaving the dialog.
 *
 * The story temporarily empties the images scope in the shared folders store and restores it on
 * unmount; it is excluded from the docs page so it can't race the other stories' seeded state.
 */
export const EmptyFolderList: Story = {
  args: {
    modelValue: true,
    scope: 'images',
    currentFolderId: null,
    itemLabel: 'hero-banner-v3.png',
  },
  parameters: { docs: { disable: true } },
  render: (args) => ({
    components: { MpMoveToFolderDialog },
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
      <section style="min-height:480px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="folder-input" @click="open = true">Move to folder</v-btn>
        <MpMoveToFolderDialog v-bind="args" v-model="open" />
      </section>
    `,
  }),
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * One structure — a folder picker. What varies is the scope it is opened for; each scope has
 * its own folder tree, and the dialog reads it from `useFoldersStore`.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpMoveToFolderDialog },
    data: () => ({ which: 'campaigns' as string }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" class="text-none" @click="which = 'campaigns'">scope="campaigns"</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'images'">scope="images"</v-btn>

        <MpMoveToFolderDialog :model-value="which === 'campaigns'" scope="campaigns" :current-folder-id="null" item-label="Spring Refresh" @update:model-value="which = ''" />
        <MpMoveToFolderDialog :model-value="which === 'images'" scope="images" :current-folder-id="null" item-label="hero-spring.png" @update:model-value="which = ''" />
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no `size` prop. This is `MpDialog`'s `sm` (440px) — a folder list is a single
 * column of short labels, and a wider measure would only stretch them.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpMoveToFolderDialog },
    data: () => ({ open: true }),
    template: `
      <div>
        <v-btn variant="outlined" class="text-none" @click="open = true">Open</v-btn>
        <MpMoveToFolderDialog v-model="open" scope="campaigns" :current-folder-id="null" item-label="Spring Refresh" />
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * The states that matter: nothing selected yet, already in a folder (Move is disabled until the
 * choice changes), and the inline "New folder" field open.
 */
export const States: Story = {
  render: () => ({
    components: { MpMoveToFolderDialog },
    data: () => ({ which: '' as string }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" class="text-none" @click="which = 'unfiled'">Unfiled</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'current'">Already in a folder</v-btn>

        <MpMoveToFolderDialog :model-value="which === 'unfiled'" scope="campaigns" :current-folder-id="null" item-label="Spring Refresh" @update:model-value="which = ''" />
        <MpMoveToFolderDialog :model-value="which === 'current'" scope="campaigns" current-folder-id="lifecycle" item-label="Welcome — Day 1" @update:model-value="which = ''" />
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The real flow: a row's kebab opens the picker, and confirming moves the
 * record. Since Phase 4 this dialog composes `MpDialog` — it used to carry three separate
 * insets of its own (`pt-4 px-5` · `px-3 py-2` · `px-4 pb-4`) and now carries none.
 */
export const InContextMoveACampaign: Story = {
  render: () => ({
    components: { MpMoveToFolderDialog, MpRowActionsMenu, MpStatusChip },
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
          { title: '', key: 'actions', sortable: false, align: 'end' as const },
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
            <MpRowActionsMenu aria-label="Campaign actions" :item-label="item.name">
              <v-list-item title="Move to folder…" prepend-icon="folder-input" @click="ask(item.name)" />
              <v-list-item title="Duplicate" prepend-icon="copy" />
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
