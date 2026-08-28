import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardAttentionData } from '@/stores/dashboards/types'
import DashboardAttentionWidget from './DashboardAttentionWidget.vue'

const ATTENTION: DashboardAttentionData = {
  kind: 'attention',
  items: [
    {
      id: 'att-payments',
      severity: 'critical',
      title: '3 payments failed in the last 24h',
      context: 'Retry or contact the customers before the orders auto-cancel.',
      occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      actionLabel: 'Review',
      dataSource: 'commerce',
      routeName: 'SalesOrders',
    },
    {
      id: 'att-stock',
      severity: 'warning',
      title: 'Low stock: 2 of your top 10 sellers',
      context: 'Trail Runner XT and Canvas Tote are below their reorder point.',
      occurredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      actionLabel: 'View products',
      dataSource: 'commerce',
      routeName: 'ProductsList',
    },
    {
      id: 'att-approval',
      severity: 'info',
      title: 'Campaign ‘Spring Refresh’ pending approval',
      context: 'Scheduled to send tomorrow at 9:00 AM once approved.',
      occurredAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      actionLabel: 'Approve',
      dataSource: 'marketing',
      routeName: 'EmailCampaigns',
    },
    {
      id: 'att-dns',
      severity: 'warning',
      title: 'Sending domain DNS not verified',
      context: 'Unverified DKIM records hurt deliverability on every send.',
      occurredAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      actionLabel: 'Fix',
      dataSource: 'marketing',
      routeName: 'CampaignReports',
    },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardAttentionWidget',
  component: DashboardAttentionWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Prioritized "Needs your attention" list body for dashboard widgets. Each row carries a severity dot (critical / warning / info), a per-row source-cloud chip (items span clouds, so there is no card-level chip), a relative timestamp, and a right-aligned action button that emits `action`. Shows a pulse-bar skeleton on first load and a "You\'re all caught up" empty state.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardAttentionData` — `{ kind: \'attention\', items }`. Each item carries `severity`, `title`, `detail`, `occurredAt`, `actionLabel`, `dataSource`, `routeName` and an optional Lucide `icon` (falls back to a per-severity glyph). Rows compose `MpListRow`, so their geometry is `component.listItem.*`.',
    },
  },
} satisfies Meta<typeof DashboardAttentionWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    data: ATTENTION,
  },
}

export const Empty: Story = {
  args: {
    data: { kind: 'attention', items: [] },
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** Two structures: the collapsed banner (a single tight row) and the expanded list of items needing attention. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardAttentionWidget },
    setup: () => ({ args }),
    template: `<DashboardAttentionWidget v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — a widget fills the grid cell it is placed in. This is one of the
 * three **bespoke-header** widgets: `DashboardWidgetCard` zeroes its body inset for these, so
 * the widget draws its own edges. Phase 4 (P4-1) made it state that inset as
 * `component.card.padding` — the role token, not the `20` primitive — so a change to the
 * standard moves it with the rest of the family.
 *
 * Rendered below at three cell sizes; the left edges should match the standard widgets'.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardAttentionWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardAttentionWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardAttentionWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardAttentionWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Collapsed, expanded, and cleared — nothing currently needs attention. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardAttentionWidget },
    setup: () => ({ args }),
    template: `<DashboardAttentionWidget v-bind="args" />`,
  }),
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget where it actually lives — inside a `DashboardWidgetCard`, in a
 * dashboard row beside its siblings. This is the composition P4-1 is judged on: the header
 * band, the body inset and the footer are the card's, and every widget in the family sits on
 * the same edge.
 */
export const InContextDashboardRow: Story = {
  render: (args) => ({
    components: { DashboardAttentionWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardAttentionWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardAttentionWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
