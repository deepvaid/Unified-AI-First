import type { Meta, StoryObj } from '@storybook/vue3'
import ThemeCodeExplorer from './ThemeCodeExplorer.vue'
import { buildLumosFiles } from '@/stores/themeEditorLumosFiles'
import { grid } from '@/stories/storyTemplate'
import { railFrame } from '@/stories/decorators'

const files = buildLumosFiles()

const meta = {
  title: 'Product/Sales Channels/Theme editor/ThemeCodeExplorer',
  component: ThemeCodeExplorer,
  tags: ['autodocs'],
  parameters: {
    canvas: 'full',
    docs: {
      description: {
        component: `
### Overview
The theme code editor's side panel (store builder re-skin, \`docs/rebuild/theme-editor-reskin\`):
the VS Code-style **Explorer** — "Open editors", then the theme's folder tree with a per-file
Rename / Delete menu, an inline "New file" box and "Collapse all" — and the **Search** panel.
Every row is \`MpListRow\` at the compact tier; dirty files carry a dot on the row and on their
folder, as the UAT explorer does.

**Use when:** hosting \`MpCodeEditor\` over a file set that has folders.

**Don't use when:** a flat list of documents will do — that is a plain list of \`MpListRow\`s.

### A11y
- **Provides:** \`role="tree"\` / \`treeitem\` with \`aria-expanded\` on folders, \`aria-selected\`
  on the active file, labelled per-row menus, hover-revealed controls that stay in the DOM.
- **Consumer must:** own the open tabs and the active path, and confirm deletes.
        `,
      },
    },
  },
  args: {
    files,
    themeName: 'Lumos',
    dirtyPaths: ['layouts/default.html'],
    openPaths: ['templates/404/default.html', 'layouts/default.html'],
    activePath: 'templates/404/default.html',
    mode: 'explorer',
  },
  argTypes: {
    mode: { control: 'radio', options: ['explorer', 'search'] },
    onOpen: { table: { category: 'events' } },
    onClose: { table: { category: 'events' } },
    onCreate: { table: { category: 'events' } },
    onRename: { table: { category: 'events' } },
    onRemove: { table: { category: 'events' } },
  },
  decorators: [railFrame('600px')],
} satisfies Meta<typeof ThemeCodeExplorer>

export default meta
type Story = StoryObj<typeof meta>

/** The explorer as the code editor opens: templates expanded, 404/default.html active, one dirty layout. */
export const Default: Story = {}

/** Explorer and Search are the two panels the tool bar switches between. */
export const Variants: Story = {
  name: 'Variants (explorer · search)',
  decorators: [],
  render: grid({ ThemeCodeExplorer }, [
    { label: 'Explorer', args: { mode: 'explorer' } },
    { label: 'Search', args: { mode: 'search' } },
  ], { columns: 'repeat(2, var(--mp-component-editor-explorerWidth))' }),
}

/** One width — the panel is a fixed rail (`component.editor.explorerWidth`). */
export const Sizes: Story = {
  name: 'Sizes (fixed rail)',
  decorators: [],
  render: grid({ ThemeCodeExplorer }, [{ label: 'explorerWidth 300', args: {} }], { columns: 'var(--mp-component-editor-explorerWidth)' }),
}

/** Nothing open, nothing dirty — and the busy state with several dirty files. */
export const States: Story = {
  decorators: [],
  render: grid({ ThemeCodeExplorer }, [
    { label: 'Clean · no open files', args: { openPaths: [], activePath: null, dirtyPaths: [] } },
    { label: 'Several unsaved files', args: { dirtyPaths: ['layouts/default.html', 'templates/home/default.json', 'sections/hero.html'], activePath: 'sections/hero.html', openPaths: ['sections/hero.html'] } },
  ], { columns: 'repeat(2, var(--mp-component-editor-explorerWidth))' }),
}
