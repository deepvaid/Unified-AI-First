import type { Meta, StoryObj } from '@storybook/vue3'
import DashboardWidgetActionMenu from './DashboardWidgetActionMenu.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Dashboards/DashboardWidgetActionMenu',
  component: DashboardWidgetActionMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Unified kebab menu for every dashboard widget card: Expand, Edit, View report, a Size S/M/L/XL preset row (`currentSize` highlighted; none when the widget has a custom dragged size), and Remove. Click the kebab button to open the menu.',
      },
    },
  },
  args: {
    widgetTitle: 'Revenue Over Time',
    currentSize: 'M',
  },
  argTypes: {
    widgetTitle: { control: 'text', description: 'Used for the aria-label on the activator button' },
    currentSize: {
      control: 'select',
      options: ['S', 'M', 'L', 'XL', null],
      description: 'Highlighted size preset; null when the widget was dragged to a custom size',
    },
  },
  render: (args) => ({
    components: { DashboardWidgetActionMenu },
    setup: () => ({ args }),
    template: `
      <div style="min-height:320px;display:flex;align-items:flex-start;justify-content:flex-end;max-width:480px;">
        <DashboardWidgetActionMenu v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DashboardWidgetActionMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomSize: Story = {
  args: {
    currentSize: null,
  },
}

/**
 * Regression guard for overlay-over-card contrast: a widget card (L1 `--surface-primary`)
 * with its kebab menu opened (L3 `--surface-overlay`) on top. The menu surface must stay
 * visibly distinct from the card behind it — if the two tiers ever collapse to the same
 * brightness in dark mode, it's obvious here.
 */
export const DarkModeCardWithOpenMenu: Story = {
  globals: darkModeGlobals,
  render: (args) => ({
    components: { DashboardWidgetActionMenu },
    setup: () => ({ args }),
    template: `
      <div style="max-width:420px;">
        <v-card flat border rounded="lg" class="pa-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-2">{{ args.widgetTitle }}</span>
            <DashboardWidgetActionMenu v-bind="args" />
          </div>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Card surface (L1) sits beneath the open menu (L3) — contrast between the two
            should stay clearly visible.
          </p>
        </v-card>
      </div>
    `,
  }),
  args: { widgetTitle: 'Revenue Over Time', currentSize: 'M' },
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Actions for Revenue Over Time"]')
    trigger?.click()
  },
}
