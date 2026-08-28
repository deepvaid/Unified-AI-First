import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardActivityData } from '@/stores/dashboards/types'
import DashboardActivityWidget from './DashboardActivityWidget.vue'

const ACTIVITY: DashboardActivityData = {
  kind: 'activity',
  items: [
    {
      id: 'act-1',
      tag: 'email',
      icon: 'mail',
      eyebrow: '2 min ago',
      title: 'Spring Sale campaign delivered',
      meta: '12,480 recipients · 24.3% open rate',
    },
    {
      id: 'act-2',
      tag: 'order',
      icon: 'shopping-cart',
      eyebrow: '9 min ago',
      title: 'Order #10482 placed — $214.90',
      meta: 'Online store · 3 items',
    },
    {
      id: 'act-3',
      tag: 'audience',
      icon: 'users',
      eyebrow: '26 min ago',
      title: '38 new subscribers joined "VIP Customers"',
      meta: 'Segment refresh',
    },
    {
      id: 'act-4',
      tag: 'automation',
      icon: 'zap',
      eyebrow: '1 h ago',
      title: 'Welcome journey enrolled 12 contacts',
      meta: 'Journey: New customer welcome',
    },
    {
      id: 'act-5',
      tag: 'email',
      icon: 'mail-open',
      eyebrow: '2 h ago',
      title: 'Back-in-stock alert opened by 312 contacts',
      meta: 'Triggered email',
    },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardActivityWidget',
  component: DashboardActivityWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Scrolling live-activity feed body for dashboard widgets. Each item gets a tag-colored icon chip (email / order / audience / automation), a monospace timestamp eyebrow, and optional meta line.',
      },
    },
  },
  args: {
    data: ACTIVITY,
  },
  argTypes: {
    data: {
      control: 'object',
      description: '`DashboardActivityData` — `{ kind: \'activity\', items }`. Each item\'s `tag` (email / order / audience / automation) selects its tint from the cloud accent tokens; an unknown tag falls back to the email tint rather than rendering untinted.',
    },
  },
  render: (args) => ({
    components: { DashboardActivityWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" style="max-width:420px;height:320px;padding:12px 18px;">
        <DashboardActivityWidget v-bind="args" />
      </v-card>
    `,
  }),
} satisfies Meta<typeof DashboardActivityWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ShortFeed: Story = {
  args: {
    data: { kind: 'activity', items: ACTIVITY.items.slice(0, 2) },
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a reverse-chronological feed of events. Its variants are the event kinds it renders, each with its own glyph. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardActivityWidget },
    setup: () => ({ args }),
    template: `<DashboardActivityWidget v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — a widget fills the grid cell it is placed in. What Phase 4
 * (P4-1) guarantees is that the **inset** does not change with the cell: the distance from
 * the card's border to this widget's content is `component.card.padding` at every size,
 * inherited from the card standard set in Phase 3 rather than a second widget-only pair.
 *
 * Rendered below at three cell sizes inside a real `DashboardWidgetCard` — run your eye down
 * the left edges.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardActivityWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardActivityWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardActivityWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardActivityWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated and empty — a quiet account with nothing in the window yet. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardActivityWidget },
    setup: () => ({ args }),
    template: `<DashboardActivityWidget v-bind="args" />`,
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
    components: { DashboardActivityWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardActivityWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardActivityWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
