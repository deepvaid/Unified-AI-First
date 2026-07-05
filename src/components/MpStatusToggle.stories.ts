import type { Meta, StoryObj } from '@storybook/vue3'
import MpStatusToggle from './MpStatusToggle.vue'

const meta = {
  title: 'Forms/MpStatusToggle',
  component: MpStatusToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpStatusToggle\` is the status cell used in journey/data-journey tables: an inline switch plus a
colored status label. The switch is on for **Active**, off for **Paused**, and disabled for **Draft**
(drafts are activated from the builder, not the list).

### 🟢 Do's
- **Do** handle \`@toggle\` in the view and flip the row's status between Active and Paused.
- **Do** use it inside a \`v-data-table\` status column for consistency with Journeys/Data Journeys.

### 🔴 Don'ts
- **Don't** use it for statuses outside Active/Paused/Draft — use \`MpStatusChip\` for read-only badges.
        `,
      },
    },
  },
  argTypes: {
    status: { control: 'select', options: ['Active', 'Paused', 'Draft'] },
  },
} satisfies Meta<typeof MpStatusToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {
  args: { status: 'Active' },
}

export const Paused: Story = {
  args: { status: 'Paused' },
}

export const Draft: Story = {
  args: { status: 'Draft' },
}
