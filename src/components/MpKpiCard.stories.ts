import type { Meta, StoryObj } from '@storybook/vue3'
import MpKpiCard from './MpKpiCard.vue'
// The app loads the --cloud-* accent tokens via main.ts; preview.ts doesn't.
import '@/styles/source-cloud-colors.css'

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

**Use when:** surfacing a single headline metric with optional trend, period, and sparkline — dashboard stat rows, report summaries, module overviews.

**Don't use when:** the content needs a chart, table, or interaction — use a dashboard widget card instead. There is **no built-in loading state**: while data loads, render a skeleton placeholder (e.g. \`v-skeleton-loader\`) and swap in the card once the value resolves.

### Usage
\`\`\`html
<v-col cols="12" sm="6" md="3">
  <MpKpiCard
    label="Total Revenue"
    value="$12,430"
    icon="dollar-sign"
    color="success"
    trend="+12.5%"
    :trend-positive="true"
    sub-stat="vs last month"
  />
</v-col>
\`\`\`

### 🟢 Do's
- **Do** arrange KPI cards in responsive \`v-row\` grids (usually 3 or 4 across on desktop).
- **Do** use semantic colors for the \`color\` prop based on the metric type (e.g., \`success\` for Revenue, \`primary\` for neutral stats like Total Users).
- **Do** provide a \`trend\` (e.g., "+12%") and an accompanying \`subStat\` context (e.g., "vs last week") to make the number actionable.

### 🔴 Don'ts
- **Don't** use complex charts inside a KPI Card. It should strictly contain the single top-level metric.
- **Don't** stretch KPI cards too wide. If you have only 2 metrics, don't make them 50% width on a huge screen; constrain their max-width.
- **Don't** forget to set \`trendPositive="true/false"\`. A dropping number isn't always bad (e.g., Bounce Rate dropping is good, Revenue dropping is bad). Control the color explicitly.

### 💡 Best Practices
- **Icons:** Pick an \`icon\` that cleanly represents the metric; it renders in a tonal rounded tile tinted by \`color\`.
- **Typography:** The main value handles very large numbers automatically, but it's best practice to format your inputs cleanly (e.g., "1.2M" instead of "1,200,000" if space is tight).
- **Tones:** \`color\` accepts semantic theme tones and the six source-cloud accents (\`retail\`, \`marketing\`, \`contacts\`, \`analytics\`, \`commerce\`, \`service\`); unknown values fall back to \`primary\`.

### A11y
- **Provides:** all content is real text (label, value, trend, sub-stat) read in a sensible order; trend direction is conveyed by the +/- sign in the text and an arrow icon, never by color alone; value uses tabular numerals to avoid layout shift.
- **Consumer must:** pre-format \`value\`/\`trend\` into human-readable strings, and keep the \`label\` meaningful on its own (it is the only name the metric gets).
- **Gaps:** the card is a non-interactive surface — don't wrap it in a click handler without adding button semantics; trend icons are decorative (Vuetify marks \`v-icon\` \`aria-hidden\`), which is correct here since the sign carries the meaning.
        `,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Metric name, rendered as an uppercase eyebrow.' },
    value: { control: 'text', description: 'The headline stat (string or number). Pre-format it ("$12.4k", "24.3%").' },
    icon: { control: 'text', description: 'Lucide icon name shown in the tonal icon tile. Omit to hide the tile.' },
    color: {
      control: 'select',
      options: ['primary', 'success', 'info', 'warning', 'secondary', 'error', 'default', 'retail', 'marketing', 'contacts', 'analytics', 'commerce', 'service'],
      description: 'Icon-tile tone: semantic theme colors or source-cloud accents. Unknown values fall back to primary.',
    },
    trend: { control: 'text', description: 'Delta text next to the trend arrow ("+12.5%"). Omit for metrics with no movement.' },
    trendPositive: { control: 'boolean', description: 'Whether the movement is good news (green, up arrow) or bad (red, down arrow). Defaults to positive.' },
    subStat: { control: 'text', description: 'Small context line under the value ("vs last month").' },
    period: { control: 'text', description: 'Time window shown under the label ("Today", "Last 30 days").' },
    sparkline: { control: false, description: 'Slot — 96px-wide mini chart aligned with the value.', table: { category: 'slots' } },
    default: { control: false, description: 'Slot — extra content below the stat block.', table: { category: 'slots' } },
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

/** Trend state matrix: up (green), down (red), and flat (no trend row, optional sub-stat). */
export const TrendStates: Story = {
  render: () => ({
    components: { MpKpiCard },
    template: `
      <v-row style="max-width: 960px;">
        <v-col cols="12" sm="4">
          <MpKpiCard label="Revenue" value="$12,430" icon="trending-up" color="success" trend="+12.5%" :trendPositive="true" subStat="vs last month" />
        </v-col>
        <v-col cols="12" sm="4">
          <MpKpiCard label="Open Rate" value="24.3%" icon="mail-open" color="warning" trend="-1.2%" :trendPositive="false" subStat="vs last month" />
        </v-col>
        <v-col cols="12" sm="4">
          <MpKpiCard label="Active Campaigns" value="8" icon="megaphone" color="primary" subStat="No change" />
        </v-col>
      </v-row>
    `,
  }),
  args: {} as any, // Fixes TS strict mode error
}

/** Every icon-tile tone: semantic theme colors plus the six source-cloud accents. */
export const IconTones: Story = {
  render: () => ({
    components: { MpKpiCard },
    setup() {
      const semantic = ['primary', 'success', 'info', 'warning', 'secondary', 'error', 'default']
      const clouds = ['retail', 'marketing', 'contacts', 'analytics', 'commerce', 'service']
      return { semantic, clouds }
    },
    template: `
      <div>
        <h4 class="text-subtitle-2 mb-2">Semantic tones</h4>
        <v-row class="mb-4" dense>
          <v-col v-for="tone in semantic" :key="tone" cols="6" sm="3">
            <MpKpiCard :label="tone" value="1,024" icon="activity" :color="tone" />
          </v-col>
        </v-row>
        <h4 class="text-subtitle-2 mb-2">Source-cloud accents</h4>
        <v-row dense>
          <v-col v-for="tone in clouds" :key="tone" cols="6" sm="3">
            <MpKpiCard :label="tone" value="1,024" icon="activity" :color="tone" />
          </v-col>
        </v-row>
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
