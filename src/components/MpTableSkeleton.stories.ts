import type { Meta, StoryObj } from '@storybook/vue3'
import MpTableSkeleton from './MpTableSkeleton.vue'

const meta = {
  title: 'Feedback/MpTableSkeleton',
  component: MpTableSkeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpTableSkeleton\` component is a loading placeholder that mimics the shape of a data table while its rows are being fetched. It keeps layout stable (no content shift) and communicates progress.

### 🟢 Do's
- **Do** match \`columns\` to the real table's column count so the layout doesn't jump when data arrives.
- **Do** show it only during the initial load; for background refreshes prefer a subtle inline indicator.
- **Do** swap to \`MpEmptyState\` (no data) or \`MpErrorState\` (load failed) once the request resolves.

### 🔴 Don'ts
- **Don't** animate aggressively — the pulse is intentionally gentle and disables under \`prefers-reduced-motion\`.
- **Don't** leave a skeleton on screen indefinitely; always resolve to a real state.

### 💡 Best Practices
- Announced via \`role="status"\` / \`aria-live="polite"\` so screen-reader users know content is loading.
        `,
      },
    },
  },
  argTypes: {
    rows: { control: { type: 'number', min: 1, max: 20 } },
    columns: { control: { type: 'number', min: 1, max: 10 } },
    showHeader: { control: 'boolean' },
  },
} satisfies Meta<typeof MpTableSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    rows: 5,
    columns: 5,
    showHeader: true,
  },
}

export const CompactList: Story = {
  args: {
    rows: 4,
    columns: 3,
    showHeader: false,
  },
}

export const WideTable: Story = {
  args: {
    rows: 8,
    columns: 7,
    showHeader: true,
  },
}
