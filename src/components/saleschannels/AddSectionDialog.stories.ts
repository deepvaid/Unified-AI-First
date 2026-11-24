import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import AddSectionDialog from './AddSectionDialog.vue'
import StorefrontPreview from './StorefrontPreview.vue'
import { sectionsFor, type ThemeSectionDef } from '@/stores/themeBuilderData'
import { overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Product/Sales Channels/AddSectionDialog',
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
      // Every story opens the dialog on mount.
      ...overlayDocs().docs,
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

/** The dialog open on mount, with the button that brings it back once it has been closed. */
function openDialog(isKindDisabled: (def: ThemeSectionDef) => boolean): Story['render'] {
  return () => ({
    components: { AddSectionDialog },
    setup() {
      const open = ref(true)
      return { open, isKindDisabled }
    },
    template: `
      <div>
        <v-btn variant="outlined" prepend-icon="plus" @click="open = true">Add section</v-btn>
        <AddSectionDialog v-model="open" :is-kind-disabled="isKindDisabled" />
      </div>
    `,
  })
}

/** The picker shown open, nothing disabled — browse categories or search, and pick a variant layout. */
export const Default: Story = {
  render: openDialog(() => false),
}

/**
 * `isKindDisabled` returns true for the unique `header` and `footer` kinds, so both
 * render greyed out with an "Already added" hint and can't be selected.
 */
export const WithDisabledKinds: Story = {
  render: openDialog((def) => def.kind === 'header' || def.kind === 'footer'),
}

/**
 * **In context.** The dialog open over the store editor it adds to: the "Add section" button
 * in the editor's bar reopens it, above the storefront preview.
 */
export const InContextStoreEditor: Story = {
  render: () => ({
    components: { AddSectionDialog, StorefrontPreview },
    setup() {
      const open = ref(true)
      return { open, isKindDisabled: () => false }
    },
    template: `
      <div>
        <div class="d-flex align-center ga-3 pa-4" style="border-bottom: 1px solid var(--border-subtle)">
          <div class="text-body-2 font-weight-bold">Northwind Supply · Theme</div>
          <v-spacer />
          <v-btn variant="outlined" prepend-icon="plus" @click="open = true">Add section</v-btn>
        </div>
        <div class="pa-4" style="background: var(--surface-canvas)">
          <StorefrontPreview device="desktop" />
        </div>
        <AddSectionDialog v-model="open" :is-kind-disabled="isKindDisabled" />
      </div>
    `,
  }),
}

/**
 * The picker a theme on the sections drawing gets for its home page, with a kind opened by
 * its play function: the kinds only that drawing draws (the icon row, the logo strip) and
 * the layouts only it draws (the collection grid's carousel, the banner's words on the left).
 */
function sectionsDrawingPicker(kindTitle: string): Story {
  return {
    render: () => ({
      components: { AddSectionDialog },
      setup() {
        const open = ref(true)
        return { open, isKindDisabled: () => false, sections: sectionsFor('sections', { parts: false, sizes: false, specs: true }, 'home') }
      },
      template: `
        <div>
          <v-btn variant="outlined" prepend-icon="plus" @click="open = true">Add section</v-btn>
          <AddSectionDialog v-model="open" :sections="sections" :is-kind-disabled="isKindDisabled" />
        </div>
      `,
    }),
    play: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const row = [...document.querySelectorAll<HTMLElement>('.asd-item')].find((el) => el.textContent?.includes(kindTitle))
      row?.click()
    },
  }
}

/** The collection grid's layouts on the sections drawing: 2-up to 4-up, and the looping carousel with dots. */
export const SectionsDrawingCarousel: Story = sectionsDrawingPicker('Collection grid')

/** The logo strip (sections drawing, home page): on the page or on a tinted band. */
export const SectionsDrawingLogoStrip: Story = sectionsDrawingPicker('Logo strip')
