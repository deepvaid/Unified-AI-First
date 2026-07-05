import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import WidgetLibraryStep from './WidgetLibraryStep.vue'

const meta = {
  title: 'Dashboards/Wizard/WidgetLibraryStep',
  component: WidgetLibraryStep,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Step 1 of the widget wizard: searchable, category-filterable catalog of available widgets (from the widget library). Emits `select` with the chosen library entry. Search and category chips are internal state — type in the search field to see the empty state.',
      },
    },
  },
  render: () => ({
    components: { WidgetLibraryStep },
    setup() {
      const selected = ref('')
      return { selected }
    },
    template: `
      <div style="max-width:560px;">
        <div v-if="selected" class="text-body-2 text-medium-emphasis mb-3">Selected: {{ selected }}</div>
        <WidgetLibraryStep @select="selected = $event.title" />
      </div>
    `,
  }),
} satisfies Meta<typeof WidgetLibraryStep>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
