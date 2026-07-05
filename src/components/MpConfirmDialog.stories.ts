import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpConfirmDialog from './MpConfirmDialog.vue'

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

### 🟢 Do's
- **Do** name the consequence in \`message\` ("also removes every step inside its branches").
- **Do** use a verb-first \`confirmLabel\` ("Delete split", "Discard draft") — never "OK".

### 🔴 Don'ts
- **Don't** use it for forms or multi-field input — use \`MpFormDrawer\` or a dedicated dialog
  (e.g. \`MpMoveToFolderDialog\`).
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
    title: { control: 'text' },
    message: { control: 'text' },
    confirmLabel: { control: 'text' },
    danger: { control: 'boolean' },
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
