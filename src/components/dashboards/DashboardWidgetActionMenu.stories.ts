import type { Meta, StoryObj } from '@storybook/vue3'
import DashboardWidgetActionMenu from './DashboardWidgetActionMenu.vue'

const meta = {
  title: 'Dashboards/DashboardWidgetActionMenu',
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
