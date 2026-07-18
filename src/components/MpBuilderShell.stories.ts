import type { Meta, StoryObj } from '@storybook/vue3'
import MpBuilderShell from './MpBuilderShell.vue'
import MpWizardSteps from './MpWizardSteps.vue'

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
Shared chrome for builder/editor routes (route meta \`builderShell\`).
Provides a 56px toolbar with back, title, optional mid-toolbar cluster,
persistence status chip, and action slot; an optional 52px steps row; and
left/right panes around a center canvas.

In the app the shell fills the rounded content frame edge-to-edge
(\`.mp-frame-fill\`). Pass \`standalone\` to contain it in the parent instead —
these stories all do.

### Persistence modes
| Mode | Dirty chip | Clean chip | Use when |
|---|---|---|---|
| \`explicit\` | Unsaved | Saved | Merchant clicks Save |
| \`autosave\` | Unsaved | Autosaved | Debounced store writes |
| \`live\` | Unpublished changes | Published | Edits apply to draft; Publish goes live |

Leave-guard rule: \`explicit\`/\`live\` views wire \`useDirtyLeaveGuard\`
(the shell's back button navigates through vue-router, so the guard
intercepts it); \`autosave\` views leave loss-free and add no guard.

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
    standalone: true,
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
    standalone: true,
  },
  render: Default.render,
}

export const LiveDraft: Story = {
  args: {
    title: 'Dawn theme',
    dirty: true,
    persistenceMode: 'live',
    standalone: true,
  },
  render: Default.render,
}

export const WithStepsRow: Story = {
  args: {
    title: 'Newsletter signup',
    subtitle: 'Step 2 of 3 · Build your form',
    dirty: true,
    persistenceMode: 'explicit',
    standalone: true,
  },
  render: (args) => ({
    components: { MpBuilderShell, MpWizardSteps },
    setup: () => ({ args }),
    template: `
      <div style="height:520px">
        <MpBuilderShell v-bind="args">
          <template #steps>
            <MpWizardSteps :steps="['Setup', 'Build', 'Publish']" :current="2" />
          </template>
          <div class="pa-8 text-body-2">Canvas</div>
          <template #actions>
            <v-btn variant="text" class="text-none">Save draft</v-btn>
            <v-btn color="primary" variant="flat" class="text-none">Save &amp; exit</v-btn>
          </template>
        </MpBuilderShell>
      </div>
    `,
  }),
}

export const WithCenterToolbar: Story = {
  args: {
    title: 'Dawn theme',
    dirty: false,
    persistenceMode: 'live',
    standalone: true,
    rightWidth: 320,
  },
  render: (args) => ({
    components: { MpBuilderShell },
    setup: () => ({ args }),
    template: `
      <div style="height:480px">
        <MpBuilderShell v-bind="args">
          <template #toolbar-center>
            <v-btn-toggle density="compact" mandatory model-value="desktop">
              <v-btn value="desktop" size="small" icon="monitor" aria-label="Desktop preview" />
              <v-btn value="mobile" size="small" icon="smartphone" aria-label="Mobile preview" />
            </v-btn-toggle>
          </template>
          <div class="pa-8 text-body-2">Storefront preview</div>
          <template #right>
            <div class="pa-4 text-body-2">Inspector</div>
          </template>
          <template #actions>
            <v-btn color="primary" variant="flat" class="text-none">Publish</v-btn>
          </template>
        </MpBuilderShell>
      </div>
    `,
  }),
}
