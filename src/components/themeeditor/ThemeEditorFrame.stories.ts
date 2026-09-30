import type { Meta, StoryObj } from '@storybook/vue3'
import ThemeEditorFrame from './ThemeEditorFrame.vue'

const meta = {
  title: 'Product/Sales Channels/Theme editor/ThemeEditorFrame',
  component: ThemeEditorFrame,
  tags: ['autodocs'],
  parameters: {
    canvas: 'full',
    docs: {
      description: {
        component: `
### Overview
The theme editor's own full-page frame (store builder re-skin, \`docs/rebuild/theme-editor-reskin\`):
the admin's top bar — back to Themes, the store and theme switchers, the "Theme actions" kebab
(Edit code / View live store) and the surface's actions — over the dark activity rail (Home,
Theme Settings) on the ink-panel surface. The builder, theme settings and code editor all render
inside it; the frame reads the store and its themes from the Pinia seeds.

**Use when:** a route is one of the three theme-editor surfaces.

**Don't use when:** a builder should sit inside the app frame — that is \`MpBuilderShell\`.

### A11y
- **Provides:** \`role="banner"\` top bar, a labelled \`<nav>\` rail with \`aria-current="page"\` on the
  active surface and tooltips on its icon-only links, labelled toolbar selects.

> **Story note:** the Storybook router is a catch-all, so the rail links and the storefront link
> resolve to the stub route.
        `,
      },
    },
  },
  args: {
    accountId: '2000290',
    channelId: 'neelam-store',
    themeId: 'theme-neelam-lumos',
    active: 'builder',
  },
  argTypes: {
    active: { control: 'radio', options: ['builder', 'settings', 'code'] },
  },
  render: (args) => ({
    components: { ThemeEditorFrame },
    setup: () => ({ args }),
    template: `
      <div style="height: 480px; border: 1px solid var(--border-subtle); border-radius: var(--mp-component-card-radius); overflow: hidden;">
        <ThemeEditorFrame v-bind="args" style="height: 100%;">
          <template #actions>
            <v-btn variant="text" class="text-none" prepend-icon="external-link">Preview</v-btn>
            <v-btn variant="outlined" class="text-none" disabled>Save</v-btn>
            <v-btn color="primary" variant="flat" class="text-none">Publish</v-btn>
          </template>
          <div style="flex: 1; display: grid; place-items: center; color: var(--text-muted);">Editor body</div>
        </ThemeEditorFrame>
      </div>
    `,
  }),
} satisfies Meta<typeof ThemeEditorFrame>

export default meta
type Story = StoryObj<typeof meta>

/** The builder's frame: Home active on the rail, Preview / Save / Publish on the right. */
export const Default: Story = {}

/** Theme settings and the code editor light their own rail item (the code editor lights none). */
export const Variants: Story = {
  name: 'Variants (active surface)',
  render: (args) => ({
    components: { ThemeEditorFrame },
    setup: () => ({ args, surfaces: ['builder', 'settings', 'code'] }),
    template: `
      <div style="display: grid; gap: var(--mp-space-24);">
        <div v-for="surface in surfaces" :key="surface" style="height: 200px; border: 1px solid var(--border-subtle); border-radius: var(--mp-component-card-radius); overflow: hidden;">
          <ThemeEditorFrame v-bind="{ ...args, active: surface }" style="height: 100%;">
            <template #actions>
              <v-btn variant="text" class="text-none" disabled>Save</v-btn>
            </template>
            <div style="flex: 1; display: grid; place-items: center; color: var(--text-muted);">active = {{ surface }}</div>
          </ThemeEditorFrame>
        </div>
      </div>
    `,
  }),
}
