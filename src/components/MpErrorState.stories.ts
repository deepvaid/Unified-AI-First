import type { Meta, StoryObj } from '@storybook/vue3'
import MpErrorState from './MpErrorState.vue'

const meta = {
  title: 'Feedback/MpErrorState',
  component: MpErrorState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpErrorState\` component replaces the contents of a container (table, list, dashboard widget) when data fails to load. It mirrors \`MpEmptyState\` but signals a recoverable failure and offers a retry.

### 🟢 Do's
- **Do** explain what failed in plain language and, when possible, what the user can do about it.
- **Do** provide a retry action (\`action-label\` + \`@action\`) so users can recover without a full page reload.
- **Do** render it inside the same container the data would have occupied, not as a full-page takeover.

### 🔴 Don'ts
- **Don't** expose raw stack traces or status codes as the primary message.
- **Don't** blame the user for a system failure.

### 💡 Best Practices
- Pair with a skeleton (\`MpTableSkeleton\`) for the loading phase, then swap to this on failure.
- Uses \`role="alert"\` so assistive tech announces the failure when it appears.
        `,
      },
    },
  },
  argTypes: {
    icon: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    actionLabel: { control: 'text' },
    actionIcon: { control: 'text' },
  },
} satisfies Meta<typeof MpErrorState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Couldn’t load campaigns',
    description: 'There was a problem reaching the server. Check your connection and try again.',
  },
}

export const NoRetry: Story = {
  args: {
    icon: 'shield-alert',
    title: 'You don’t have access',
    description: 'Ask an administrator to grant you permission to view this report.',
    actionLabel: '',
  },
}

export const Offline: Story = {
  args: {
    icon: 'wifi-off',
    title: 'You’re offline',
    description: 'Reconnect to the internet to load your data.',
    actionLabel: 'Retry',
  },
}
