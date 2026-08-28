import type { Meta, StoryObj } from '@storybook/vue3'
import DashboardWidgetActionMenu from './DashboardWidgetActionMenu.vue'

const meta = {
  title: 'Product/Dashboards/DashboardWidgetActionMenu',
  component: DashboardWidgetActionMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Unified kebab menu for every dashboard widget card: Expand, Edit, View report, a Size S/M/L/XL preset row (`currentSize` highlighted; none when the widget has a custom dragged size), and Remove. Click the kebab button to open the menu.',
      },
    },
  },
  args: {
    widgetTitle: 'Revenue Over Time',
    currentSize: 'M',
  },
  argTypes: {
    widgetTitle: { control: 'text', description: 'Used for the aria-label on the activator button' },
    currentSize: {
      control: 'select',
      options: ['S', 'M', 'L', 'XL', null],
      description: 'Highlighted size preset; null when the widget was dragged to a custom size',
    },
  },
  render: (args) => ({
    components: { DashboardWidgetActionMenu },
    setup: () => ({ args }),
    template: `
      <div style="min-height:320px;display:flex;align-items:flex-start;justify-content:flex-end;max-width:480px;">
        <DashboardWidgetActionMenu v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DashboardWidgetActionMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomSize: Story = {
  args: {
    currentSize: null,
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * One structure — a kebab opening the widget's actions. Open it to see the rows; they are
 * `component.listItem.*` like every other menu row in the system, so a widget menu and a table
 * row menu are the same height.
 */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardWidgetActionMenu },
    setup: () => ({ args }),
    template: `<div class="d-flex ga-6"><DashboardWidgetActionMenu v-bind="args" /></div>`,
  }),
}

/**
 * The trigger sits in the widget card's floating overlay and is sized by
 * `component.widget.actionSize` (32) — the same token the overlay's inset and gap come from,
 * and the same three tokens P4-2 derives a bespoke header's clearance from. It is deliberately
 * smaller than the 40px control baseline: it floats over content rather than sitting in a
 * control row.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardWidgetActionMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex align-center ga-4">
        <DashboardWidgetActionMenu v-bind="args" />
        <div class="text-body-2 text-medium-emphasis">32px — --mp-component-widget-actionSize</div>
      </div>
    `,
  }),
}

/** Closed, open, and open with a destructive action separated by a divider. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardWidgetActionMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-10">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">resting</div>
          <DashboardWidgetActionMenu v-bind="args" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">hover / focus — tab to it</div>
          <DashboardWidgetActionMenu v-bind="args" />
        </div>
      </div>
    `,
  }),
}
