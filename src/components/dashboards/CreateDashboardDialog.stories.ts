import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import CreateDashboardDialog from './CreateDashboardDialog.vue'

const meta = {
  title: 'Dashboards/CreateDashboardDialog',
  component: CreateDashboardDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Modal for creating a new custom dashboard. Validates name (required, ≤60 chars) and description (≤240 chars), then persists via the dashboards store and emits `created` with the new dashboard id.',
      },
    },
  },
  args: {
    accountId: '2000290',
  },
  argTypes: {
    accountId: { control: 'text', description: 'Account the dashboard is created under' },
  },
  render: (args) => ({
    components: { CreateDashboardDialog },
    setup() {
      const open = ref(true)
      const createdId = ref('')
      return { args, open, createdId }
    },
    template: `
      <section style="min-height:520px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn color="primary" prepend-icon="plus" @click="open = true">New dashboard</v-btn>
        <div v-if="createdId" class="text-body-2 text-medium-emphasis mt-3">Created dashboard: {{ createdId }}</div>
        <CreateDashboardDialog v-bind="args" v-model="open" @created="createdId = $event" />
      </section>
    `,
  }),
} satisfies Meta<typeof CreateDashboardDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
