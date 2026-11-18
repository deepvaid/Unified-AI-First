import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import type { Dashboard } from '@/stores/dashboards/types'
import { overlayDocs } from '@/stories/decorators'
import DashboardFormDialog from './DashboardFormDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

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
  title: 'Product/Dashboards/DashboardFormDialog',
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
      <div>
        <v-btn color="primary" prepend-icon="plus" @click="open = true">Open dialog</v-btn>
        <div v-if="savedId" class="text-body-2 text-medium-emphasis mt-3">Saved dashboard: {{ savedId }}</div>
        <DashboardFormDialog v-bind="args" v-model="open" @saved="savedId = $event" />
      </div>
    `,
  }),
} satisfies Meta<typeof DashboardFormDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {
  parameters: overlayDocs(),
}

export const Edit: Story = {
  args: {
    dashboard: makeDashboard(),
  },
  parameters: overlayDocs(),
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
  parameters: overlayDocs(),
}

// ── Variants ────────────────────────────────────────────────────────────────

/**
 * Two structures, driven by whether a `dashboard` is passed: **create** and **edit**. The
 * mode label rides on `MpDialog`'s `eyebrow` and the live name on its `title`, so the header
 * narrates what is about to happen without a second heading. Both start closed; in create
 * mode the submit button stays disabled until the name is filled.
 */
export const Variants: Story = {
  render: () => ({
    components: { DashboardFormDialog },
    setup() {
      const which = ref('')
      return { which, dashboard: makeDashboard() }
    },
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'create'">Create</v-btn>
        <v-btn variant="outlined" @click="which = 'edit'">Edit</v-btn>

        <DashboardFormDialog :model-value="which === 'create'" account-id="2000290" @update:model-value="which = ''" />
        <DashboardFormDialog
          :model-value="which === 'edit'"
          account-id="2000290"
          :dashboard="dashboard"
          @update:model-value="which = ''"
        />
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The dialog opening from a dashboard switcher, the way it does in the product
 * — an empty-state card whose primary action is "New dashboard".
 */
export const InContextNewDashboard: Story = {
  render: () => ({
    components: { DashboardFormDialog, MpEmptyState },
    data: () => ({ open: false }),
    template: `
      <v-card flat border rounded="lg">
        <MpEmptyState
          title="No dashboards yet"
          icon="layout-dashboard"
          description="A dashboard is a saved layout of widgets. Start with a blank one and add widgets as you go."
          action-label="New dashboard"
          action-icon="plus"
          @action="open = true"
        />
        <DashboardFormDialog v-model="open" account-id="2000290" />
      </v-card>
    `,
  }),
  args: {} as never,
}
