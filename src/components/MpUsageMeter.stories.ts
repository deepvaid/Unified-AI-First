import type { Meta, StoryObj } from '@storybook/vue3'
import MpUsageMeter from './MpUsageMeter.vue'

const meta = {
  title: 'Atoms/MpUsageMeter',
  component: MpUsageMeter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpUsageMeter\` is a generic plan-usage meter: a label row (used / limit) over a slim progress bar. Used for PLG entitlement surfaces — AI token allocation, SMS sends, chatbot counts — anywhere a merchant needs to see consumption against a plan cap.

**Use when:** showing usage against a finite or unlimited plan quota.

**Don't use when:** the value isn't a used/limit ratio — use \`MpKpiCard\` for a plain metric instead.

### Usage
\`\`\`html
<MpUsageMeter
  label="Da Vinci AI tokens"
  icon="sparkles"
  :used="182000"
  :limit="500000"
  hint="Resets monthly · Upgrade for a larger allocation"
/>
\`\`\`

### 🟢 Do's
- **Do** pass raw numbers for \`used\`/\`limit\` — compact formatting ("12.4K / 50K") is handled internally.
- **Do** pass \`-1\` for \`limit\` to render the unlimited state (low neutral bar, no warning coloring).
- **Do** use \`dense\` when the meter sits inside a tight card or toolbar strip.

### 🔴 Don'ts
- **Don't** pre-format \`used\`/\`limit\` yourself — pass the raw numbers.
- **Don't** rely on color alone near the cap — the right-aligned numbers already carry the exact values.

### A11y
- **Provides:** label and used/limit are real text; \`v-progress-linear\` exposes the standard ARIA progressbar role.
- **Consumer must:** keep \`label\` meaningful on its own, since the meter has no surrounding heading by default.
        `,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Metric name shown on the left.' },
    used: { control: 'number', description: 'Current usage (raw number, compact-formatted internally).' },
    limit: { control: 'number', description: 'Plan cap (raw number). Pass -1 for unlimited.' },
    icon: { control: 'text', description: 'Optional Lucide icon shown before the label.' },
    hint: { control: 'text', description: 'Optional caption below the bar (e.g. reset cadence or upgrade nudge).' },
    dense: { control: 'boolean', description: 'Compact sizing: 4px bar height and smaller text.' },
  },
} satisfies Meta<typeof MpUsageMeter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Da Vinci AI tokens',
    icon: 'sparkles',
    used: 12_400,
    limit: 50_000,
  },
}

export const NearLimit: Story = {
  args: {
    label: 'Emails sent',
    icon: 'mail',
    used: 41_000,
    limit: 50_000,
  },
}

export const AtLimit: Story = {
  args: {
    label: 'Chatbots',
    icon: 'bot',
    used: 3,
    limit: 3,
  },
}

export const Unlimited: Story = {
  args: {
    label: 'Da Vinci AI tokens',
    icon: 'sparkles',
    used: 182_000,
    limit: -1,
    hint: 'Unlimited on your plan',
  },
}

export const DenseWithHint: Story = {
  args: {
    label: 'SMS sends',
    icon: 'message-square',
    used: 4_820,
    limit: 25_000,
    hint: 'Resets monthly · Upgrade for a larger allocation',
    dense: true,
  },
}
