import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import AddSectionDialog from './AddSectionDialog.vue'
import StorefrontPreview from './StorefrontPreview.vue'
import type { ThemeSectionDef } from '@/stores/themeBuilderData'

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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * One structure — a two-pane picker: a searchable, grouped catalog on the left and the
 * selected section's layout variants on the right. What varies is which pane is populated.
 */
export const Variants: Story = {
  render: (args) => ({
    components: { AddSectionDialog },
    setup: () => ({ args }),
    template: `<AddSectionDialog v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — this is `MpDialog`'s `md` (640px), wide enough for the split
 * without letting the catalog column stretch.
 *
 * Phase 4 (P4-6) is the finding this dialog was named in: it carried **five** different
 * micro-insets of its own (`12×14`, `8×8`, `6×8`, `8`, and 6px gaps). Every repeating row is
 * an `MpListRow` now, so two insets are left — the row inset (`component.listItem.*`) and the
 * variant thumbnail's compact card inset. The schematic mini-mocks below the thumbnails are
 * illustration geometry and stay off the scale, marked as such in the file.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { AddSectionDialog },
    setup: () => ({ args }),
    template: `<AddSectionDialog v-bind="args" />`,
  }),
}

/**
 * Row states in the catalog: resting, selected (accent wash), and disabled ("Already added" —
 * a section a theme allows only once). Plus the right pane's empty state before anything is
 * picked, and the searching state where the grouped tree flattens to a filtered list.
 */
export const States: Story = {
  render: (args) => ({
    components: { AddSectionDialog },
    setup: () => ({ args }),
    template: `<AddSectionDialog v-bind="args" />`,
  }),
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The dialog opening from the store editor's "Add section" affordance, over
 * the storefront preview it will add to.
 */
export const InContextStoreEditor: Story = {
  render: (args) => ({
    components: { AddSectionDialog, StorefrontPreview },
    setup: () => ({ args }),
    template: `
      <div>
        <div class="d-flex align-center ga-3 pa-4" style="border-bottom: 1px solid var(--border-subtle)">
          <div class="text-body-2 font-weight-bold">Northwind Supply · Theme</div>
          <v-spacer />
          <v-btn variant="outlined" class="text-none" prepend-icon="plus">Add section</v-btn>
        </div>
        <div class="pa-4" style="background: var(--surface-canvas)">
          <StorefrontPreview device="desktop" />
        </div>
        <AddSectionDialog v-bind="args" />
      </div>
    `,
  }),
}
