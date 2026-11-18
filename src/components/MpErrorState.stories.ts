import type { Meta, StoryObj } from '@storybook/vue3'
import MpErrorState from './MpErrorState.vue'
import { stack } from '@/stories/storyTemplate'

const meta = {
  title: 'Molecules/MpErrorState',
  component: MpErrorState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpErrorState\` component replaces the contents of a container (table, list, dashboard widget) when data fails to load. It mirrors \`MpEmptyState\` but signals a recoverable failure and offers a retry.

**Use when:** a fetch failed, a permission was denied, or the client is offline — anywhere data should be but can't load.

**Don't use when:** the request succeeded with zero results (use \`MpEmptyState\`) or for field-level validation errors (use the input's own error messages).

### Usage
\`\`\`html
<MpTableSkeleton v-if="loading" :columns="5" />
<MpErrorState
  v-else-if="error"
  title="Couldn’t load campaigns"
  description="There was a problem reaching the server. Check your connection and try again."
  @action="reload"
/>
\`\`\`
All props have sensible defaults (\`alert-triangle\` icon, "Something went wrong", "Try again" retry) — often only \`@action\` is needed.

### 🟢 Do's
- **Do** explain what failed in plain language and, when possible, what the user can do about it.
- **Do** provide a retry action (\`action-label\` + \`@action\`) so users can recover without a full page reload.
- **Do** render it inside the same container the data would have occupied, not as a full-page takeover.

### 🔴 Don'ts
- **Don't** expose raw stack traces or status codes as the primary message.
- **Don't** blame the user for a system failure.

### 💡 Best Practices
- Pair with a skeleton (\`MpTableSkeleton\`) for the loading phase, then swap to this on failure.

### A11y
- **Provides:** \`role="alert"\` on the root, so assistive tech announces the failure the moment it renders; the retry CTA is a real \`v-btn\` with a visible focus indicator; the icon is decorative.
- **Consumer must:** keep the title/description human (no raw stack traces or status codes) and make \`@action\` actually retry — pass \`action-label=""\` to suppress the button when there is no recovery path.
- **Gaps:** none known — the title carries \`role="heading"\` + \`aria-level\` (default 2, tune via \`headingLevel\`), mirroring \`MpEmptyState\`. *(Fixed in the Phase 4 a11y pass.)*
        `,
      },
    },
  },
  argTypes: {
    headingLevel: { control: 'number', description: 'Heading level announced to assistive tech (`role="heading"` + `aria-level`). Passed through to MpEmptyState, which this composes.' },
    icon: { control: 'text', description: 'Lucide icon name in the error-tinted circle. Default: alert-triangle.' },
    title: { control: 'text', description: 'Headline. Default: "Something went wrong".' },
    description: { control: 'text', description: 'Supporting copy (max-width 420px, wraps).' },
    actionLabel: { control: 'text', description: 'CTA label. Default: "Try again". Pass an empty string to hide the button.' },
    actionIcon: { control: 'text', description: 'Lucide icon prepended to the CTA. Default: refresh-cw.' },
    action: { control: false, description: 'Event — emitted when the CTA button is clicked (wire your retry here).', table: { category: 'events' } },
    onAction: { action: 'action', table: { disable: true } },
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

/**
 * MpErrorState has no structural variants — it composes MpEmptyState's one centred shape
 * with `role="alert"`, the error tone and retry defaults. What varies is whether a retry
 * action is offered, which is the States axis below.
 */
export const Variants: Story = {
  render: stack({ MpErrorState }, [
    {
      label: 'recoverable — offers a retry',
      args: { title: 'Couldn’t load campaigns', description: 'There was a problem reaching the server.' },
    },
    {
      label: 'terminal — no retry to offer',
      args: {
        title: 'You don’t have access to this report',
        description: 'Ask an account admin to grant you the Analytics role.',
        actionLabel: '',
      },
    },
  ]),
}

/** Every state the component renders. There is no `size` prop — an error state fills its container. */
export const States: Story = {
  render: stack({ MpErrorState }, [
    { label: 'default — generic failure', args: {} },
    {
      label: 'with description',
      args: {
        title: 'Couldn’t load campaigns',
        description: 'There was a problem reaching the server. Check your connection and try again.',
      },
    },
    {
      label: 'no retry',
      args: { title: 'Report unavailable', description: 'This report was removed.', actionLabel: '' },
    },
    {
      label: 'custom icon + label',
      args: { icon: 'wifi-off', title: 'You’re offline', description: 'Reconnect to load this page.', actionLabel: 'Retry now' },
    },
  ]),
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

/** Long title + multi-sentence description — copy wraps inside the 420px measure without breaking layout. */
export const LongCopy: Story = {
  args: {
    icon: 'server-crash',
    title: 'The analytics service didn’t respond before the request timed out',
    description:
      'This usually clears up on its own within a minute or two. '
      + 'If it keeps happening, the report may be too large for the selected date range — '
      + 'try narrowing the range or removing a breakdown dimension before retrying.',
    actionLabel: 'Retry with same filters',
  },
}
