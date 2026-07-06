import type { Meta, StoryObj } from '@storybook/vue3'
import MpFloatingBulkBar from './MpFloatingBulkBar.vue'
import { ref } from 'vue'

const meta = {
  title: 'Feedback/MpFloatingBulkBar',
  component: MpFloatingBulkBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpFloatingBulkBar\` appears fixed at the bottom of the workspace when rows are selected in
a list or grid. It shows the selection count, an optional "Select all (N)" escalation when
\`total\` is provided and \`count < total\`, the view's bulk action buttons (default slot), and a
"Clear selection" button. It renders nothing when \`count\` is 0 and slides in/out with a
\`v-slide-y-transition\`.

**Use when:** a \`v-data-table\`/grid supports row selection and offers bulk actions (fulfill,
export, tag, delete).

**Don't use when:** you're inside a drawer or dialog (it is fixed to the page-level workspace),
or there is only ever a single selectable item (use row actions instead).

### Usage
\`\`\`html
<MpFloatingBulkBar
  :count="selected.length"
  :total="orders.length"
  @select-all="selected = orders.map(o => o.id)"
  @clear="selected = []"
>
  <v-btn size="small" variant="outlined" prepend-icon="truck">Fulfill</v-btn>
  <v-btn size="small" variant="outlined" prepend-icon="download">Export</v-btn>
  <v-btn size="small" variant="outlined" color="error" prepend-icon="trash-2">Delete</v-btn>
</MpFloatingBulkBar>
\`\`\`

### 🟢 Do's
- **Do** pass \`total\` so users can escalate a partial selection to everything ("Select all (42)").
  The button hides itself once \`count === total\`.
- **Do** populate the default slot with 2–4 clearly labeled \`v-btn variant="outlined"\` actions.
- **Do** ensure the \`@clear\` handler deselects everything in the underlying table.

### 🔴 Don'ts
- **Don't** use this component inside modals or drawers. It is designed only for the main
  page-level workspace (fixed, centered over \`v-main\`, bottom 24px).
- **Don't** provide more than 4 actions — use a dropdown menu if more bulk actions are required.
- **Don't** use solid/elevated buttons inside the bar; stick to outlined variants against the
  solid bar surface.

### 💡 Best Practices
- **Destructive actions:** place dangerous bulk actions (like Delete) last and color them
  \`color="error"\`.
- **Positioning:** the bar centers itself over the content area using Vuetify's
  \`--v-layout-left/right\` variables, so it stays centered when the sidebar collapses.

### A11y
- **Provides:** all actions are real buttons with visible focus indicators; the count is visible
  text ("N selected"), not color-coded; "Select all (N)" states the target count in its label.
- **Consumer must:** keep slot buttons text-labeled (no icon-only bulk actions) and wire \`@clear\`
  so keyboard users can exit selection mode.
- **Gaps:** the bar is a plain \`div\` with no \`role="status"\`/\`aria-live\`, so its appearance
  and count changes are not announced to screen readers; it is not a named landmark/region, so
  it is hard to discover after selecting rows elsewhere in the page (noted for the Phase 4 a11y
  pass).
        `,
      },
    },
  },
  argTypes: {
    count: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Number of selected rows. The bar renders only while count > 0.',
    },
    total: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Total selectable rows. When provided and count < total, a "Select all (total)" button appears.',
    },
    clear: { control: false, description: 'Event — "Clear selection" clicked. Deselect everything in the table.', table: { category: 'events' } },
    selectAll: { control: false, description: 'Event — "Select all (N)" clicked. Select every row, not just the current page.', table: { category: 'events' } },
    default: { control: false, description: 'Slot — 2–4 outlined bulk action buttons; destructive last with color="error".', table: { category: 'slots' } },
  },
} satisfies Meta<typeof MpFloatingBulkBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MpFloatingBulkBar },
    setup() {
      const count = ref(5)
      return { count }
    },
    template: `
      <div style="min-height: 200px; position: relative;">
        <div class="d-flex gap-2 mb-4">
          <v-btn size="small" @click="count++">Select more</v-btn>
          <v-btn size="small" @click="count = Math.max(0, count - 1)">Deselect one</v-btn>
        </div>
        <MpFloatingBulkBar :count="count" @clear="count = 0">
          <v-btn size="small" variant="outlined" prepend-icon="truck">Fulfill</v-btn>
          <v-btn size="small" variant="outlined" prepend-icon="download">Export</v-btn>
          <v-btn size="small" variant="outlined" color="error" prepend-icon="trash-2">Delete</v-btn>
        </MpFloatingBulkBar>
      </div>
    `,
  }),
  args: {} as any, // Fixes TS strict mode error
}

/** Partial selection with a known total — the "Select all (42)" escalation is visible. */
export const WithSelectAll: Story = {
  render: () => ({
    components: { MpFloatingBulkBar },
    setup() {
      const count = ref(5)
      const total = ref(42)
      return { count, total }
    },
    template: `
      <div style="min-height: 200px; position: relative;">
        <MpFloatingBulkBar :count="count" :total="total" @clear="count = 0" @select-all="count = total">
          <v-btn size="small" variant="outlined" prepend-icon="tag">Tag</v-btn>
          <v-btn size="small" variant="outlined" color="error" prepend-icon="trash-2">Delete</v-btn>
        </MpFloatingBulkBar>
      </div>
    `,
  }),
  args: {} as any, // Fixes TS strict mode error
}

export const WithThreeSelected: Story = {
  args: { count: 3 },
  render: (args) => ({
    components: { MpFloatingBulkBar },
    setup: () => ({ args }),
    template: `
      <div style="min-height: 200px; position: relative;">
        <MpFloatingBulkBar v-bind="args">
          <v-btn size="small" variant="outlined" prepend-icon="tag">Tag</v-btn>
          <v-btn size="small" variant="outlined" prepend-icon="mail">Email</v-btn>
        </MpFloatingBulkBar>
      </div>
    `,
  }),
}

/** The minimum visible state — a single selected row ("1 selected"). */
export const OneSelected: Story = {
  args: { count: 1, total: 42 },
  render: (args) => ({
    components: { MpFloatingBulkBar },
    setup: () => ({ args }),
    template: `
      <div style="min-height: 200px; position: relative;">
        <MpFloatingBulkBar v-bind="args">
          <v-btn size="small" variant="outlined" prepend-icon="tag">Tag</v-btn>
          <v-btn size="small" variant="outlined" color="error" prepend-icon="trash-2">Delete</v-btn>
        </MpFloatingBulkBar>
      </div>
    `,
  }),
}

/** Everything selected (count === total) — the "Select all" button hides itself. */
export const AllSelected: Story = {
  args: { count: 42, total: 42 },
  render: (args) => ({
    components: { MpFloatingBulkBar },
    setup: () => ({ args }),
    template: `
      <div style="min-height: 200px; position: relative;">
        <MpFloatingBulkBar v-bind="args">
          <v-btn size="small" variant="outlined" prepend-icon="tag">Tag</v-btn>
          <v-btn size="small" variant="outlined" prepend-icon="download">Export</v-btn>
          <v-btn size="small" variant="outlined" color="error" prepend-icon="trash-2">Delete</v-btn>
        </MpFloatingBulkBar>
      </div>
    `,
  }),
}
