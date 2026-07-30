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

/** Default "All" state — widgets group under muted section headers (Commerce/Marketing/
 *  Service/Retail/Merchandising), the UX-002 fix that replaced a flat, icon-only 28-item list. */
export const Default: Story = {}

/** Clicking a category chip narrows to a flat, single-category list (headers only appear
 *  when "All" is active — a single category is already unambiguous). */
export const FilteredByCategory: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const chip = canvasElement.querySelector('.widget-library__category:not(:first-child)') as HTMLElement
    chip?.click()
  },
}
