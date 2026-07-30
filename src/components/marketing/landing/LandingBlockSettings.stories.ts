import type { Meta, StoryObj } from '@storybook/vue3'
import LandingBlockSettings from './LandingBlockSettings.vue'
import { defaultLandingBlock } from '@/stores/useLandingPages'
import type { LandingPageBlock } from '@/stores/useLandingPages'
import { darkModeGlobals } from '@/stories/storybookTheme'

// `title` is the only block type whose settings branch includes a color-override
// control — the inline swatch + v-menu + v-color-picker this story exists to document
// (docs/overlay-audit/01-overlay-component-audit.md §7.10). `defaultLandingBlock` keeps
// every other field on the flat block model populated the same way the real editor does.
function titleBlock(colorOverride = ''): LandingPageBlock {
  return {
    ...defaultLandingBlock('title'),
    id: 'lpb-story-title',
    text: 'Spring into savings',
    colorOverride,
  }
}

const meta = {
  title: 'Marketing/LandingBlockSettings',
  component: LandingBlockSettings,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`LandingBlockSettings\` is the right-hand settings panel in the landing page editor
(\`LandingPageEditor.vue\`). It renders exactly one \`v-if\` branch keyed on \`block.type\`
(title, paragraph/text, button, image/video, list, form, social, icons, menu, html, spacer,
divider) — each with its own type-specific fields — plus a shared alignment control for
text-ish/interactive types, and a "Delete block" action at the bottom. It holds no internal
state: every field is a \`v-model\` straight against the \`block\` prop, matching this project's
flat-block convention (\`useLandingPages\`) where every field exists on every block but only the
relevant ones are surfaced per type. The \`title\` branch is the only one with a color override:
an inline swatch button opens a \`v-menu\` containing a hex-only \`v-color-picker\` — one of several
ad hoc color pickers (ChatbotBuilder, FormBuilder, LandingPageStylePanel) pending a shared
\`MpColorPicker\` treatment per the overlay audit.

**Use when:** rendering the settings panel for whichever \`LandingPageBlock\` is currently
selected in the landing page editor.

**Don't use when:** showing a read-only summary of a block's config (that's the block renderer /
palette preview), or editing more than one block at a time — there's no bulk-edit mode.

### Usage
\`\`\`html
<template v-if="selected">
  <LandingBlockSettings :block="selected" @remove="removeBlock" />
</template>
<LandingPageStylePanel v-else :style="pageStyle" @update="updatePageStyle" />
\`\`\`

### 🟢 Do's
- **Do** pass the same reactive block instance from the page's \`blocks\` array — the panel edits
  fields via direct \`v-model\` mutation, not emitted update events.
- **Do** build fixtures with \`defaultLandingBlock\`/\`cloneLandingBlock\` from \`useLandingPages\` so
  every field the template reads unconditionally is actually defined.
- **Do** rely on the swatch's own "Default color" label and "Reset" affordance to communicate an
  unset override, rather than pre-filling a "real" hex as the default.

### 🔴 Don'ts
- **Don't** expect an \`update\`/\`change\` event — the only emit is \`remove\`; every other edit
  mutates the passed-in \`block\` object directly.
- **Don't** hand-roll another inline swatch + \`v-menu\` + \`v-color-picker\` elsewhere — this is one
  of a few ad hoc instances awaiting the shared \`MpColorPicker\` pattern; reuse this one's markup
  if a new color override is needed on another block type.

### A11y
- **Provides:** the color swatch trigger carries \`aria-label="Text color override"\`; Vuetify's
  \`v-menu\` closes on Escape or outside click and returns focus to the trigger; alignment and
  style toggles use \`v-btn-toggle\` with icon buttons that carry their own \`aria-label\`s
  (Align left/center/right); per-row remove buttons in the list/menu branches are icon-only
  \`v-btn\`s with \`aria-label="Remove item"\` / \`"Remove link"\`.
- **Consumer must:** pass a fully-populated \`block\` (via \`defaultLandingBlock\`/\`cloneLandingBlock\`,
  never a partial object) — fields are read unconditionally per \`block.type\`, so a missing field
  renders blank instead of falling back gracefully.
- **Gaps:** the \`v-color-picker\`'s internal hue/alpha controls rely on Vuetify's default labeling,
  unaudited here; \`:modes="['hex']"\` fixes the picker to hex-only input with no prop to change it.
        `,
      },
    },
  },
  argTypes: {
    block: { control: 'object', description: 'The selected `LandingPageBlock` being edited — build with `defaultLandingBlock`/`cloneLandingBlock` so every field the panel reads is defined.' },
    remove: { control: false, description: 'Event — emitted with `block.id` when "Delete block" is clicked. The owning view removes the block from its `blocks` array.', table: { category: 'events' } },
  },
  render: (args) => ({
    components: { LandingBlockSettings },
    setup() {
      return { args }
    },
    template: `
      <aside style="width:320px;border-left:1px solid rgba(var(--v-theme-on-surface), 0.10);background:rgb(var(--v-theme-surface));padding:16px;">
        <LandingBlockSettings v-bind="args" />
      </aside>
    `,
  }),
} satisfies Meta<typeof LandingBlockSettings>

export default meta
type Story = StoryObj<typeof meta>

/** The `title` block's settings panel, color override unset ("Default color"). */
export const Default: Story = {
  args: {
    block: titleBlock(),
  },
}

/** The swatch button opens a `v-menu` with a hex-only `v-color-picker` for the text color override. */
export const ColorPickerOpen: Story = {
  args: {
    block: titleBlock('#7E3AF2'),
  },
  render: (args) => ({
    components: { LandingBlockSettings },
    setup() {
      return { args }
    },
    template: `
      <aside style="width:320px;min-height:520px;border-left:1px solid rgba(var(--v-theme-on-surface), 0.10);background:rgb(var(--v-theme-surface));padding:16px;">
        <LandingBlockSettings v-bind="args" />
      </aside>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Text color override"]')
    trigger?.click()
  },
}

/** The color-picker menu (an L3 overlay surface) in dark mode — open via the same play interaction. */
export const DarkMode: Story = {
  globals: darkModeGlobals,
  ...ColorPickerOpen,
}
