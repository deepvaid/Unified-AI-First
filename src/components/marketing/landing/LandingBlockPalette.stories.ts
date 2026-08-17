import type { Meta, StoryObj } from '@storybook/vue3'
import LandingBlockPalette from './LandingBlockPalette.vue'
import { PALETTE } from './landingStoryFixtures'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Marketing/LandingBlockPalette',
  component: LandingBlockPalette,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`LandingBlockPalette\` is the block picker in the landing page editor's left rail — a grid of
icon + label tiles, one per \`PaletteItem\`. Each tile is both a **click** target (emits \`add\`)
and an HTML5 **drag source**: \`dragstart\` writes the block type to the
\`application/x-lp-block-type\` dataTransfer key, which \`LandingInsertionPoint\` reads on drop.
It exports the \`PaletteItem\` type consumed by every other landing component.

**Use when:** offering block insertion in the editor rail, or inside an insertion point's menu
(\`LandingInsertionPoint\` embeds this same component).

**Don't use when:** you need a single "add block" action — use a button; the palette is a grid.

### 🟢 Do's
- **Do** pass the editor's canonical \`PALETTE\` array so tile labels/icons match the layers panel
  and block chips, which look up their metadata from the same list.

### 🔴 Don'ts
- **Don't** handle \`dragstart\` yourself — the tile already sets the dataTransfer payload.

### A11y
- **Provides:** every tile is a real \`<button>\` with \`aria-label="Add {label} block"\`, so the
  palette is fully keyboard-operable even though drag-and-drop is not.
- **Consumer must:** keep click-to-add working as the accessible equivalent of dragging — the
  drag path alone is not keyboard reachable.

> **Story note:** HTML5 drag-and-drop can't be meaningfully exercised in a static story, so the
> drag path is documented rather than simulated. Click a tile to see the \`add\` action fire.
        `,
      },
    },
  },
  argTypes: {
    palette: { control: 'object', description: 'PaletteItem[] — the block types offered, each with a label and Lucide icon name.' },
    onAdd: { action: 'add', description: 'Emitted with the block type when a tile is clicked.' },
  },
} satisfies Meta<typeof LandingBlockPalette>

export default meta
type Story = StoryObj<typeof meta>

/** The editor's full 14-type palette. */
export const Default: Story = {
  args: { palette: PALETTE },
  render: (args) => ({
    components: { LandingBlockPalette },
    setup: () => ({ args }),
    template: '<div style="max-width: 280px"><LandingBlockPalette v-bind="args" /></div>',
  }),
}

/** A trimmed palette — the grid reflows to whatever it's given. */
export const Reduced: Story = {
  args: { palette: PALETTE.slice(0, 5) },
  render: Default.render,
}

export const DarkMode: Story = {
  ...Default,
  globals: darkModeGlobals,
}
