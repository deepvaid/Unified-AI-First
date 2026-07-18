import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import type { Dashboard } from '@/stores/dashboards/types'
import DashboardFormDialog from './DashboardFormDialog.vue'

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
  title: 'Dashboards/DashboardFormDialog',
  component: DashboardFormDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Create/edit modal for custom dashboards. With no `dashboard` prop it creates a new dashboard; with a `dashboard` it edits that one. Validates name (required, ≤60 chars) and description (≤240 chars), persists via the dashboards store, and emits `saved` with the dashboard id.',
      },
    },
  },
  args: {
    accountId: '2000290',
    dashboard: null,
  },
  argTypes: {
    accountId: { control: 'text', description: 'Account the dashboard belongs to' },
    dashboard: { control: 'object', description: 'Dashboard to edit; omit or null for create mode' },
  },
  render: (args) => ({
    components: { DashboardFormDialog },
    setup() {
      const open = ref(true)
      const savedId = ref('')
      return { args, open, savedId }
    },
    template: `
      <section style="min-height:640px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn color="primary" prepend-icon="plus" @click="open = true">Open dialog</v-btn>
        <div v-if="savedId" class="text-body-2 text-medium-emphasis mt-3">Saved dashboard: {{ savedId }}</div>
        <DashboardFormDialog v-bind="args" v-model="open" @saved="savedId = $event" />
      </section>
    `,
  }),
} satisfies Meta<typeof DashboardFormDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {}

export const Edit: Story = {
  args: {
    dashboard: makeDashboard(),
  },
}

export const EditLongContent: Story = {
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
