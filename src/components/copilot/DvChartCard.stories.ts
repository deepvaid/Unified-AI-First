import type { Meta, StoryObj } from '@storybook/vue3'
import DvChartCard from './DvChartCard.vue'

const meta = {
  title: 'Product/Da Vinci/DvChartCard',
  component: DvChartCard,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title of the chart'
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle or time range'
    },
    bars: {
      description: 'Array of arrays, each inner array represents values for a data series',
      control: false
    },
    labels: {
      description: 'X-axis labels for each bar group',
      control: false
    },
    seriesNames: {
      description: 'Names for each data series (appears in legend if provided)',
      control: false
    }
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvChartCard displays bar chart data with support for single or multi-series visualization. It's designed to show performance metrics, trends, and comparisons in the AI copilot dashboard.

## Do's
- Use for comparing metrics across time periods or categories
- Provide clear, descriptive titles
- Use seriesNames for multi-series data
- Keep data sets reasonably sized for clarity
- Use consistent color schemes

## Don'ts
- Don't use for more than 3-4 series (becomes hard to read)
- Don't use without clear axis labels
- Don't show data with extreme value ranges without scaling
- Don't omit legends for multi-series charts

## Best Practices
- Use for revenue, traffic, conversion trends
- Include time period in subtitle (e.g., "Last 12 Months")
- Sort categories logically (chronological, alphabetical, or by value)
- Provide context about what metrics mean
        `
      }
    }
  }
} satisfies Meta<typeof DvChartCard>

export default meta
type Story = StoryObj<typeof meta>


export const Default: Story = {
  args: {
    title: 'Revenue by Month',
    subtitle: 'Last 12 Months',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    bars: [[24000, 28000, 32000, 29000, 35000, 41000, 38000, 43000, 47000, 51000, 48000, 56000]]
  }
}

/** Single series vs multi-series with a legend — the structural axis. */
export const Variants: Story = {
  render: () => ({
    components: { DvChartCard },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">single series — no legend</div>
          <DvChartCard
            title="Revenue by Month" subtitle="Last 6 months"
            :labels="['Jan','Feb','Mar','Apr','May','Jun']"
            :bars="[[24000, 28000, 32000, 29000, 35000, 41000]]"
          />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">multi series — legend appears</div>
          <DvChartCard
            title="Revenue Comparison" subtitle="This year vs last"
            :labels="['Jan','Feb','Mar','Apr','May','Jun']"
            :series-names="['This Year','Last Year']"
            :bars="[[24000, 28000, 32000, 29000, 35000, 41000], [19000, 21000, 26000, 24000, 28000, 33000]]"
          />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Bar-count is the size axis — the plot area is fixed, so bars thin as the series grows. */
export const Sizes: Story = {
  render: () => ({
    components: { DvChartCard },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">6 bars</div>
          <DvChartCard title="Six months" :labels="['Jan','Feb','Mar','Apr','May','Jun']" :bars="[[24,28,32,29,35,41]]" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">12 bars</div>
          <DvChartCard
            title="Twelve months"
            :labels="['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']"
            :bars="[[24,28,32,29,35,41,38,43,47,51,48,56]]"
          />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** With and without a subtitle, and a flat series where every bar is equal. */
export const States: Story = {
  render: () => ({
    components: { DvChartCard },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with subtitle</div>
          <DvChartCard title="Revenue" subtitle="Last 6 months" :labels="['Jan','Feb','Mar','Apr','May','Jun']" :bars="[[24,28,32,29,35,41]]" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">title only</div>
          <DvChartCard title="Revenue" :labels="['Jan','Feb','Mar','Apr','May','Jun']" :bars="[[24,28,32,29,35,41]]" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">flat series — every bar at the max</div>
          <DvChartCard title="Flat" :labels="['Jan','Feb','Mar','Apr','May','Jun']" :bars="[[30,30,30,30,30,30]]" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

export const WithLegend: Story = {
  args: {
    title: 'Revenue Comparison',
    subtitle: 'This Year vs Last Year',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    seriesNames: ['This Year', 'Last Year'],
    bars: [
      [24000, 28000, 32000, 29000, 35000, 41000],
      [18000, 22000, 25000, 23000, 28000, 32000]
    ]
  }
}
