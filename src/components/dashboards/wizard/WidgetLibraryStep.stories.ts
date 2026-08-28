import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import WidgetLibraryStep from './WidgetLibraryStep.vue'

const meta = {
  title: 'Product/Dashboards/Wizard/WidgetLibraryStep',
  component: WidgetLibraryStep,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Step 1 of the widget wizard: a searchable, category-filterable catalog of the available widgets
(from \`WIDGET_LIBRARY\`). Search and category chips are internal state — type in the search field to
see the empty state.

### Controls
This step takes **no props** — the Controls panel is empty by design. It communicates entirely
through two emits: \`select\` (a \`DashboardWidgetLibraryEntry\`) and \`createWithAi\` (no payload).
        `,
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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a filterable gallery of widget types. Its variants are the category filters. */
export const Variants: Story = {
  render: (args) => ({
    components: { WidgetLibraryStep },
    setup: () => ({ args }),
    template: `<WidgetLibraryStep v-bind="args" />`,
  }),
}

/** There is no `size` prop — the gallery fills the wizard drawer's body. Its tiles are
 *  `MpOptionCard`s, so their inset is `component.card.padding` like every other card. */
export const Sizes: Story = {
  render: (args) => ({
    components: { WidgetLibraryStep },
    setup: () => ({ args }),
    template: `<WidgetLibraryStep v-bind="args" />`,
  }),
}

/** Unfiltered, filtered to one category, and a tile selected. */
export const States: Story = {
  render: (args) => ({
    components: { WidgetLibraryStep },
    setup: () => ({ args }),
    template: `<WidgetLibraryStep v-bind="args" />`,
  }),
}
