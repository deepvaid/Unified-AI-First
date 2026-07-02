import type { Meta, StoryObj } from '@storybook/vue3'
import MpManageFoldersDrawer from './MpManageFoldersDrawer.vue'

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
\`deleted(folderId)\` so the owning view can re-file affected items to "All folders".

### 🟢 Do's
- **Do** open it from the page header's "Manage Folders" button and from \`MpFolderSelect\`'s
  "Manage folders" action.
- **Do** listen for \`@deleted\` and call the item store's \`reassignFolder\`.

### 🔴 Don'ts
- **Don't** use a centered dialog for this — folder management is a form surface and follows the
  drawer convention.
        `,
      },
    },
  },
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
