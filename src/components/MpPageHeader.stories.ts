import type { Meta, StoryObj } from '@storybook/vue3'
import MpPageHeader from './MpPageHeader.vue'

const meta = {
  title: 'Layout/MpPageHeader',
  component: MpPageHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
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
- **Don't** add breadcrumb trails to page headers. Use sidebar context, tabs, or local back actions instead.
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
    variant: { control: 'select', options: ['default', 'display'], description: "'display' renders the title as a two-tone display-scale masthead; the subtitle becomes the muted second line at the same size. Used on module landing pages." },
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

export const WithActions: Story = {
  render: (args) => ({
    components: { MpPageHeader },
    setup: () => ({ args }),
    template: `
      <MpPageHeader v-bind="args">
        <template #actions>
          <v-btn variant="outlined" class="mr-2">Import</v-btn>
          <v-btn color="primary" prepend-icon="plus">New Campaign</v-btn>
        </template>
      </MpPageHeader>
    `,
  }),
  args: {
    title: 'Email Campaigns',
    subtitle: 'Create and manage your email campaigns',
  },
}

export const TitleOnly: Story = {
  args: {
    title: 'Dashboard',
  },
}

export const SectionLevel: Story = {
  args: {
    title: 'Users & Permissions',
    subtitle: 'Invite teammates and manage their access levels.',
    level: 2,
    density: 'compact',
  },
}

/** Eyebrow label above the title anchors the page in its module hierarchy. */
export const WithEyebrow: Story = {
  args: {
    title: 'Sales Orders',
    subtitle: 'Manage and fulfill customer orders',
    eyebrow: 'Commerce · Orders',
  },
}

/** Display variant: title and subtitle stack as a two-tone display-scale masthead. Used on module landing pages. */
export const DisplayVariant: Story = {
  args: {
    title: 'Marketing',
    subtitle: 'Campaigns, journeys, and content in one place',
    variant: 'display',
  },
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
      <div style="max-width: 720px;">
        <MpPageHeader v-bind="args">
          <template #actions>
            <v-btn variant="outlined">Export</v-btn>
            <v-btn color="primary" prepend-icon="plus">New</v-btn>
          </template>
        </MpPageHeader>
      </div>
    `,
  }),
  args: {
    title: 'Springtime Mega Sale — Returning VIP Customers (AU + NZ) Re-Engagement Program 2026',
    subtitle: 'A deliberately long subtitle that explains, in more words than strictly necessary, what this page covers so the wrapping behaviour of the header is visible.',
  },
}
