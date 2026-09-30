import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import ThemeAddSectionDialog from './ThemeAddSectionDialog.vue'

const meta = {
  title: 'Product/Sales Channels/Theme editor/ThemeAddSectionDialog',
  component: ThemeAddSectionDialog,
  tags: ['autodocs'],
  parameters: {
    canvas: 'full',
    docs: {
      description: {
        component: `
### Overview
The theme builder's **Add section** picker (store builder re-skin), laid out as the current admin
lays it out: left, the Da Vinci generator tile (locked on this plan, with its "Upgrade to use"
tooltip), a search field, the category filter ("All (6)") and the accordion groups of section
types; right, the chosen type's layout variants as \`MpOptionCard\`s. Types without variants add on
click. Composes \`MpDialog\` (\`size="lg"\`, \`flush\`); every row is \`MpListRow\`.

**Use when:** the builder adds a section to the active template.

### A11y
- **Provides:** the dialog's focus trap and Esc (from \`MpDialog\`), \`role="radiogroup"\` for the
  category filter, \`aria-expanded\` group headers.
- **Consumer must:** own the open state and add the returned definition to the template.
        `,
      },
    },
  },
  argTypes: {
    modelValue: { control: false },
    onAdd: { table: { category: 'events' }, description: 'The chosen section definition and, for variant-bearing types, the variant id.' },
  },
} satisfies Meta<typeof ThemeAddSectionDialog>

export default meta
type Story = StoryObj<typeof meta>

/** The picker open — browse the groups, filter by category, or search. */
export const Default: Story = {
  render: () => ({
    components: { ThemeAddSectionDialog },
    setup() {
      const open = ref(true)
      const added = ref('')
      return { open, added }
    },
    template: `
      <div style="min-height: 560px;">
        <v-btn variant="outlined" prepend-icon="plus" class="text-none" @click="open = true">Add section</v-btn>
        <p v-if="added" class="text-body-2 mt-4">Added: {{ added }}</p>
        <ThemeAddSectionDialog v-model="open" @add="(def, variant) => added = variant ? def.title + ' · ' + variant : def.title" />
      </div>
    `,
  }),
}
