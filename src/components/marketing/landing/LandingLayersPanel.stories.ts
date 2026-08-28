import type { Meta, StoryObj } from '@storybook/vue3'
import LandingLayersPanel from './LandingLayersPanel.vue'
import { PALETTE, PAGE_BLOCKS, block } from './landingStoryFixtures'

const meta = {
  title: 'Product/Marketing/Landing Pages/LandingLayersPanel',
  component: LandingLayersPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`LandingLayersPanel\` is the landing editor's outline view: one row per block, showing the type
icon/label from the palette plus a content \`preview\` string derived per block type (text for
copy blocks, label for buttons/forms, alt for media, counts for lists/menus/social/icons,
\`"{n}px spacer"\` for spacers). Rows are click-to-select and drag-to-reorder, and each carries
move-up / move-down / duplicate / remove actions.

This panel is the **keyboard-accessible equivalent** of the canvas's drag interactions — the
canvas drag grip and insertion-point drop zones have no keyboard path, so the layers panel's
\`move\` actions are how reordering stays operable without a pointer.

**Use when:** alongside the canvas, as the structural view of the page.

**Don't use when:** editing block content — that's \`LandingBlockSettings\`.

### 🟢 Do's
- **Do** keep \`selectedId\` in sync with the canvas selection so both views agree.
- **Do** pass the same \`PALETTE\` the canvas uses, so labels and icons match.

### 🔴 Don'ts
- **Don't** drop the move-up/move-down actions in favour of drag alone — they're the accessible
  reorder path.

### A11y
- **Provides:** rows and actions are real buttons; \`move\` gives a pointer-free reorder path.
- **Consumer must:** apply the emitted \`reorder\`/\`move\` to the blocks array — the panel is
  presentational and holds only transient drag state.
        `,
      },
    },
  },
  argTypes: {
    blocks: { control: 'object', description: 'LandingPageBlock[] in page order.' },
    selectedId: { control: 'text', description: 'Id of the selected block, or null.' },
    palette: { control: 'object', description: 'PaletteItem[] — supplies each row\'s icon and type label.' },
    onSelect: { action: 'select', description: 'Emitted with the block id when a row is clicked.' },
    onDuplicate: { action: 'duplicate', description: 'Emitted with the block id.' },
    onRemove: { action: 'remove', description: 'Emitted with the block id.' },
    onMove: { action: 'move', description: 'Emitted with (id, dir) where dir is -1 (up) or 1 (down).' },
    onReorder: { action: 'reorder', description: 'Emitted with (fromIndex, toIndex) after a row drag.' },
  },
} satisfies Meta<typeof LandingLayersPanel>

export default meta
type Story = StoryObj<typeof meta>

const render: Story['render'] = (args) => ({
  components: { LandingLayersPanel },
  setup: () => ({ args }),
  template: '<div style="max-width: 300px"><LandingLayersPanel v-bind="args" /></div>',
})

/** A typical page outline with nothing selected. */
export const Default: Story = {
  args: { blocks: PAGE_BLOCKS, selectedId: null, palette: PALETTE },
  render,
}

/** A row selected — mirrors the canvas selection ring. */
export const WithSelection: Story = {
  args: { blocks: PAGE_BLOCKS, selectedId: PAGE_BLOCKS[2]!.id, palette: PALETTE },
  render,
}

/** An empty page — the panel renders no rows. */
export const NoBlocks: Story = {
  args: { blocks: [], selectedId: null, palette: PALETTE },
  render,
}

/**
 * Preview strings across block types: empty copy falls back to `(empty)`, counts pluralize, and
 * spacers report their height.
 */
export const PreviewStrings: Story = {
  args: {
    blocks: [
      block('paragraph', { text: '' }, 'lpb-empty'),
      block('list', { items: ['One'] }, 'lpb-list-1'),
      block('menu', { links: [{ label: 'Home', url: '#' }, { label: 'Shop', url: '#' }] }, 'lpb-menu-2'),
      block('spacer', { height: 48 }, 'lpb-spacer'),
      block('html', {}, 'lpb-html'),
    ],
    selectedId: null,
    palette: PALETTE,
  },
  render,
}
