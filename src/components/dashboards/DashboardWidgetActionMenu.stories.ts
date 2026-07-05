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
          'Kebab menu shared by dashboard widget cards: Expand, Edit, Refresh, and Remove. Remove is disabled unless `editable` (dashboard edit mode). Click the kebab button to open the menu.',
      },
    },
  },
  args: {
    widgetTitle: 'Revenue Over Time',
    editable: true,
  },
  argTypes: {
    widgetTitle: { control: 'text', description: 'Used for the aria-label on the activator button' },
    editable: { control: 'boolean', description: 'Enables the destructive Remove action' },
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

export const EditMode: Story = {}

export const ViewMode: Story = {
  args: {
    editable: false,
  },
}
