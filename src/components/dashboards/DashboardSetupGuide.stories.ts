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
  title: 'Product/Dashboards/DashboardSetupGuide',
  component: DashboardSetupGuide,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Collapsible onboarding checklist rendered as a dashboard widget. Shows task completion progress and emits `selectTask` when a task row is clicked. `draggable` reveals the hover drag grip used in grid context.',
      },
    },
  },
  args: {
    tasks: TASKS,
    completedCount: 2,
    progress: 40,
    draggable: false,
  },
  argTypes: {
    totalCount: { control: 'number', description: 'Overall task total when `tasks` is a subset (e.g. the next 5 of 16). Defaults to `tasks.length`.' },
    guideRoute: { control: 'object', description: '`RouteLocationRaw`. When set, a View full guide link renders under the list.' },
    tasks: {
      control: 'object',
      description: '`SetupGuideTask[]` to render. May be a subset (e.g. the next 5 of 16) — set `totalCount` when it is.',
    },
    completedCount: {
      control: { type: 'number', min: 0, max: 5 },
      description: 'How many tasks are done, shown as the numerator in the progress line.',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Completion percentage (0-100) driving the progress bar. Passed rather than derived so a subset of `tasks` still reports overall progress honestly.',
    },
    draggable: {
      control: 'boolean',
      description: 'Grid context only: reveals the drag grip on hover. Layout is always directly editable; this just shows the affordance.',
    },
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

export const Draggable: Story = {
  args: {
    draggable: true,
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * One structure — a checklist card. What varies is progress, which is a state rather than a
 * variant; see `States` below. Kept as its own story so the template reads consistently
 * across every Phase 4 component.
 */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardSetupGuide },
    setup: () => ({ args }),
    template: `<DashboardSetupGuide v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — the guide spans its container. Its inset is `component.card.*`,
 * the same standard the widget family took in P4-1, so the guide and the widgets beside it on
 * a dashboard share one edge.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardSetupGuide },
    setup: () => ({ args }),
    template: `
      <div class="d-flex flex-column ga-6">
        <div style="max-width: 420px"><DashboardSetupGuide v-bind="args" /></div>
        <div><DashboardSetupGuide v-bind="args" /></div>
      </div>
    `,
  }),
}

/** Fresh, partly done, and complete — the three states a checklist actually has. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardSetupGuide },
    setup: () => ({ args }),
    template: `<DashboardSetupGuide v-bind="args" />`,
  }),
}
