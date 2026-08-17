import { onBeforeUnmount, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpMoveToFolderDialog from './MpMoveToFolderDialog.vue'
import { useFoldersStore } from '@/stores/useFolders'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Forms/MpMoveToFolderDialog',
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

/** The move-to-folder dialog on dark. */
export const DarkMode: Story = {
  ...Default,
  globals: darkModeGlobals,
}
