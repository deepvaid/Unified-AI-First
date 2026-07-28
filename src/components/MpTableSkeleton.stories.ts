import type { Meta, StoryObj } from '@storybook/vue3'
import MpTableSkeleton from './MpTableSkeleton.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

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

**Use when:** the initial load of a table or row-shaped list, rendered inside the same \`v-card flat border\` the table will occupy.

**Don't use when:** background refreshes of already-visible data (use a subtle inline indicator), or non-tabular content (use \`v-skeleton-loader\` with an appropriate type).

### Usage
\`\`\`html
<v-card flat border rounded="lg">
  <MpTableSkeleton v-if="loading" :rows="6" :columns="5" />
  <v-data-table v-else :items="items" :headers="headers" />
</v-card>
\`\`\`

### 🟢 Do's
- **Do** match \`columns\` to the real table's column count so the layout doesn't jump when data arrives.
- **Do** show it only during the initial load; for background refreshes prefer a subtle inline indicator.
- **Do** swap to \`MpEmptyState\` (no data) or \`MpErrorState\` (load failed) once the request resolves.

### 🔴 Don'ts
- **Don't** animate aggressively — the pulse is intentionally gentle and disables under \`prefers-reduced-motion\`.
- **Don't** leave a skeleton on screen indefinitely; always resolve to a real state.

### A11y
- **Provides:** \`role="status"\` + \`aria-live="polite"\` with a visually-hidden "Loading data…" message, so screen-reader users hear that content is loading; the pulse animation is fully disabled under \`prefers-reduced-motion\`; bars are purely decorative divs.
- **Consumer must:** always resolve to a real state (data, \`MpEmptyState\`, or \`MpErrorState\`) — a permanent skeleton is announced once and then leaves users stranded.
- **Gaps:** none found at baseline.
        `,
      },
    },
  },
  argTypes: {
    rows: { control: { type: 'number', min: 1, max: 20 }, description: 'Number of body rows to render. Default 5 — roughly match the expected page size.' },
    columns: { control: { type: 'number', min: 1, max: 10 }, description: 'Number of bars per row. Default 5 — match the real table\'s column count to avoid layout shift.' },
    showHeader: { control: 'boolean', description: 'Render a darker header row of bars above the body rows. Turn off for headerless lists.' },
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

/** Composed the way list views use it: inside the bordered card the table will occupy. */
export const InCard: Story = {
  render: (args) => ({
    components: { MpTableSkeleton },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg">
        <MpTableSkeleton v-bind="args" />
      </v-card>
    `,
  }),
  args: {
    rows: 6,
    columns: 5,
    showHeader: true,
  },
}

export const DarkModeInCard: Story = {
  globals: darkModeGlobals,
  ...InCard,
}
