import type { Meta, StoryObj } from '@storybook/vue3'
import MpWizardShell from './MpWizardShell.vue'

const STEPS = ['Campaign details', 'Contacts', 'Content', 'Schedule', 'Review']

const stepCard = `
  <v-card variant="flat" border rounded="lg" class="pa-8">
    <h2 class="text-h6 font-weight-bold mb-1">Campaign details</h2>
    <p class="text-body-2 text-medium-emphasis mb-6">Name your campaign and write the subject line recipients will see.</p>
    <v-divider class="mb-6" />
    <div class="text-body-2 text-medium-emphasis">Step content</div>
  </v-card>
`

const meta = {
  title: 'Patterns/Wizard Shell/MpWizardShell',
  component: MpWizardShell,
  tags: ['autodocs'],
  parameters: {
    canvas: 'full',
    docs: {
      description: {
        component: `
### Overview
The one full-page wizard chrome (route meta \`builderShell\`): a surface header
band with \`MpPageHeader\` and \`MpWizardSteps\` in its tabs row, a scrollable
body with a centred measure (\`component.wizard.measure.{sm,md,lg}\` =
780/920/1040), and a surface footer band — Back fallback on the left; hint
caption, tabular \`N / M\` counter and the primary actions on the right.

The shell composes the \`Step N of M — <label>\` subtitle itself; pass
\`subtitle\` only to override it (entitlement banners, single-step flows —
omitting \`steps\` also drops the steps row and counter).

### Division of labour
Step state lives in the page via \`useWizardSteps\` — feed its \`step\` /
\`maxStep\` into \`current\` / \`max-step\` and handle \`@select\` / \`@back\`.
The leave guard also stays with the page (it owns the dirty state):
explicit-persistence wizards wire \`useDirtyLeaveGuard\` + \`MpConfirmDialog\`;
autosaving flows don't block. Step content composes \`MpWizardStepCard\`;
galleries may render bare in the measure.

In the app the shell fills the rounded content frame (\`.mp-frame-fill\`).
Pass \`standalone\` to contain it in the parent instead — these stories all do.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Page title in the header band.' },
    steps: { control: 'object', description: 'Ordered step labels. Omit for a single-step action flow — the steps row, composed subtitle and counter all drop away.' },
    current: { control: 'number', description: '1-based current step. Required when `steps` is set.' },
    maxStep: { control: 'number', description: 'High-water mark of visited steps (`useWizardSteps().maxStep`). Steps up to it are jumpable; defaults to `current`.' },
    clickable: { control: 'boolean', description: 'Visited steps clickable (default true). MpWizardSteps gates jumps on `maxStep` regardless.' },
    backTo: { control: 'object', description: 'Header back-chevron target (`RouteLocationRaw`).' },
    eyebrow: { control: 'text', description: 'Muted tracked label above the title.' },
    subtitle: { control: 'text', description: 'Overrides the composed `Step N of M — <label>` subtitle.' },
    measure: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Content column width → `component.wizard.measure.*`: sm 780 (canonical form), md 920 (wide form/table steps), lg 1040 (split-pane and gallery steps). Defaults to sm.' },
    counter: { control: 'boolean', description: 'Show the tabular `N / M` footer counter (default true; renders only when `steps` is set).' },
    hint: { control: 'text', description: 'Disabled-reason caption before the counter — why the primary action is inert right now.' },
    standalone: { control: 'boolean', description: 'Fill the parent at height 100% instead of the app content frame. Set it outside the normal app chrome (nested layouts, Storybook).' },
  },
} satisfies Meta<typeof MpWizardShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Create campaign',
    steps: STEPS,
    current: 2,
    maxStep: 3,
    standalone: true,
  },
  render: (args) => ({
    components: { MpWizardShell },
    setup: () => ({ args }),
    template: `
      <div style="height:520px">
        <MpWizardShell v-bind="args">
          <template #actions>
            <v-btn variant="text" class="text-none text-medium-emphasis">Save &amp; exit</v-btn>
          </template>
          ${stepCard}
          <template #footer>
            <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right">Continue</v-btn>
          </template>
        </MpWizardShell>
      </div>
    `,
  }),
}

/** The three measure stops on one shell. */
export const Measures: Story = {
  args: { title: '', standalone: true },
  render: () => ({
    components: { MpWizardShell },
    setup: () => ({ STEPS }),
    template: `
      <div class="d-flex flex-column ga-6">
        <div v-for="m in ['sm', 'md', 'lg']" :key="m" style="height:300px">
          <MpWizardShell :title="'Measure ' + m" :steps="STEPS.slice(0, 3)" :current="1" :measure="m" standalone>
            <v-card variant="flat" border rounded="lg" class="pa-8 text-body-2 text-medium-emphasis">
              component.wizard.measure.{{ m }}
            </v-card>
            <template #footer>
              <v-btn color="primary" variant="flat" class="text-none">Continue</v-btn>
            </template>
          </MpWizardShell>
        </div>
      </div>
    `,
  }),
}

/** Structural variants: composed subtitle vs override, eyebrow, and a single-step flow with no steps row. */
export const Variants: Story = {
  args: { title: '', standalone: true },
  render: () => ({
    components: { MpWizardShell },
    setup: () => ({ STEPS }),
    template: `
      <div class="d-flex flex-column ga-6">
        <div style="height:280px">
          <MpWizardShell title="Composed subtitle + eyebrow" eyebrow="Marketing · Campaigns" :steps="STEPS.slice(0, 3)" :current="2" :max-step="2" standalone>
            <v-card variant="flat" border rounded="lg" class="pa-8 text-body-2 text-medium-emphasis">The subtitle reads "Step 2 of 3 — Contacts", composed by the shell.</v-card>
            <template #footer><v-btn color="primary" variant="flat" class="text-none">Continue</v-btn></template>
          </MpWizardShell>
        </div>
        <div style="height:280px">
          <MpWizardShell title="Subtitle override" subtitle="SMS is not enabled on this account." :steps="STEPS.slice(0, 2)" :current="1" standalone>
            <v-card variant="flat" border rounded="lg" class="pa-8 text-body-2 text-medium-emphasis">An entitlement banner replaces the composed step subtitle.</v-card>
            <template #footer><v-btn color="primary" variant="flat" class="text-none" disabled>Continue</v-btn></template>
          </MpWizardShell>
        </div>
        <div style="height:280px">
          <MpWizardShell title="Single-step action flow" subtitle="No steps — the steps row, composed subtitle and counter all drop away." standalone>
            <v-card variant="flat" border rounded="lg" class="pa-8 text-body-2 text-medium-emphasis">A chooser page committing one decision.</v-card>
            <template #footerStart><v-btn variant="text" class="text-none">Cancel</v-btn></template>
            <template #footer><v-btn color="primary" variant="flat" class="text-none" disabled>Continue</v-btn></template>
          </MpWizardShell>
        </div>
      </div>
    `,
  }),
}

/** Footer states: the disabled-reason hint, locked vs jumpable steps, and the final step. */
export const States: Story = {
  args: { title: '', standalone: true },
  render: () => ({
    components: { MpWizardShell },
    setup: () => ({ STEPS }),
    template: `
      <div class="d-flex flex-column ga-6">
        <div style="height:280px">
          <MpWizardShell title="Hint while blocked" :steps="STEPS.slice(0, 3)" :current="1" hint="Name your campaign to continue" standalone>
            <v-card variant="flat" border rounded="lg" class="pa-8 text-body-2 text-medium-emphasis">The caption explains the disabled primary.</v-card>
            <template #footer><v-btn color="primary" variant="flat" class="text-none" disabled append-icon="arrow-right">Continue</v-btn></template>
          </MpWizardShell>
        </div>
        <div style="height:280px">
          <MpWizardShell title="Everything visited" :steps="STEPS.slice(0, 4)" :current="2" :max-step="4" standalone>
            <v-card variant="flat" border rounded="lg" class="pa-8 text-body-2 text-medium-emphasis">Edit-mode hydration (useWizardSteps().unlockAll()) — every step is jumpable.</v-card>
            <template #footer><v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right">Continue</v-btn></template>
          </MpWizardShell>
        </div>
        <div style="height:280px">
          <MpWizardShell title="Final step" :steps="STEPS.slice(0, 3)" :current="3" :max-step="3" standalone>
            <v-card variant="flat" border rounded="lg" class="pa-8 text-body-2 text-medium-emphasis">Finalize actions replace Continue.</v-card>
            <template #footer>
              <v-btn variant="outlined" class="text-none">Save draft</v-btn>
              <v-btn color="primary" variant="flat" class="text-none" prepend-icon="rocket">Schedule campaign</v-btn>
            </template>
          </MpWizardShell>
        </div>
      </div>
    `,
  }),
}
