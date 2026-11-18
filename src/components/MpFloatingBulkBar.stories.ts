import type { Meta, StoryObj } from '@storybook/vue3'
import MpFloatingBulkBar from './MpFloatingBulkBar.vue'
import { ref, watch } from 'vue'
import { overlayDocs } from '@/stories/decorators'
import { bulkActions } from '@/stories/storyTemplate'

const meta = {
  title: 'Molecules/MpFloatingBulkBar',
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
"Clear selection" button. The element is always mounted: at \`count\` 0 it is hidden (no
\`is-visible\` class, so it is transparent, \`visibility: hidden\` and ignores the pointer), and
it slides up into view when the count rises.

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
  <v-btn size="small" variant="text" class="text-none" prepend-icon="package-check">Mark fulfilled</v-btn>
  <v-btn size="small" variant="text" class="text-none" prepend-icon="download">Export</v-btn>
  <v-btn size="small" variant="text" class="text-none text-error" prepend-icon="trash-2">Delete</v-btn>
</MpFloatingBulkBar>
\`\`\`

### 🟢 Do's
- **Do** pass \`total\` so users can escalate a partial selection to everything ("Select all (42)").
  The button hides itself once \`count === total\`.
- **Do** populate the default slot with 2–4 clearly labeled actions as small text buttons with
  an icon: \`<v-btn size="small" variant="text" class="text-none" prepend-icon="…">\`. The bar
  gives them its own ink. This is the same button the Data Table pattern shows.
- **Do** ensure the \`@clear\` handler deselects everything in the underlying table.

### 🔴 Don'ts
- **Don't** use this component inside modals or drawers. It is designed only for the main
  page-level workspace (fixed, centered over \`v-main\`, bottom 24px).
- **Don't** provide more than 4 actions — use a dropdown menu if more bulk actions are required.
- **Don't** use \`variant="outlined"\` or elevated buttons inside the bar. No list page in the
  app does; the actions are text buttons on the dark bar surface.

### 💡 Best Practices
- **Destructive actions:** place dangerous bulk actions (like Delete) last, with
  \`class="text-none text-error"\`, and confirm them with \`MpConfirmDialog\` (\`danger\`).
  On the dark bar the destructive label takes the panel's own danger tint
  (\`--ink-panel-danger\`), not the error red, which is about 3:1 there.
- **Positioning:** the bar centers itself over the content area using Vuetify's
  \`--v-layout-left/right\` variables, so it stays centered when the sidebar collapses.

### A11y
- **Provides:** the bar is a \`role="status"\` region named "Bulk actions", so its appearance and
  count changes are announced politely and it is discoverable as a named region *(fixed in the
  Phase 4 a11y pass)*; all actions are real buttons with visible focus indicators; the count is
  visible text ("N selected"), not color-coded; "Select all (N)" states the target count in its
  label.
- **Consumer must:** keep slot buttons text-labeled (no icon-only bulk actions) and wire \`@clear\`
  so keyboard users can exit selection mode.
- **Gaps:** none known. The bar does not mount with \`v-if\`: it is always in the DOM and hidden
  with \`visibility: hidden\` at count 0.
        `,
      },
    },
  },
  argTypes: {
    count: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Number of selected rows. The bar is visible only while count > 0; the element stays mounted and toggles its `is-visible` class.',
    },
    total: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Total selectable rows. When provided and count < total, a "Select all (total)" button appears.',
    },
    clear: { control: false, description: 'Event — "Clear selection" clicked. Deselect everything in the table.', table: { category: 'events' } },
    selectAll: { control: false, description: 'Event — "Select all (N)" clicked. Select every row, not just the current page.', table: { category: 'events' } },
    default: { control: false, description: 'Slot — 2–4 bulk action buttons: small text buttons with an icon; destructive last with class="text-error".', table: { category: 'slots' } },
    onClear: { action: 'clear', table: { disable: true } },
    onSelectAll: { action: 'selectAll', table: { disable: true } },
  },
} satisfies Meta<typeof MpFloatingBulkBar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The bulk action buttons as the app writes them most often (Email campaigns, Landing pages,
 * Synonyms, Audience) and as the Data Table pattern shows them: small text buttons with a
 * `prepend-icon`, and the destructive action last with `text-error`.
 */
const ACTIONS = bulkActions(['export', 'delete'])

/**
 * One grid specimen: a caption above a frame of its own.
 *
 * The bar is `position: fixed` at the bottom of the viewport (`global.scss`), so several bars on
 * one canvas would all land on the same spot. The frame's `transform` makes it the containing
 * block for its bar, and `left: 50%` centres the bar on the frame instead of on the viewport.
 * Both are story-only: on a page the bar is never wrapped and never repositioned.
 */
function specimen(label: string, props: string) {
  return `
    <div>
      <div class="text-caption text-medium-emphasis mb-2">${label}</div>
      <div style="transform: translateZ(0); height: calc(var(--mp-space-64) * 2); border: 1px dashed var(--border-subtle); border-radius: var(--mp-component-card-radius);">
        <MpFloatingBulkBar ${props} style="left: 50%;">${ACTIONS}</MpFloatingBulkBar>
      </div>
    </div>
  `
}

/**
 * Bound to the Controls panel on the Canvas tab (the docs page frames it, and the Controls table there cannot drive a frame). "Clear selection" and "Select all" work as they do on a list
 * page, and both are logged in the Actions panel. The bar is fixed to the bottom of the
 * viewport, so on the docs page this story has its own frame.
 */
export const Default: Story = {
  args: { count: 5, total: 42 },
  parameters: overlayDocs('240px'),
  render: (args) => ({
    components: { MpFloatingBulkBar },
    setup() {
      // Follows the `count` control; the bar's own buttons then change it as a list page would.
      const count = ref(args.count)
      watch(() => args.count, (value) => { count.value = value })
      return { args, count }
    },
    template: `
      <div class="d-flex align-center ga-3">
        <v-btn variant="outlined" @click="count = Math.min(count + 1, args.total ?? count + 1)">Select another row</v-btn>
        <span class="text-body-2 text-medium-emphasis">{{ count }} of {{ args.total }} rows selected</span>
        <MpFloatingBulkBar v-bind="args" :count="count" @clear="count = 0" @select-all="count = args.total">
          ${ACTIONS}
        </MpFloatingBulkBar>
      </div>
    `,
  }),
}

/** Two structures: actions only, and with a `total`, which adds the "Select all (N)" button. */
export const Variants: Story = {
  render: () => ({
    components: { MpFloatingBulkBar },
    template: `
      <div class="d-flex flex-column ga-6">
        ${specimen('actions only', ':count="3"')}
        ${specimen('with total: offers "Select all"', ':count="3" :total="128"')}
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * The count is the state. One row selected, a few, every row (the "Select all" button hides
 * itself once `count === total`), and none: at 0 the bar stays in the DOM but is hidden, so
 * the last frame is empty.
 */
export const States: Story = {
  render: () => ({
    components: { MpFloatingBulkBar },
    template: `
      <div class="d-flex flex-column ga-6">
        ${specimen('count = 1', ':count="1" :total="128"')}
        ${specimen('count = 3', ':count="3" :total="128"')}
        ${specimen('count = total: no "Select all"', ':count="128" :total="128"')}
        ${specimen('count = 0: hidden', ':count="0" :total="128"')}
      </div>
    `,
  }),
  args: {} as never,
}
