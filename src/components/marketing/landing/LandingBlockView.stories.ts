import type { Meta, StoryObj } from '@storybook/vue3'
import LandingBlockView from './LandingBlockView.vue'
import { PALETTE, PAGE_BLOCKS, block } from './landingStoryFixtures'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Marketing/LandingBlockView',
  component: LandingBlockView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`LandingBlockView\` renders a single \`LandingPageBlock\` on the landing page canvas. It has two
faces: a plain **preview** (\`editable: false\`) used by the published/preview renderer, and the
**editor** face (\`editable: true\`) which layers on a type chip, hover controls (duplicate,
remove), a drag grip that seeds \`application/x-lp-reorder-id\` for reordering, and a selection
ring. \`showStructure\` adds the structural outline used by the editor's "show structure" toggle.
Heading level tracks \`block.titleSize\` (S→h4, M→h3, L→h2, XL→h1), so the rendered page keeps a
sane document outline.

**Use when:** rendering blocks inside the landing page canvas, in either mode.

**Don't use when:** rendering a block *summary* — the layers panel does that.

### 🟢 Do's
- **Do** pass \`palette\` in editable mode so the type chip shows the human label and icon rather
  than the raw type string.
- **Do** choose \`titleSize\` for semantic level, not visual size alone.

### 🔴 Don'ts
- **Don't** emit \`select\` yourself — the root click handler already does it when \`editable\`.

### A11y
- **Provides:** heading tags follow \`titleSize\`, and images render their \`alt\`.
- **Consumer must:** the editor controls appear on hover/selection; keep the layers panel as the
  keyboard-reachable equivalent for duplicate/remove/reorder.

> **Story note:** drag-to-reorder can't be exercised statically, so the grip is shown but not
> simulated. Use the Selected and ShowStructure stories to inspect the editor chrome.
        `,
      },
    },
  },
  argTypes: {
    block: { control: 'object', description: 'The LandingPageBlock to render.' },
    editable: { control: 'boolean', description: 'Editor face — adds type chip, hover controls, drag grip, selection ring.' },
    selected: { control: 'boolean', description: 'Draws the selection ring (editor face only).' },
    showStructure: { control: 'boolean', description: 'Adds the structural outline used by the editor toggle.' },
    palette: { control: 'object', description: 'PaletteItem[] — supplies the type chip label/icon in editor mode.' },
    onSelect: { action: 'select', description: 'Emitted on click when editable.' },
    onDuplicate: { action: 'duplicate', description: 'Emitted from the duplicate control.' },
    onRemove: { action: 'remove', description: 'Emitted from the remove control.' },
  },
} satisfies Meta<typeof LandingBlockView>

export default meta
type Story = StoryObj<typeof meta>

const wrap = (inner: string) => ({
  components: { LandingBlockView },
  template: `<div style="max-width: 720px; margin: 0 auto">${inner}</div>`,
})

/** Preview face — how a block renders on the published page. */
export const Default: Story = {
  args: { block: block('title', { text: 'Spring into savings', titleSize: 'XL', align: 'center' }) },
  render: (args) => ({ ...wrap('<LandingBlockView v-bind="args" />'), setup: () => ({ args }) }),
}

/** Editor face — type chip and hover controls, not yet selected. */
export const Editable: Story = {
  args: { ...Default.args, editable: true, palette: PALETTE },
  render: Default.render,
}

/** Selected in the editor — the selection ring is drawn. */
export const Selected: Story = {
  args: { ...Default.args, editable: true, selected: true, palette: PALETTE },
  render: Default.render,
}

/** The editor's "show structure" toggle, which outlines each block's bounds. */
export const ShowStructure: Story = {
  args: { ...Default.args, editable: true, showStructure: true, palette: PALETTE },
  render: Default.render,
}

/** Every block type in the fixture page, rendered in preview mode. */
export const BlockTypeMatrix: Story = {
  args: { block: PAGE_BLOCKS[0]! },
  render: () => ({
    components: { LandingBlockView },
    setup: () => ({ blocks: PAGE_BLOCKS, palette: PALETTE }),
    template: `
      <div style="max-width: 720px; margin: 0 auto">
        <LandingBlockView v-for="b in blocks" :key="b.id" :block="b" :palette="palette" />
      </div>
    `,
  }),
}

/** Heading levels: titleSize S→h4, M→h3, L→h2, XL→h1. */
export const TitleSizes: Story = {
  args: { block: block('title', { text: 'Heading' }) },
  render: () => ({
    components: { LandingBlockView },
    setup: () => ({
      blocks: (['S', 'M', 'L', 'XL'] as const).map((size, i) =>
        block('title', { text: `Title size ${size}`, titleSize: size }, `lpb-story-title-${i}`)),
    }),
    template: `
      <div style="max-width: 720px; margin: 0 auto">
        <LandingBlockView v-for="b in blocks" :key="b.id" :block="b" />
      </div>
    `,
  }),
}

export const DarkMode: Story = {
  ...BlockTypeMatrix,
  globals: darkModeGlobals,
}
