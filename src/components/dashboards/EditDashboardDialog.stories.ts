import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import type { Dashboard } from '@/stores/dashboards/types'
import EditDashboardDialog from './EditDashboardDialog.vue'

function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    id: '2000290-lifecycle',
    accountId: '2000290',
    kind: 'custom',
    name: 'Lifecycle Health',
    description: 'Tracks engagement and retention across the customer lifecycle.',
    icon: 'line-chart',
    accent: 'secondary',
    isDefault: false,
    favorite: false,
    widgets: [],
    filters: { rangePreset: 'last_30_days', grain: 'daily', comparison: 'previous_period' },
    createdAt: '2026-05-02T09:00:00.000Z',
    updatedAt: '2026-07-01T14:30:00.000Z',
    ...overrides,
  }
}

const meta = {
  title: 'Dashboards/EditDashboardDialog',
  component: EditDashboardDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Modal for editing dashboard metadata — name, description, accent color, and icon. The header avatar previews the selected accent + icon live; saving persists via the dashboards store and emits `saved`.',
      },
    },
  },
  args: {
    accountId: '2000290',
    dashboard: makeDashboard(),
  },
  argTypes: {
    accountId: { control: 'text' },
    dashboard: { control: 'object' },
  },
  render: (args) => ({
    components: { EditDashboardDialog },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:640px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="pencil" @click="open = true">Edit dashboard</v-btn>
        <EditDashboardDialog v-bind="args" v-model="open" />
      </section>
    `,
  }),
} satisfies Meta<typeof EditDashboardDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LongContent: Story = {
  args: {
    dashboard: makeDashboard({
      id: '2000290-holiday',
      name: 'Holiday Trading Command Center — BFCM & December Peak',
      description:
        'A very long description that pushes the character counter close to its limit. Covers storefront revenue, campaign attribution, fulfillment backlog, support ticket load, and the retail POS lanes across all locations during the holiday peak trading window.',
      icon: 'rocket',
      accent: 'warning',
    }),
  },
}
