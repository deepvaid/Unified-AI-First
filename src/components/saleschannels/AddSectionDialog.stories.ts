import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import AddSectionDialog from './AddSectionDialog.vue'
import type { ThemeSectionDef } from '@/stores/themeBuilderData'

const meta = {
  title: 'Sales Channels/AddSectionDialog',
  component: AddSectionDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The store theme builder\'s Add Section picker. Left pane: a Generate-with-AI row, a search '
          + 'box, and the section catalog grouped into collapsible categories (Layout, Media, Featured, '
          + 'Content, Commerce). Clicking a no-variant kind emits `add` and closes; a variant-bearing kind '
          + '(hero, featured-products, collection-grid, image-banner, testimonials) reveals layout cards in '
          + 'the right pane, and picking one emits `addVariant`. `isKindDisabled` greys out unique kinds '
          + 'already present on the active template. The parent (StoreThemeBuilder) owns the open state.',
      },
    },
  },
  argTypes: {
    modelValue: { control: false, description: 'Dialog open state (v-model), owned by the parent.' },
    isKindDisabled: { control: false, description: 'Predicate returning true when a kind is already present and cannot be re-added.' },
    onAdd: { table: { category: 'events' }, description: 'Emitted with the section def when a no-variant kind is clicked, then the dialog closes.' },
    onAddVariant: { table: { category: 'events' }, description: 'Emitted with the section def and chosen variant id when a variant card is picked.' },
    onGenerate: { table: { category: 'events' }, description: 'Emitted when the Generate-with-AI row is clicked; the parent opens the Da Vinci generator.' },
  },
} satisfies Meta<typeof AddSectionDialog>

export default meta
type Story = StoryObj<typeof meta>

/** The picker shown open, nothing disabled — browse categories or search, and pick a variant layout. */
export const Default: Story = {
  render: () => ({
    components: { AddSectionDialog },
    setup() {
      const open = ref(true)
      const isKindDisabled = () => false
      return { open, isKindDisabled }
    },
    template: `
      <div style="min-height:520px;">
        <AddSectionDialog
          v-model="open"
          :is-kind-disabled="isKindDisabled"
          @add="() => {}"
          @add-variant="() => {}"
          @generate="() => {}"
        />
      </div>
    `,
  }),
}

/**
 * `isKindDisabled` returns true for the unique `header` and `footer` kinds, so both
 * render greyed out with an "Already added" hint and can't be selected.
 */
export const WithDisabledKinds: Story = {
  render: () => ({
    components: { AddSectionDialog },
    setup() {
      const open = ref(true)
      const isKindDisabled = (def: ThemeSectionDef) => def.kind === 'header' || def.kind === 'footer'
      return { open, isKindDisabled }
    },
    template: `
      <div style="min-height:520px;">
        <AddSectionDialog
          v-model="open"
          :is-kind-disabled="isKindDisabled"
          @add="() => {}"
          @add-variant="() => {}"
          @generate="() => {}"
        />
      </div>
    `,
  }),
}
