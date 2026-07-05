import type { Meta, StoryObj } from '@storybook/vue3'
import DashboardSetupGuide, { type SetupGuideTask } from './DashboardSetupGuide.vue'

const TASKS: SetupGuideTask[] = [
  {
    title: 'Add your first product',
    description: 'Create a product so your store has something to sell.',
    icon: 'package',
    status: 'complete',
    complete: true,
    route: { name: 'ProductsList' },
  },
  {
    title: 'Connect a payment provider',
    description: 'Accept card payments at checkout.',
    icon: 'credit-card',
    status: 'complete',
    complete: true,
    route: { name: 'StoreSetup' },
  },
  {
    title: 'Set up shipping rates',
    description: 'Define zones and rates for order fulfillment.',
    icon: 'truck',
    status: 'pending',
    complete: false,
    route: { name: 'StoreSetup' },
  },
  {
    title: 'Import your contacts',
    description: 'Bring your audience into the platform.',
    icon: 'users',
    status: 'pending',
    complete: false,
    route: { name: 'AllContacts' },
  },
  {
    title: 'Send your first campaign',
    description: 'Launch an email campaign to your audience.',
    icon: 'megaphone',
    status: 'pending',
    complete: false,
    route: { name: 'EmailCampaigns' },
  },
]

const meta = {
  title: 'Dashboards/DashboardSetupGuide',
  component: DashboardSetupGuide,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Collapsible onboarding checklist rendered as a dashboard widget. Shows task completion progress and emits `selectTask` when a task row is clicked. `editable` reveals the drag handle used in dashboard edit mode.',
      },
    },
  },
  args: {
    tasks: TASKS,
    completedCount: 2,
    progress: 40,
    editable: false,
  },
  argTypes: {
    tasks: { control: 'object' },
    completedCount: { control: { type: 'number', min: 0, max: 5 } },
    progress: { control: { type: 'range', min: 0, max: 100 } },
    editable: { control: 'boolean' },
  },
  render: (args) => ({
    components: { DashboardSetupGuide },
    setup: () => ({ args }),
    template: `
      <div style="max-width:380px;height:440px;">
        <DashboardSetupGuide v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DashboardSetupGuide>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllComplete: Story = {
  args: {
    tasks: TASKS.map((task) => ({ ...task, complete: true, status: 'complete' })),
    completedCount: 5,
    progress: 100,
  },
}

export const EditMode: Story = {
  args: {
    editable: true,
  },
}
