import type { Meta, StoryObj } from '@storybook/vue3'
import MpPageHeader from './MpPageHeader.vue'

const meta = {
  title: 'Layout/MpPageHeader',
  component: MpPageHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpPageHeader\` sits at the very top of main application views. It provides context with a compact title/subtitle area and houses the primary page-level actions.

### 🟢 Do's
- **Do** use the \`#actions\` slot strictly for the main primary and secondary actions on the page (e.g., "New Campaign" or "Export").
- **Do** keep the \`title\` short (1-3 words) and use the \`subtitle\` to explain the purpose of the page if necessary.

### 🔴 Don'ts
- **Don't** add breadcrumb trails to page headers. Use sidebar context, tabs, or local back actions instead.
- **Don't** put form inputs, search bars, or complex filters inside the page header. Those belong in toolbars (like \`MpDataTableToolbar\`).
- **Don't** use this component inside dialogs, drawers, or cards. It spans the full width of the main content area.
- **Don't** stack too many buttons in the \`#actions\` slot. Limit to 1 primary and 1-2 secondary buttons to avoid clutter.

### 💡 Best Practices
- **Hierarchy:** The title is rendered as an \`h1\`, making it the most important typographical element on the screen for accessibility and structural clarity.
- **Responsiveness:** On smaller viewports, ensure that actions wrap properly or fall into a dropdown menu to prevent horizontal scrolling.
        `,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    level: { control: 'select', options: [1, 2] },
    density: { control: 'select', options: ['default', 'compact'] },
  },
} satisfies Meta<typeof MpPageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Sales Orders',
    subtitle: 'Manage and fulfill customer orders',
  },
}

export const WithActions: Story = {
  render: (args) => ({
    components: { MpPageHeader },
    setup: () => ({ args }),
    template: `
      <MpPageHeader v-bind="args">
        <template #actions>
          <v-btn variant="outlined" class="mr-2">Import</v-btn>
          <v-btn color="primary" prepend-icon="plus">New Campaign</v-btn>
        </template>
      </MpPageHeader>
    `,
  }),
  args: {
    title: 'Email Campaigns',
    subtitle: 'Create and manage your email campaigns',
  },
}

export const TitleOnly: Story = {
  args: {
    title: 'Dashboard',
  },
}

export const SectionLevel: Story = {
  args: {
    title: 'Users & Permissions',
    subtitle: 'Invite teammates and manage their access levels.',
    level: 2,
    density: 'compact',
  },
}
