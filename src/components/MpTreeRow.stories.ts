import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MpIconButton from './MpIconButton.vue'
import MpTreeRow from './MpTreeRow.vue'

const meta = {
  title: 'Molecules/MpTreeRow',
  component: MpTreeRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpTreeRow\` is the one tree row — builder layers, file explorers, nested settings lists. It
sits on \`component.tree.*\`: a 32px row (the sm control stop; trees are dense persistent
chrome, the way menus are dense transient chrome), one \`indent\` step per level with a hairline
guide through the parent's disclosure toggle, and \`MpIconButton size="sm"\` actions revealed on
hover, keyboard focus and selection.

The structural point: **the row is not a button.** A clickable row holding other buttons nests
interactive content (invalid HTML, garbled accessible names). The label is the one main
\`<button>\`, stretched over the row with a pseudo-element so the whole row still clicks, and the
toggle, meta and actions sit above it as siblings.

**Use when:** items nest (sections → blocks, folders → files) or a panel needs the same row as
one that does (a flat list beside a tree).

**Don't use when:** the list is flat navigation (use \`MpSectionRail\`) or content with two-line
rows (use \`MpListRow\`).

### Usage
\`\`\`html
<div role="list" aria-label="Sections">
  <div role="listitem">
    <MpTreeRow label="Hero Banner" icon="image" expandable :expanded="open" :selected="sel"
               @select="select" @toggle="open = !open">
      <template #actions>
        <MpIconButton size="sm" icon="trash-2" ariaLabel="Remove Hero Banner" @click.stop="remove" />
      </template>
    </MpTreeRow>
    <div v-if="open" role="list" aria-label="Hero Banner blocks">
      <div role="listitem"><MpTreeRow label="Heading" icon="heading" :depth="1" /></div>
      <MpTreeRow variant="action" icon="plus" label="Add block" :depth="1" @select="add" />
    </div>
  </div>
</div>
\`\`\`

### 🟢 Do's
- **Do** wrap rows as list items and nest the child list inside the parent's item.
- **Do** stack rows without gaps — the guides read as one continuous line.
- **Do** use \`variant="action"\` for the "Add …" command that closes a group.

### 🔴 Don'ts
- **Don't** put a clickable row inside another button, or \`MpListRow clickable\` around actions.
- **Don't** announce it as an ARIA \`tree\` unless the host implements the arrow-key contract.

### A11y
- **Provides:** a real \`<button>\` label with \`aria-current\` on the selection; a disclosure
  toggle with \`aria-expanded\` and an "Expand/Collapse {label}" name; a full-row focus ring;
  actions that appear for keyboard focus, not only hover; \`title\` for truncated labels.
- **Consumer must:** own selection and expansion, give each action a specific label, and offer
  a keyboard path for anything the row does by drag.
        `,
      },
    },
  },
  args: {
    label: 'Hero Banner',
    icon: 'image',
    depth: 0,
    expandable: true,
    expanded: true,
    selected: false,
    variant: 'item',
    emphasis: 'default',
  },
  argTypes: {
    variant: { control: 'radio', options: ['item', 'action'] },
    emphasis: { control: 'radio', options: ['default', 'prominent'] },
    depth: { control: { type: 'number', min: 0, max: 4 } },
    onSelect: { table: { category: 'events' } },
    onToggle: { table: { category: 'events' } },
  },
  decorators: [() => ({ template: '<div style="max-width: var(--mp-component-editor-layersWidth);"><story /></div>' })],
} satisfies Meta<typeof MpTreeRow>

export default meta
type Story = StoryObj<typeof meta>

/** One expandable row with a hover action. */
export const Default: Story = {
  render: (args) => ({
    components: { MpTreeRow, MpIconButton },
    setup: () => ({ args }),
    template: `
      <MpTreeRow v-bind="args">
        <template #actions>
          <MpIconButton size="sm" icon="trash-2" :ariaLabel="'Remove ' + args.label" />
        </template>
      </MpTreeRow>
    `,
  }),
}

/** The Layers tree as the theme builder draws it: sections, blocks, a nested block, action rows. */
export const Variants: Story = {
  name: 'Variants (item · action, in a tree)',
  render: () => ({
    components: { MpTreeRow, MpIconButton },
    setup() {
      const open = ref(new Set(['hero', 'stats']))
      const selected = ref('heading')
      const toggle = (id: string) => {
        const next = new Set(open.value)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        open.value = next
      }
      return { open, selected, toggle }
    },
    template: `
      <div role="list" aria-label="Sections">
        <div role="listitem">
          <MpTreeRow label="Hero Banner" icon="image" emphasis="prominent" expandable :expanded="open.has('hero')" :selected="selected === 'hero'" @select="selected = 'hero'" @toggle="toggle('hero')">
            <template #actions><MpIconButton size="sm" icon="trash-2" ariaLabel="Remove Hero Banner" /></template>
          </MpTreeRow>
          <div v-if="open.has('hero')" role="list" aria-label="Hero Banner blocks">
            <div role="listitem"><MpTreeRow label="Heading Tag" icon="tag" :depth="1" :selected="selected === 'tag'" @select="selected = 'tag'" /></div>
            <div role="listitem">
              <MpTreeRow label="Heading" icon="heading" :depth="1" :selected="selected === 'heading'" @select="selected = 'heading'">
                <template #actions>
                  <MpIconButton size="sm" icon="pencil" ariaLabel="Edit Heading" />
                  <MpIconButton size="sm" icon="trash-2" ariaLabel="Remove Heading" />
                </template>
              </MpTreeRow>
            </div>
            <div role="listitem">
              <MpTreeRow label="Trust Stats Bar" icon="bar-chart-3" :depth="1" expandable :expanded="open.has('stats')" :selected="selected === 'stats'" @select="selected = 'stats'" @toggle="toggle('stats')" />
              <div v-if="open.has('stats')" role="list" aria-label="Trust Stats Bar blocks">
                <div role="listitem"><MpTreeRow label="Stat: Happy Homes" icon="hash" :depth="2" /></div>
                <div role="listitem"><MpTreeRow label="Stat: Customer Rating" icon="hash" :depth="2" /></div>
                <MpTreeRow variant="action" icon="plus" label="Add block" :depth="2" />
              </div>
            </div>
            <MpTreeRow variant="action" icon="plus" label="Add block" :depth="1" />
          </div>
        </div>
        <div role="listitem"><MpTreeRow label="Categories" icon="layout-dashboard" emphasis="prominent" expandable /></div>
      </div>
    `,
  }),
}

/** One geometry: every row is `component.tree.rowHeight` (32); depth only changes the indent. */
export const Sizes: Story = {
  name: 'Sizes (one row height, three depths)',
  render: () => ({
    components: { MpTreeRow },
    template: `
      <div>
        <MpTreeRow label="Depth 0 — templates" icon="folder-open" expandable expanded />
        <MpTreeRow label="Depth 1 — home/default.json" icon="braces" :depth="1" />
        <MpTreeRow label="Depth 2 — nested block" icon="hash" :depth="2" />
      </div>
    `,
  }),
}

/** Rest, selected, with a meta mark, and a long label truncating (full text on hover via title). */
export const States: Story = {
  render: () => ({
    components: { MpTreeRow, MpIconButton },
    template: `
      <div>
        <MpTreeRow label="Rest" icon="file-code" />
        <MpTreeRow label="Selected — actions stay visible" icon="file-code" selected>
          <template #actions><MpIconButton size="sm" icon="trash-2" ariaLabel="Remove" /></template>
        </MpTreeRow>
        <MpTreeRow label="Unsaved changes" icon="file-code">
          <template #meta><span role="img" aria-label="Unsaved changes" style="display:inline-block;width:var(--mp-space-8);height:var(--mp-space-8);border-radius:var(--r-pill);background:var(--warn);" /></template>
        </MpTreeRow>
        <MpTreeRow label="A very long section name that has to truncate in a narrow panel" icon="layout-template" />
        <MpTreeRow variant="action" icon="plus" label="Add block" />
      </div>
    `,
  }),
}
