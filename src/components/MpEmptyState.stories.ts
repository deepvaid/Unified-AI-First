import type { Meta, StoryObj } from '@storybook/vue3'
import MpEmptyState from './MpEmptyState.vue'
import { stack } from '@/stories/storyTemplate'

const meta = {
  title: 'Molecules/MpEmptyState',
  component: MpEmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpEmptyState\` component is used when a container (like a table, list, or dashboard widget) has no data to display.

**Use when:** a list/table/grid resolved successfully but has zero items — first use, cleared data, or a search/filter with no matches.

**Don't use when:** the data failed to load (use \`MpErrorState\` — it carries \`role="alert"\` and retry semantics) or is still loading (use \`MpTableSkeleton\`).

### Usage
\`\`\`html
<MpEmptyState
  v-if="!loading && items.length === 0"
  icon="package"
  title="No orders yet"
  description="Once customers start placing orders, they will appear here."
  action-label="Create Draft Order"
  action-icon="plus"
  @action="drawer = true"
/>
\`\`\`

### 🟢 Do's
- **Do** provide a helpful, action-oriented description explaining *why* it's empty and *what* to do next.
- **Do** include a primary action button (\`action-label\` and \`@action\`) if the user has permission to create the missing item.
- **Do** select an appropriate Lucide icon (\`icon\` prop) that semantically relates to the missing content (e.g., \`users\` for missing contacts).

### 🔴 Don'ts
- **Don't** leave users dead-ended. Always provide a path forward, even if it's just "Clear filters" or a link to documentation.
- **Don't** blame the user. Say "No orders found for this search" rather than "You searched wrong."
- **Don't** use overly large or complex custom illustrations if the standard icon + text format suffices, to maintain consistency.

### 💡 Best Practices
- **Context:** If the empty state is caused by active search/filters yielding zero results, the action button should clear those filters.
- **First Use:** For "first use" scenarios (zero data ever created), the action button should be the primary "Create New" workflow.

### A11y
- **Provides:** the title carries \`role="heading"\` + \`aria-level\` (default 2, tune via \`headingLevel\`), so screen-reader users can jump to it via heading navigation *(fixed in the Phase 4 a11y pass)*; the CTA is a real \`v-btn\` with a visible focus indicator; the icon is decorative (\`v-icon\` is \`aria-hidden\`), so meaning lives in the title and description text.
- **Consumer must:** write a title that makes sense out of context ("No orders yet", not "Nothing here"), and point \`@action\` somewhere useful.
- **Gaps:** there is no live region, so a filter change that empties a list is not announced — deliberately left to consumers (a global \`role="status"\` here would announce on every initial render); announce result-count changes at the toolbar/page level instead.
        `,
      },
    },
  },
  argTypes: {
    headingLevel: { control: 'number', description: 'Heading level announced to assistive tech (`role="heading"` + `aria-level`). Set it to whatever keeps the pages outline correct where the state is mounted \u2014 it does not change the visual size.' },
    variant: {
      control: 'inline-radio',
      options: ['stack', 'launcher'],
      description: "Structure: 'stack' (centred icon + copy + action) or 'launcher' (adds a vertical menu of starting points in the default slot). Structural alternatives only — visual weight lives on `emphasis` (P2-7).",
    },
    emphasis: {
      control: 'inline-radio',
      options: ['default', 'prominent'],
      description: "Visual weight. 'prominent' is the illustration-led treatment with a larger measure and title, for high-visibility first-run moments. Shared system-wide vocabulary (P2-7).",
    },
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'error'],
      description: "Leading-glyph tone. 'error' renders it in the error colour on a soft disc — this is what MpErrorState composes.",
    },
    illustration: {
      control: 'select',
      options: ['no-results', 'empty-orders', 'empty-contacts', 'empty-campaigns', 'empty-products', 'empty-generic', 'start-here', 'error'],
      description: "MpIllustration name rendered when `emphasis=\"prominent\"` (or override via the #illustration slot in any variant).",
    },
    icon: { control: 'text', description: 'Lucide icon name rendered bare (size 40, medium-emphasis) above the title in the default variant. Omit to hide.' },
    title: { control: 'text', description: 'Required headline. Should make sense read on its own.' },
    description: { control: 'text', description: 'Supporting copy (max-width 420px, wraps).' },
    actionLabel: { control: 'text', description: 'CTA button label. Omit to render no button.' },
    actionIcon: { control: 'text', description: 'Lucide icon prepended to the CTA button.' },
    action: { control: false, description: 'Event — emitted when the CTA button is clicked.', table: { category: 'events' } },
    onAction: { action: 'action', table: { disable: true } },
  },
} satisfies Meta<typeof MpEmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: 'package',
    title: 'No orders yet',
    description: 'Once customers start placing orders, they will appear here.',
    actionLabel: 'Create Draft Order',
    actionIcon: 'plus',
  },
}

/** Both structures side by side. `launcher` swaps the single CTA for a menu of starting points. */
export const Variants: Story = {
  render: (args) => ({
    components: { MpEmptyState },
    setup: () => ({ args }),
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">variant="stack"</div>
          <MpEmptyState v-bind="args" variant="stack" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">variant="launcher"</div>
          <MpEmptyState title="How do you want to start?" description="Pick a starting point." variant="launcher">
            <v-btn variant="outlined" class="text-none justify-start" prepend-icon="file">Start from scratch</v-btn>
            <v-btn variant="outlined" class="text-none justify-start" prepend-icon="layout-template">Use a template</v-btn>
          </MpEmptyState>
        </div>
      </div>
    `,
  }),
  args: {
    icon: 'package',
    title: 'No orders yet',
    description: 'Once customers start placing orders, they will appear here.',
    actionLabel: 'Create Draft Order',
    actionIcon: 'plus',
  },
}

/**
 * The emphasis ramp. There is no `size` prop — an empty state fills its container,
 * so weight (not width) is the axis that varies.
 */
export const Emphasis: Story = {
  render: stack({ MpEmptyState }, [
    {
      label: 'emphasis="default" — 240px floor, 32px inset',
      args: { icon: 'package', title: 'No orders yet', description: 'Once customers start placing orders, they will appear here.' },
    },
    {
      label: 'emphasis="prominent" — 320px floor, 48px inset',
      args: {
        emphasis: 'prominent',
        illustration: 'empty-campaigns',
        title: 'Launch your first campaign',
        description: 'Reach your audience with a broadcast email.',
        actionLabel: 'Create campaign',
        actionIcon: 'plus',
      },
    },
  ]),
  args: {} as never,
}

/** Every state the component renders: with and without a CTA, with a description or bare, and the error tone MpErrorState composes. */
export const States: Story = {
  render: stack({ MpEmptyState }, [
    {
      label: 'with CTA',
      args: { icon: 'package', title: 'No orders yet', description: 'Once customers start placing orders, they will appear here.', actionLabel: 'Create Draft Order', actionIcon: 'plus' },
    },
    {
      label: 'no CTA — filtered result, nothing to create',
      args: { icon: 'search', title: 'No results found', description: 'Try adjusting your search or filter criteria.' },
    },
    { label: 'title only', args: { icon: 'inbox', title: 'Nothing here yet' } },
    {
      label: 'tone="error" — the shape MpErrorState wraps',
      args: { tone: 'error', icon: 'alert-triangle', title: 'Something went wrong', description: 'We could not load your orders.', actionLabel: 'Try again', actionIcon: 'refresh-cw' },
    },
  ]),
  args: {} as never,
}

// ── Scenarios ───────────────────────────────────────────────────────────────

/** Long title + multi-sentence description — copy wraps inside the 420px measure without breaking layout. */
export const LongCopy: Story = {
  args: {
    icon: 'inbox',
    title: 'No abandoned-cart automations are running for this store yet',
    description:
      'Abandoned-cart automations recover revenue by nudging shoppers who left items behind. '
      + 'Once you publish your first flow, enrolled contacts, sends, and recovered orders will all show up here. '
      + 'Most merchants start with a three-email sequence spaced over 48 hours.',
    actionLabel: 'Create abandoned-cart automation',
    actionIcon: 'plus',
  },
}
