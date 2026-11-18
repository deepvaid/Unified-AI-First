import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import DvExpandDialog from './DvExpandDialog.vue'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'
import { overlayDocs } from '@/stories/decorators'

const BAR_DRAFT: DashboardWidgetDraft = {
  dashboardId: '2000290-home',
  type: 'bar',
  title: 'Revenue by Channel',
  subtitle: 'last 30 days',
  dataSource: 'commerce',
  metricId: 'commerce_revenue_by_channel',
  dimension: 'channel',
  drilldown: { routeName: 'SalesSummary', label: 'Open sales summary' },
}

const meta = {
  title: 'Product/Da Vinci/DvExpandDialog',
  component: DvExpandDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    draft: BAR_DRAFT,
    typeLabel: 'Bar chart',
    isAdded: false,
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'Open state. `v-model` \u2014 the dialog emits `update:modelValue` and never closes itself.' },
    draft: {
      control: 'object',
      description: '`DashboardWidgetDraft` being previewed at full size. The dialog renders it through `DvDraftPreview`, so it shows exactly what the card showed.',
    },
    typeLabel: {
      control: 'text',
      description: 'Human-readable widget type shown in the subtitle, e.g. \\"Bar chart\\". Joined with the draft subtitle as `typeLabel - subtitle`.',
    },
    isAdded: {
      control: 'boolean',
      description: 'True once the draft has been added to a dashboard — swaps the primary action from Add to a confirmed state so the same draft cannot be added twice.',
    },
  },
  parameters: {
    docs: {
      // Every story opens the dialog on mount, so each gets its own frame on the docs page.
      ...overlayDocs('720px').docs,
      description: {
        component: `
## Overview
DvExpandDialog is the full-size preview of a Da Vinci widget draft (opened from
the maximize action on \`DvWidgetDraftCard\`). It renders \`DvDraftPreview\` at
expanded density on a background panel, with Close / "Add to dashboard" actions.
In this story, clicking Add flips the footer button into its disabled "Added" state.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvExpandDialog },
    setup() {
      const open = ref(true)
      const added = ref(args.isAdded)
      return { args, open, added }
    },
    template: `
      <div>
        <v-btn color="primary" class="text-none" prepend-icon="maximize-2" @click="open = true">
          Preview at full size
        </v-btn>
        <DvExpandDialog v-bind="args" v-model="open" :is-added="added" @add="added = true" />
      </div>
    `,
  }),
} satisfies Meta<typeof DvExpandDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Open dialog with the enlarged preview and an active Add action. */
export const Default: Story = {}

/** Draft already committed — Add action disabled with a check. */
export const AlreadyAdded: Story = {
  args: { isAdded: true },
}
