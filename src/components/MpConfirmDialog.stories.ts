import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpConfirmDialog from './MpConfirmDialog.vue'
import MpRowActionsMenu from './MpRowActionsMenu.vue'
import MpMenuItem from './MpMenuItem.vue'
import MpStatusChip from './MpStatusChip.vue'
import MpEmptyState from './MpEmptyState.vue'
import { CAMPAIGNS, CAMPAIGN_HEADERS } from '@/stories/fixtures'
import { liquidskyDocs } from '@/stories/storyTemplate'
import { overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Molecules/MpConfirmDialog',
  component: MpConfirmDialog,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('molecules-mpconfirmdialog') + `
### Overview
\`MpConfirmDialog\` is a small confirm/cancel dialog for one-shot decisions (delete a node,
discard a draft). It closes itself on Cancel, Escape, backdrop click, and after emitting
\`confirm\`. Use \`danger\` for destructive actions — it switches the icon and confirm button
to the error color.

**Use when:** an action needs a single yes/no gate before running — especially destructive or
hard-to-undo ones.

**Don't use when:** the decision needs input fields or a picker (use \`MpFormDrawer\` or a
dedicated dialog like \`MpMoveToFolderDialog\`), or the action is trivially reversible (just do
it and offer undo).

### Usage
\`\`\`html
<MpConfirmDialog
  v-model="confirmOpen"
  danger
  title="Delete this split?"
  message="Deleting it also removes every step inside its branches."
  confirm-label="Delete split"
  @confirm="deleteSplit()"
/>
\`\`\`

### 🟢 Do's
- **Do** name the consequence in \`message\` ("also removes every step inside its branches").
- **Do** use a verb-first \`confirmLabel\` ("Delete split", "Discard draft") — never "OK".
- **Do** set \`danger\` whenever the confirm button destroys data.
- **Do** rename the dismiss with \`cancelLabel\` when the action is itself a cancel: "Keep order"
  beside "Cancel order", never "Cancel" beside "Cancel order" (see \`States\`).

### 🔴 Don'ts
- **Don't** use it for forms or multi-field input — use \`MpFormDrawer\` or a dedicated dialog
  (e.g. \`MpMoveToFolderDialog\`).
- **Don't** chain two confirm dialogs; if an action needs double confirmation, rethink the flow.

### A11y
- **Provides:** the dialog surface is wired to its title and message via \`aria-labelledby\`/
  \`aria-describedby\`, so it announces with its name and consequence on open *(fixed in the
  Phase 4 a11y pass)*; Vuetify's \`v-dialog\` traps focus, closes on Escape and backdrop click,
  and restores focus to the trigger on close; Cancel and confirm are real buttons with visible
  text; the danger icon is decorative (\`v-icon\` is \`aria-hidden\`).
- **Consumer must:** phrase \`title\` as the question and \`message\` as the consequence — screen
  readers read them in order when the dialog opens.
- **Gaps:** initial focus lands on the first focusable (Cancel) rather than an explicit safe
  default (backlog).
        `,
      },
    },
  },
  args: {
    modelValue: true,
    title: 'Apply this change?',
    message: 'The updated settings take effect for all new enrollments immediately.',
    confirmLabel: 'Apply',
    cancelLabel: 'Cancel',
    danger: false,
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — dialog visibility. The component sets it false on Cancel, Escape, backdrop click, and confirm.' },
    title: { control: 'text', description: 'The question, phrased as a yes/no decision ("Delete this split?").' },
    message: { control: 'text', description: 'The consequence of confirming — plain body text.' },
    confirmLabel: { control: 'text', description: 'Verb-first confirm button label. Defaults to "Confirm"; never use "OK".' },
    cancelLabel: { control: 'text', description: 'The dismiss button. Defaults to "Cancel"; rename it when the action is itself a cancel ("Keep order" beside "Cancel order").' },
    danger: { control: 'boolean', description: 'Destructive styling: error triangle icon + error confirm button.' },
    consequences: { control: 'object', description: 'Optional bullet list of consequences, rendered between the message and the action buttons.' },
    confirm: { control: false, description: 'Event — emitted when the confirm button is clicked (the dialog then closes itself).', table: { category: 'events' } },
    onConfirm: { action: 'confirm', table: { disable: true } },
  },
  render: (args) => ({
    components: { MpConfirmDialog },
    setup() {
      // Follows the `modelValue` control, so the dialog can be closed and reopened from Controls
      // as well as from the trigger button.
      const open = ref(args.modelValue ?? false)
      watch(() => args.modelValue, (value) => { open.value = value ?? false })
      return { args, open }
    },
    template: `
      <div>
        <v-btn variant="outlined" @click="open = true">Open dialog</v-btn>
        <MpConfirmDialog v-bind="args" v-model="open" />
      </div>
    `,
  }),
} satisfies Meta<typeof MpConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Bound to the Controls panel on the Canvas tab (the docs page shows it in its own frame, which the Controls table there cannot drive); `confirm` is logged in the Actions panel. The three stories that
 * show the dialog open on load each get their own frame on the docs page (`overlayDocs()`).
 */
export const Default: Story = {
  parameters: overlayDocs('420px'),
}

/** `danger` swaps the header icon to the error tone and the confirm button to `error`. */
export const Danger: Story = {
  args: {
    title: 'Delete this split?',
    message: 'Deleting "Opened welcome email?" also removes every step inside its branches. Steps after the point where the branches rejoin are kept.',
    confirmLabel: 'Delete split',
    danger: true,
  },
  parameters: overlayDocs('420px'),
}

/** Bullet list of consequences rendered between the message and the action buttons. */
export const WithConsequences: Story = {
  args: {
    title: 'Delete this segment?',
    message: 'Deleting "VIP — Repeat Buyers" removes it everywhere it is used.',
    confirmLabel: 'Delete segment',
    danger: true,
    consequences: [
      '3 active campaigns targeting this segment will lose their audience.',
      '2 journeys use this segment as an entry filter.',
      'This cannot be undone.',
    ],
  },
  parameters: overlayDocs('480px'),
}

// ── Template: Variants · States ──────────────────────────────────────────────

/**
 * Two structures, and they are the whole component: a neutral confirmation and a destructive
 * one. `danger` swaps the header icon to the error tone and the confirm button to `error` —
 * nothing else changes, which is the point. There is no `size` prop: a confirm prompt is always
 * `MpDialog`'s `sm` (440px). A confirmation that needs more room is a form, and belongs in
 * `MpFormDrawer`.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpConfirmDialog },
    data: () => ({ which: '' as string }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'neutral'">Neutral</v-btn>
        <v-btn variant="outlined" @click="which = 'danger'">Danger</v-btn>

        <MpConfirmDialog
          :model-value="which === 'neutral'"
          title="Publish this journey?"
          message="Contacts matching the entry filter will start entering immediately."
          confirm-label="Publish"
          @update:model-value="which = ''"
        />
        <MpConfirmDialog
          :model-value="which === 'danger'"
          danger
          title="Delete this segment?"
          message="Deleting “VIP — Repeat Buyers” removes it everywhere it is used."
          confirm-label="Delete segment"
          @update:model-value="which = ''"
        />
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * The content states: a one-line message, a long message that wraps inside the 440px card
 * without breaking the action row, a consequences list, and a renamed dismiss.
 *
 * **When the action is itself a cancel, rename the dismiss.** "Cancel" beside "Cancel order"
 * reads as two ways to cancel; `cancel-label="Keep order"` says what each button does.
 */
export const States: Story = {
  render: () => ({
    components: { MpConfirmDialog },
    data: () => ({ which: '' as string }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'short'">Short</v-btn>
        <v-btn variant="outlined" @click="which = 'long'">Long message</v-btn>
        <v-btn variant="outlined" @click="which = 'consequences'">With consequences</v-btn>
        <v-btn variant="outlined" @click="which = 'keep'">Action is a cancel</v-btn>

        <MpConfirmDialog :model-value="which === 'short'" title="Discard changes?" message="Your edits will be lost." confirm-label="Discard" danger @update:model-value="which = ''" />
        <MpConfirmDialog
          :model-value="which === 'long'"
          title="Stop this campaign send?"
          message="Stopping “Black Friday 2025 — Early Access VIP” cancels delivery for the 18,240 contacts still queued. The 6,411 emails already sent cannot be recalled, and their opens and clicks will keep reporting under this campaign. A stopped campaign cannot be resumed — to send to the remaining contacts later, duplicate the campaign and target the “Not yet received” segment."
          confirm-label="Stop send"
          danger
          @update:model-value="which = ''"
        />
        <MpConfirmDialog
          :model-value="which === 'consequences'"
          title="Delete this segment?"
          message="Deleting “VIP — Repeat Buyers” removes it everywhere it is used."
          :consequences="['3 active campaigns targeting this segment will lose their audience.', '2 journeys use this segment as an entry filter.', 'This cannot be undone.']"
          confirm-label="Delete segment"
          danger
          @update:model-value="which = ''"
        />
        <MpConfirmDialog
          :model-value="which === 'keep'"
          title="Cancel order #10482?"
          message="The customer is refunded in full and the items go back into stock."
          confirm-label="Cancel order"
          cancel-label="Keep order"
          danger
          @update:model-value="which = ''"
        />
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The real flow: a row's kebab menu triggers the prompt, and confirming
 * actually removes the row. This is the pattern every destructive action in the platform
 * uses — the table never deletes on click, the dialog is the gate.
 */
export const InContextDeleteFromTable: Story = {
  render: () => ({
    components: { MpConfirmDialog, MpRowActionsMenu, MpMenuItem, MpStatusChip, MpEmptyState },
    setup() {
      const rows = ref([...CAMPAIGNS])
      const pending = ref<typeof CAMPAIGNS[number] | null>(null)
      const open = ref(false)
      return {
        rows, pending, open,
        headers: CAMPAIGN_HEADERS.concat([{ title: 'Actions', key: 'actions', headerProps: { class: 'mp-th-sr' }, sortable: false, align: 'end' as const }] as never),
        ask: (row: typeof CAMPAIGNS[number]) => { pending.value = row; open.value = true },
        remove: () => { rows.value = rows.value.filter(r => r.id !== pending.value?.id) },
      }
    },
    template: `
      <v-card flat border rounded="lg">
        <v-data-table v-if="rows.length" :headers="headers" :items="rows" item-value="id" hide-default-footer>
          <template #item.status="{ item }">
            <MpStatusChip :status="item.status" type="campaign" size="sm" />
          </template>
          <template #item.actions="{ item }">
            <MpRowActionsMenu ariaLabel="Campaign actions" :item-label="item.name">
              <MpMenuItem title="Edit" icon="pencil" />
              <MpMenuItem title="Duplicate" icon="copy" />
              <v-divider class="my-1" />
              <MpMenuItem title="Delete" icon="trash-2" danger @click="ask(item)" />
            </MpRowActionsMenu>
          </template>
        </v-data-table>
        <MpEmptyState v-else title="No campaigns left" icon="megaphone" description="Every campaign in this list was deleted." />

        <MpConfirmDialog
          v-model="open"
          danger
          title="Delete this campaign?"
          :message="pending ? 'Deleting “' + pending.name + '” removes it and its reporting history.' : ''"
          :consequences="['Reporting for this campaign will no longer be available.', 'This cannot be undone.']"
          confirm-label="Delete campaign"
          @confirm="remove"
        />
      </v-card>
    `,
  }),
  args: {} as never,
}
