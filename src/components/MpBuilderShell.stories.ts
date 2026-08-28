import type { Meta, StoryObj } from '@storybook/vue3'
import MpBuilderShell from './MpBuilderShell.vue'
import MpWizardSteps from './MpWizardSteps.vue'

const meta = {
  title: 'Patterns/Builder Shell/MpBuilderShell',
  component: MpBuilderShell,
  tags: ['autodocs'],
  parameters: {
    canvas: 'full',
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
    title: { control: 'text', description: 'Primary title in the builder toolbar.' },
    subtitle: { control: 'text', description: 'Supporting line beside the title.' },
    backTo: { control: 'object', description: 'Back navigation target (a `RouteLocationRaw`). Renders the back link in the toolbar; omit it for a builder with nowhere to return to.' },
    backLabel: { control: 'text', description: 'Label on the back link. Defaults to `Back`.' },
    dirty: { control: 'boolean', description: 'Whether there are unsaved changes. Drives which half of `persistenceMode`s copy the status chip shows.' },
    statusLabel: { control: 'text', description: 'Overrides the status chip copy entirely, ignoring `dirty` and `persistenceMode`. Use it only where neither of the three modes fits.' },
    hideStatus: { control: 'boolean', description: 'Removes the status chip. For screens where save state is already obvious elsewhere and the chip is redundant.' },
    standalone: { control: 'boolean', description: 'Fills the parent at height 100% instead of sitting inside the app content frame. Set it when the shell is not mounted in the normal app chrome.' },
    leftWidth: { control: 'number', description: 'Left panel width in px. Viewports at or below 1024px render it 20px narrower. Defaults to 220.' },
    rightWidth: { control: 'number', description: 'Right panel width in px. Viewports at or below 1024px render it 40px narrower. Defaults to 300.' },
    persistenceMode: {
      control: 'select',
      options: ['explicit', 'autosave', 'live'],
      description: 'How the status chip words itself: `explicit` -> Unsaved / Saved, `autosave` -> Unsaved / Autosaved, `live` -> Unpublished changes / Published. Pick the one that matches what the builder actually does; `statusLabel` overrides the copy entirely.',
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
