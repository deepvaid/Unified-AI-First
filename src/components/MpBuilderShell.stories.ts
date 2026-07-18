import type { Meta, StoryObj } from '@storybook/vue3'
import MpBuilderShell from './MpBuilderShell.vue'

const meta = {
  title: 'Layout/MpBuilderShell',
  component: MpBuilderShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### Overview
Shared full-page chrome for canvas builders (email, landing, journey, theme).
Provides a 56px toolbar with back, title, persistence status chip, and action slot,
plus optional left/right panes around a center canvas.

### Persistence modes
| Mode | Dirty chip | Clean chip | Use when |
|---|---|---|---|
| \`explicit\` | Unsaved | Saved | Merchant clicks Save |
| \`autosave\` | Unsaved | Autosaved | Debounced store writes |
| \`live\` | Unpublished changes | Published | Edits apply to draft; Publish goes live |

See \`docs/design-system/builder-persistence.md\`.
`,
      },
    },
  },
  argTypes: {
    persistenceMode: {
      control: 'select',
      options: ['explicit', 'autosave', 'live'],
    },
  },
} satisfies Meta<typeof MpBuilderShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Welcome email',
    subtitle: 'Block editor · 3 blocks',
    dirty: false,
    persistenceMode: 'explicit',
    backLabel: 'Back to Email Content',
  },
  render: (args) => ({
    components: { MpBuilderShell },
    setup: () => ({ args }),
    template: `
      <div style="height:480px">
        <MpBuilderShell v-bind="args">
          <template #left>
            <div class="pa-4 text-body-2">Blocks palette</div>
          </template>
          <div class="pa-8 text-body-2">Canvas</div>
          <template #right>
            <div class="pa-4 text-body-2">Settings</div>
          </template>
          <template #actions>
            <v-btn variant="text" class="text-none">Preview</v-btn>
            <v-btn color="primary" variant="flat" class="text-none">Save</v-btn>
          </template>
        </MpBuilderShell>
      </div>
    `,
  }),
}

export const DirtyAutosave: Story = {
  args: {
    title: 'Spring promo',
    subtitle: 'Landing page',
    dirty: true,
    persistenceMode: 'autosave',
  },
  render: Default.render,
}

export const LiveDraft: Story = {
  args: {
    title: 'Dawn theme',
    dirty: true,
    persistenceMode: 'live',
  },
  render: Default.render,
}
