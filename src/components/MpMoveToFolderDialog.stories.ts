import type { Meta, StoryObj } from '@storybook/vue3'
import MpMoveToFolderDialog from './MpMoveToFolderDialog.vue'

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
view applies the move via its item store.

### 🟢 Do's
- **Do** pass \`itemLabel\` so users see what they're moving.
- **Do** keep Move disabled until the selection actually changes.

### 🔴 Don'ts
- **Don't** use this for bulk moves — pair \`MpFloatingBulkBar\` with its own action instead.
        `,
      },
    },
  },
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
