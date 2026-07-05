import type { Meta, StoryObj } from '@storybook/vue3'
import MpRowActionsMenu from './MpRowActionsMenu.vue'

const meta = {
  title: 'Overlays/MpRowActionsMenu',
  component: MpRowActionsMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpRowActionsMenu\` is the kebab ("more-vertical") actions menu used in the trailing column of
data-table rows. The component owns the trigger button and the compact list container; the view
supplies \`v-list-item\`s in the default slot, keeping row-specific actions and handlers local.

### 🟢 Do's
- **Do** pass a row-specific \`aria-label\` ("Journey actions") — it is the only accessible name.
- **Do** put destructive actions last, behind a \`v-divider\`, with \`class="text-error"\`.

### 🔴 Don'ts
- **Don't** exceed ~6 actions — promote frequent actions to inline icon buttons instead.
        `,
      },
    },
  },
  args: {
    ariaLabel: 'Row actions',
  },
  argTypes: {
    ariaLabel: { control: 'text' },
  },
} satisfies Meta<typeof MpRowActionsMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { MpRowActionsMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex justify-center pa-8">
        <MpRowActionsMenu v-bind="args">
          <v-list-item prepend-icon="bar-chart-2" title="View analytics"></v-list-item>
          <v-list-item prepend-icon="copy" title="Duplicate"></v-list-item>
          <v-list-item prepend-icon="circle-pause" title="Pause"></v-list-item>
          <v-divider></v-divider>
          <v-list-item prepend-icon="trash-2" title="Delete" class="text-error"></v-list-item>
        </MpRowActionsMenu>
      </div>
    `,
  }),
}
