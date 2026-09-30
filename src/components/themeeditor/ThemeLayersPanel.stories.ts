import type { Meta, StoryObj } from '@storybook/vue3'
import ThemeLayersPanel from './ThemeLayersPanel.vue'
import { seedTemplates } from '@/stores/themeEditorData'
import { grid } from '@/stories/storyTemplate'
import { railFrame } from '@/stories/decorators'

const home = seedTemplates().find((template) => template.type === 'home')!

const meta = {
  title: 'Product/Sales Channels/Theme editor/ThemeLayersPanel',
  component: ThemeLayersPanel,
  tags: ['autodocs'],
  parameters: {
    canvas: 'full',
    docs: {
      description: {
        component: `
### Overview
The theme builder's **Layers** panel (store builder re-skin): the template's sections as boxed
\`MpListRow\`s, each expanding to its blocks and a block's nested blocks (Trust Stats Bar → Stat: …),
with "Add section" above and an "Add block" menu under each open section. Rows drag to reorder by
their grip; the trash removes; selection is reported to the host, never held here.

**Use when:** a builder edits an ordered tree of sections and blocks.

**Don't use when:** the list is flat and navigational — that is \`MpSectionRail\`.

### A11y
- **Provides:** \`role="list"\` per level, \`aria-current\` on the selected row, labelled expand
  and remove controls that stay in the DOM (they reveal on hover/focus).
- **Consumer must:** confirm removals and keep keyboard reordering available elsewhere
  (drag is pointer-only, as in the current product).
        `,
      },
    },
  },
  args: {
    sections: home.sections,
    selectedSectionId: null,
    selectedBlockId: null,
  },
  argTypes: {
    onSelectSection: { table: { category: 'events' } },
    onSelectBlock: { table: { category: 'events' } },
    onAddSection: { table: { category: 'events' } },
    onAddBlock: { table: { category: 'events' } },
    onRemoveSection: { table: { category: 'events' } },
    onRemoveBlock: { table: { category: 'events' } },
    onReorderSection: { table: { category: 'events' } },
    onReorderBlock: { table: { category: 'events' } },
  },
  decorators: [railFrame('560px')],
} satisfies Meta<typeof ThemeLayersPanel>

export default meta
type Story = StoryObj<typeof meta>

/** The Lumos home template as crawled: five sections, nothing selected. */
export const Default: Story = {}

/** A selected section and a selected block. */
export const Variants: Story = {
  name: 'Variants (selection)',
  decorators: [],
  render: grid({ ThemeLayersPanel }, [
    { label: 'Section selected', args: { selectedSectionId: 'lumos-home-hero' } },
    { label: 'Block selected', args: { selectedSectionId: 'lumos-home-hero', selectedBlockId: 'lumos-home-hero-heading' } },
  ], { columns: 'repeat(2, var(--mp-component-editor-layersWidth))' }),
}

/** One width — the panel is a fixed rail (`component.editor.layersWidth`). */
export const Sizes: Story = {
  name: 'Sizes (fixed rail)',
  decorators: [],
  render: grid({ ThemeLayersPanel }, [{ label: 'layersWidth 260', args: {} }], { columns: 'var(--mp-component-editor-layersWidth)' }),
}

/** An empty template. */
export const States: Story = {
  decorators: [],
  render: grid({ ThemeLayersPanel }, [
    { label: 'Populated', args: {} },
    { label: 'Empty template', args: { sections: [] } },
  ], { columns: 'repeat(2, var(--mp-component-editor-layersWidth))' }),
}
