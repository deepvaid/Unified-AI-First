import type { Meta, StoryObj } from '@storybook/vue3'
import MpKpiCard from './MpKpiCard.vue'

const meta = {
  title: 'Data Display/MpKpiCard',
  component: MpKpiCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpKpiCard\` (Key Performance Indicator) is used primarily on dashboards to show high-level metrics, numbers, and their recent trends at a glance.

### 🟢 Do's
- **Do** arrange KPI cards in responsive \`v-row\` grids (usually 3 or 4 across on desktop).
- **Do** use semantic colors for the \`color\` prop based on the metric type (e.g., \`success\` for Revenue, \`primary\` for neutral stats like Total Users).
- **Do** provide a \`trend\` (e.g., "+12%") and an accompanying \`subStat\` context (e.g., "vs last week") to make the number actionable.

### 🔴 Don'ts
- **Don't** use complex charts inside a KPI Card. It should strictly contain the single top-level metric.
- **Don't** stretch KPI cards too wide. If you have only 2 metrics, don't make them 50% width on a huge screen; constrain their max-width.
- **Don't** forget to set \`trendPositive="true/false"\`. A dropping number isn't always bad (e.g., Bounce Rate dropping is good, Revenue dropping is bad). Control the color explicitly.

### 💡 Best Practices
- **Icons:** Pick an \`icon\` that cleanly represents the metric, and it will be rendered as a subtle watermarked background.
- **Typography:** The main value handles very large numbers automatically, but it's best practice to format your inputs cleanly (e.g., "1.2M" instead of "1,200,000" if space is tight).
        `,
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    icon: { control: 'text' },
    color: { control: 'select', options: ['primary', 'success', 'warning', 'error', 'secondary'] },
    trend: { control: 'text' },
    trendPositive: { control: 'boolean' },
    subStat: { control: 'text' },
    period: { control: 'text' },
  },
} satisfies Meta<typeof MpKpiCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Total Revenue',
    value: '$12,430',
    icon: 'dollar-sign',
    color: 'success',
    trend: '+12.5%',
    trendPositive: true,
    subStat: 'vs last month',
  },
}

export const NegativeTrend: Story = {
  args: {
    label: 'Bounce Rate',
    value: '4.2%',
    icon: 'mail-warning',
    color: 'error',
    trend: '-2.1%',
    trendPositive: false,
    subStat: 'vs last week',
  },
}

export const NoTrend: Story = {
  args: {
    label: 'Active Campaigns',
    value: '8',
    icon: 'megaphone',
    color: 'primary',
  },
}

export const WithPeriod: Story = {
  args: {
    label: 'Net Sales',
    value: '$8,214',
    icon: 'dollar-sign',
    color: 'success',
    trend: '+4.8%',
    trendPositive: true,
    period: 'Today',
  },
}

export const WithSparkline: Story = {
  render: () => ({
    components: { MpKpiCard },
    template: `
      <div style="max-width: 320px;">
        <MpKpiCard label="Revenue" value="$13,420" icon="dollar-sign" color="success" trend="+12.5%" :trendPositive="true" period="Last 30 days">
          <template #sparkline>
            <svg viewBox="0 0 96 36" width="96" height="36" fill="none">
              <path d="M0 30 L12 26 L24 28 L36 20 L48 22 L60 14 L72 16 L84 8 L96 10" stroke="rgb(var(--v-theme-primary))" stroke-width="2" stroke-linecap="round" />
            </svg>
          </template>
        </MpKpiCard>
      </div>
    `,
  }),
  args: {} as any, // Fixes TS strict mode error
}

export const DashboardRow: Story = {
  render: () => ({
    components: { MpKpiCard },
    template: `
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Total Revenue" value="$12,430" icon="dollar-sign" color="success" trend="+12.5%" :trendPositive="true" subStat="vs last month" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Orders Today" value="47" icon="package" color="primary" trend="+8" :trendPositive="true" subStat="vs yesterday" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Active Campaigns" value="8" icon="megaphone" color="secondary" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Open Rate" value="24.3%" icon="mail-open" color="warning" trend="-1.2%" :trendPositive="false" subStat="vs avg" />
        </v-col>
      </v-row>
    `,
  }),
  args: {} as any, // Fixes TS strict mode error
}
