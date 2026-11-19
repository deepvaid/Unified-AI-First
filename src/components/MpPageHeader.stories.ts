import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpPageHeader from './MpPageHeader.vue'
import MpFilterTabs from './MpFilterTabs.vue'
import MpStatusChip from './MpStatusChip.vue'
import { constrain } from '@/stories/decorators'
import { liquidskyDocs, stack } from '@/stories/storyTemplate'

const meta = {
  title: 'Molecules/MpPageHeader',
  component: MpPageHeader,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('molecules-mppageheader') + `
### Overview
The \`MpPageHeader\` sits at the very top of main application views. It provides context with a compact title/subtitle area, an optional back link for detail pages, and houses the primary page-level actions.

**Use when:** opening any main content view — list, detail, dashboard, or settings page. Every view starts with exactly one level-1 page header.

**Don't use when:** heading content inside cards, drawers, or dialogs — use \`MpSectionHeader\` or the overlay's own title area instead.

### Usage
\`\`\`html
<MpPageHeader
  title="Sales Orders"
  subtitle="Manage and fulfill customer orders"
  :back-to="\`/accounts/\${accountId}/orders\`"
>
  <template #actions>
    <v-btn color="primary" prepend-icon="plus">New Order</v-btn>
  </template>
  <template #tabs>
    <MpFilterTabs v-model="tab" :tabs="tabs" />
  </template>
</MpPageHeader>
\`\`\`

### 🟢 Do's
- **Do** use the \`#actions\` slot strictly for the main primary and secondary actions on the page (e.g., "New Campaign" or "Export").
- **Do** keep the \`title\` short (1-3 words) and use the \`subtitle\` to explain the purpose of the page if necessary.

### 🔴 Don'ts
- **Don't** build a linked breadcrumb trail. The \`eyebrow\` is the breadcrumb: plain text, section · page, at most three levels (see the WithEyebrow story). A detail page adds the \`backTo\` link to its parent list.
- **Don't** put form inputs, search bars, or complex filters inside the page header. Those belong in toolbars (like \`MpDataTableToolbar\`).
- **Don't** use this component inside dialogs, drawers, or cards. It spans the full width of the main content area.
- **Don't** stack too many buttons in the \`#actions\` slot. Limit to 1 primary and 1-2 secondary buttons to avoid clutter.

### 💡 Best Practices
- **Hierarchy:** The title is rendered as an \`h1\`, making it the most important typographical element on the screen for accessibility and structural clarity.
- **Responsiveness:** On smaller viewports, ensure that actions wrap properly or fall into a dropdown menu to prevent horizontal scrolling.

### A11y
- **Provides:** the title renders as a real heading (\`h1\`, or \`h2\` at \`level="2"\`); the back link is an anchor with \`aria-label="Back"\` and a visible \`:focus-visible\` ring.
- **Consumer must:** keep exactly one \`level="1"\` header per view so heading order stays valid, and give any icon-only buttons in \`#actions\` an \`aria-label\`.
- **Gaps:** none found at baseline.
        `,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Page title, rendered as an `h1` (level 1) or `h2` (level 2).' },
    subtitle: { control: 'text', description: 'Optional supporting line under the title.' },
    backTo: { control: 'text', description: 'Route location for the back arrow (path string or route object). Omit to hide the back button.' },
    level: { control: 'select', options: [1, 2], description: 'Heading level: 1 = page header (h1, display-scale title), 2 = section-level header (h2, modest title).' },
    density: { control: 'select', options: ['default', 'compact'], description: 'Bottom-margin density of the header block.' },
    eyebrow: { control: 'text', description: 'Optional muted, uppercase, tracked label rendered above the title (e.g. "COMMERCE · ORDERS").' },
    emphasis: { control: 'inline-radio', options: ['default', 'prominent'], description: "Visual weight. 'prominent' renders the title as a two-tone display-scale masthead; the subtitle becomes the muted second line at the same size. Used on module landing pages. Shared system-wide vocabulary (P2-7)." },
    actions: { control: false, description: 'Slot — page-level action buttons, right-aligned next to the title.', table: { category: 'slots' } },
    tabs: { control: false, description: 'Slot — rendered below the header block, e.g. `MpFilterTabs`.', table: { category: 'slots' } },
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

/**
 * Both emphasis levels. `prominent` stacks title and subtitle as a two-tone display-scale masthead.
 *
 * A level-1 header names the document (it sets `document.title`) and is the page's `h1`, so in
 * every grid on this page only the first specimen is level 1. The prominent masthead looks the
 * same at either level.
 */
export const Variants: Story = {
  render: stack({ MpPageHeader }, [
    { label: 'emphasis="default"', args: { title: 'Orders', subtitle: 'Every order across your sales channels' } },
    {
      label: 'emphasis="prominent"',
      args: { emphasis: 'prominent', level: 2, title: 'Marketing', subtitle: 'Campaigns, journeys, and content in one place' },
    },
  ]),
  args: {} as never,
}

/** There is no `size` prop: the heading `level` is what scales the header, and `density` tightens the space under it. */
export const HeadingLevels: Story = {
  render: stack({ MpPageHeader }, [
    {
      label: 'level=1 — page masthead (h1)',
      args: { level: 1, title: 'Orders', subtitle: 'Every order across your sales channels' },
    },
    {
      label: 'level=2 — section / drawer header (h2)',
      args: { level: 2, title: 'Shipping addresses', subtitle: 'Where this contact receives deliveries' },
    },
    {
      label: 'level=2, density="compact" — settings pages',
      args: { level: 2, density: 'compact', title: 'General', subtitle: 'Account name, timezone, and locale' },
    },
  ]),
  args: {} as never,
}

/**
 * Every combination of the optional parts, so a missing subtitle or eyebrow is verifiable.
 * Only the first specimen is level 1 (one `h1`, one `document.title` per canvas); the rest are
 * level 2, which is the same header at the section title size.
 */
export const States: Story = {
  render: () => ({
    components: { MpPageHeader, MpFilterTabs, MpStatusChip },
    setup: () => ({
      tab: ref('all'),
      tabs: [
        { label: 'All', key: 'all', count: 128 },
        { label: 'Processing', key: 'processing', count: 12 },
        { label: 'Completed', key: 'completed', count: 104 },
      ],
    }),
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">title only</div>
          <MpPageHeader title="Orders" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with subtitle</div>
          <MpPageHeader :level="2" title="Orders" subtitle="Every order across your sales channels" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with eyebrow</div>
          <MpPageHeader :level="2" eyebrow="Commerce · Orders" title="Order #10482" subtitle="Placed 12 Apr 2026" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with back link — tab to it to see the focus ring</div>
          <MpPageHeader :level="2" title="Order #10482" subtitle="Placed 12 Apr 2026" back-to="/accounts/2000290/orders" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">#title-append — a status chip beside the title (detail pages)</div>
          <MpPageHeader :level="2" eyebrow="Payment" title="$890.00" subtitle="Emma Johnson · Atlas Outfitters · Oct 2, 2026" back-to="/accounts/2000290/maropay/transactions">
            <template #title-append><MpStatusChip status="Refunded" type="payment" show-icon /></template>
          </MpPageHeader>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">#actions</div>
          <MpPageHeader :level="2" title="Orders" subtitle="Every order across your sales channels">
            <template #actions>
              <v-btn variant="outlined" class="text-none">Export</v-btn>
              <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus">New order</v-btn>
            </template>
          </MpPageHeader>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">#tabs — rendered under the header block</div>
          <MpPageHeader :level="2" title="Orders" subtitle="Every order across your sales channels">
            <template #tabs>
              <MpFilterTabs v-model="tab" :tabs="tabs" aria-label="Filter orders" />
            </template>
          </MpPageHeader>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * **The reference for LiquidSky's `AppBreadcrumb`.** The `eyebrow` is the breadcrumb: it names
 * where the page sits, as plain text with a middle dot between levels (at most three), and the
 * title names the page itself. The eyebrow is never a link (a detail page adds one back link,
 * see `WithBackLink`).
 *
 * Two levels is a module page (Sales Orders is "Commerce · Orders"). The three-level specimen is
 * a Settings page, which the app renders at `level="2"` with compact density.
 */
export const WithEyebrow: Story = {
  render: () => ({
    components: { MpPageHeader },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">two levels — a module page</div>
          <MpPageHeader
            eyebrow="Marketing · Campaigns"
            title="Email Campaigns"
            subtitle="Create and manage your email campaigns"
          />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">three levels — a Settings page (level 2, compact)</div>
          <MpPageHeader
            :level="2"
            density="compact"
            eyebrow="Settings · Sending domains · New domain"
            title="Add a sending domain"
            subtitle="Send campaigns from your own address once the DNS records are verified."
          />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Detail page with the back arrow to the parent list (`backTo`). Tab to it to see the focus ring. */
export const WithBackLink: Story = {
  args: {
    title: 'Order #10482',
    subtitle: 'Placed 12 Apr 2026 · Sarah Chen · $184.00',
    backTo: '/accounts/2000290/orders',
  },
}

/** Long title and subtitle next to actions — text wraps without pushing actions out of view. */
export const LongTitle: Story = {
  render: (args) => ({
    components: { MpPageHeader },
    setup: () => ({ args }),
    template: `
      <MpPageHeader v-bind="args">
        <template #actions>
          <v-btn variant="outlined">Export</v-btn>
          <v-btn color="primary" prepend-icon="plus">New</v-btn>
        </template>
      </MpPageHeader>
    `,
  }),
  decorators: [constrain('section')],
  args: {
    title: 'Springtime Mega Sale — Returning VIP Customers (AU + NZ) Re-Engagement Program 2026',
    subtitle: 'A deliberately long subtitle that explains, in more words than strictly necessary, what this page covers so the wrapping behaviour of the header is visible.',
  },
}
