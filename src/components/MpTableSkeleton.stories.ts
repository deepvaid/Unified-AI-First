import type { Meta, StoryObj } from '@storybook/vue3'
import MpTableSkeleton from './MpTableSkeleton.vue'
import MpDataTableToolbar from './MpDataTableToolbar.vue'
import MpStatusChip from './MpStatusChip.vue'
import { ORDERS, ORDER_HEADERS } from '@/stories/fixtures'

const meta = {
  title: 'Atoms/MpTableSkeleton',
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

/** With and without the header row — the only structural axis. */
export const Variants: Story = {
  render: () => ({
    components: { MpTableSkeleton },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">showHeader (default)</div>
          <v-card flat border rounded="lg"><MpTableSkeleton :rows="3" :columns="4" /></v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">:show-header="false" — for list surfaces with no column head</div>
          <v-card flat border rounded="lg"><MpTableSkeleton :rows="3" :columns="4" :show-header="false" /></v-card>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Row and column counts are the size axis — match them to the table being stood in for. */
export const Sizes: Story = {
  render: () => ({
    components: { MpTableSkeleton },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">compact list — 3 rows, 2 columns</div>
          <v-card flat border rounded="lg"><MpTableSkeleton :rows="3" :columns="2" /></v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">default — 5 rows, 5 columns</div>
          <v-card flat border rounded="lg"><MpTableSkeleton /></v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">wide table — 8 rows, 7 columns</div>
          <v-card flat border rounded="lg"><MpTableSkeleton :rows="8" :columns="7" /></v-card>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * The skeleton has one state — loading — and it animates. The pulse is suppressed under
 * `prefers-reduced-motion: reduce`; toggle that OS setting to verify the static fallback.
 */
export const States: Story = {
  render: () => ({
    components: { MpTableSkeleton },
    template: `
      <div>
        <div class="text-caption text-medium-emphasis mb-2">loading — role="status", announces "Loading data…"</div>
        <v-card flat border rounded="lg"><MpTableSkeleton :rows="4" :columns="4" /></v-card>
      </div>
    `,
  }),
  args: {} as never,
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

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The loading state directly above the table it stands in for, on real-looking
 * orders. The two must line up: Phase 4 (P4-4) pinned both to the same `component.table.*`
 * tokens, so the skeleton's row height, header height and inline inset are the table's, not a
 * separate set that happened to look close. Before that the skeleton sat at the card inset (20)
 * against the table's 16, and a table swapping from loading to loaded shifted 4px sideways.
 *
 * Compare the column edges and row rhythm across the two cards below — they should be identical.
 */
export const InContextLoadingAnOrdersTable: Story = {
  render: () => ({
    components: { MpTableSkeleton, MpDataTableToolbar, MpStatusChip },
    setup: () => ({ rows: ORDERS.slice(0, 5), headers: ORDER_HEADERS.filter(h => h.key !== 'actions') }),
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">loading</div>
          <v-card flat border rounded="lg">
            <MpDataTableToolbar title="Sales Orders" search-placeholder="Search orders…" />
            <MpTableSkeleton :rows="5" :columns="7" />
          </v-card>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">loaded — same row rhythm, same column edges</div>
          <v-card flat border rounded="lg">
            <MpDataTableToolbar title="Sales Orders" :total-count="rows.length" search-placeholder="Search orders…" />
            <v-data-table :headers="headers" :items="rows" item-value="id" hide-default-footer>
              <template #item.fulfillment="{ item }">
                <MpStatusChip :status="item.fulfillment" type="fulfillment" size="sm" />
              </template>
              <template #item.status="{ item }">
                <MpStatusChip :status="item.status" type="order" size="sm" />
              </template>
            </v-data-table>
          </v-card>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}
