import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardTableData } from '@/stores/dashboards/types'
import DashboardTableWidget from './DashboardTableWidget.vue'

const RECENT_ORDERS: DashboardTableData = {
  kind: 'table',
  columns: [
    { key: 'order', label: 'Order' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total', align: 'end' },
    { key: 'status', label: 'Status' },
  ],
  rows: [
    { order: '#10482', customer: 'Ava Thompson', total: '$214.90', status: 'Paid' },
    { order: '#10481', customer: 'Liam Nguyen', total: '$89.00', status: 'Paid' },
    { order: '#10480', customer: 'Sofia Rossi', total: '$402.50', status: 'Pending' },
    { order: '#10479', customer: 'Noah Patel', total: '$156.20', status: 'Paid' },
    { order: '#10478', customer: 'Mia Johansson', total: '$74.99', status: 'Refunded' },
  ],
}

const TOP_CAMPAIGNS: DashboardTableData = {
  kind: 'table',
  columns: [
    { key: 'campaign', label: 'Campaign' },
    { key: 'revenue', label: 'Revenue', align: 'end' },
    { key: 'openRate', label: 'Open rate', align: 'end' },
  ],
  rows: [
    { campaign: 'Spring Sale Announcement', revenue: '$12,480', openRate: '28.4% open rate' },
    { campaign: 'VIP Early Access', revenue: '$8,920', openRate: '34.1% open rate' },
    { campaign: 'Back in Stock: Bestsellers', revenue: '$5,140', openRate: '22.7% open rate' },
    { campaign: 'Weekend Flash Deal', revenue: '$3,660', openRate: '19.2% open rate' },
    { campaign: 'New Arrivals — June', revenue: '$2,310', openRate: '17.8% open rate' },
  ],
}

const meta = {
  title: 'Dashboards/Widgets/DashboardTableWidget',
  component: DashboardTableWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Table body for dashboard widgets. Generic column/row payloads render as a compact sticky-header table; payloads with `campaign` + `revenue` columns switch to the top-campaigns meter-list layout unless a column carries `cellType: "status"`, which keeps the real table and renders that column as MpStatusChips.',
      },
    },
  },
  args: {
    data: RECENT_ORDERS,
  },
  argTypes: {
    data: { control: 'object' },
  },
  render: (args) => ({
    components: { DashboardTableWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" style="max-width:560px;height:320px;padding:8px 18px;">
        <DashboardTableWidget v-bind="args" />
      </v-card>
    `,
  }),
} satisfies Meta<typeof DashboardTableWidget>

export default meta
type Story = StoryObj<typeof meta>

export const GenericTable: Story = {}

export const TopCampaignsList: Story = {
  args: { data: TOP_CAMPAIGNS },
}

const STATUS_CHIP_TABLE: DashboardTableData = {
  kind: 'table',
  columns: [
    { key: 'campaign', label: 'Campaign' },
    { key: 'status', label: 'Status', cellType: 'status', statusType: 'campaign' },
    { key: 'openRate', label: 'Open Rate', align: 'end' },
    { key: 'revenue', label: 'Revenue', align: 'end' },
  ],
  rows: [
    { campaign: 'Flash Sale — 4 Hours Only', status: 'Sent', openRate: '69.6%', revenue: '$134,521.75' },
    { campaign: 'Cyber Monday Flash Sale', status: 'Sent', openRate: '47.4%', revenue: '$98,432.75' },
    { campaign: 'January Sale', status: 'Scheduled', openRate: '37.4%', revenue: '$56,789.25' },
    { campaign: 'December Holiday Gift Guide', status: 'Draft', openRate: '41.8%', revenue: '$45,234.50' },
  ],
}

export const StatusChipColumns: Story = {
  args: { data: STATUS_CHIP_TABLE },
  parameters: {
    docs: {
      description: {
        story:
          'A status column (`cellType: "status"`) renders MpStatusChips and opts the table out of the campaign meter-list treatment — this is the shadcn Overview "Top campaigns" configuration.',
      },
    },
  },
}
