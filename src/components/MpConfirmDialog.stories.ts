import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpConfirmDialog from './MpConfirmDialog.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Overlays/MpConfirmDialog',
  component: MpConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
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
    danger: false,
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — dialog visibility. The component sets it false on Cancel, Escape, backdrop click, and confirm.' },
    title: { control: 'text', description: 'The question, phrased as a yes/no decision ("Delete this split?").' },
    message: { control: 'text', description: 'The consequence of confirming — plain body text.' },
    confirmLabel: { control: 'text', description: 'Verb-first confirm button label. Defaults to "Confirm"; never use "OK".' },
    danger: { control: 'boolean', description: 'Destructive styling: error triangle icon + error confirm button.' },
    consequences: { control: 'object', description: 'Optional bullet list of consequences, rendered between the message and the action buttons.' },
    confirm: { control: false, description: 'Event — emitted when the confirm button is clicked (the dialog then closes itself).', table: { category: 'events' } },
  },
  render: (args) => ({
    components: { MpConfirmDialog },
    setup() {
      const open = ref(true)
      watch(
        () => [args.title, args.danger],
        () => {
          open.value = true
        },
      )
      return { args, open }
    },
    template: `
      <section style="min-height:360px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" @click="open = true">Open dialog</v-btn>
        <MpConfirmDialog v-bind="args" v-model="open" />
      </section>
    `,
  }),
} satisfies Meta<typeof MpConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Danger: Story = {
  args: {
    title: 'Delete this split?',
    message: 'Deleting "Opened welcome email?" also removes every step inside its branches. Steps after the point where the branches rejoin are kept.',
    confirmLabel: 'Delete split',
    danger: true,
  },
}

/** A long, multi-sentence message wraps inside the 440px card without breaking the action row. */
export const LongMessage: Story = {
  args: {
    title: 'Stop this campaign send?',
    message:
      'Stopping "Black Friday 2025 — Early Access VIP" cancels delivery for the 18,240 contacts '
      + 'still queued. The 6,411 emails already sent cannot be recalled, and their opens and clicks '
      + 'will keep reporting under this campaign. A stopped campaign cannot be resumed — to send to '
      + 'the remaining contacts later, duplicate the campaign and target the "Not yet received" segment.',
    confirmLabel: 'Stop send',
    danger: true,
  },
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
}

/** L4 modal surface + scrim in dark mode. */
export const DarkModeDanger: Story = {
  globals: darkModeGlobals,
  ...Danger,
}
