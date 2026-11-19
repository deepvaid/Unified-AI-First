import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpBuilderPreviewDialog from './MpBuilderPreviewDialog.vue'
import MpSegmentedControl from './MpSegmentedControl.vue'
import { measure, overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Patterns/Builder Shell/MpBuilderPreviewDialog',
  component: MpBuilderPreviewDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpBuilderPreviewDialog\` is the fullscreen preview overlay shared by the Email, Landing page,
and Chatbot builders. It composes \`MpDialog fullscreen flush\`: the shell's header band (title,
optional \`#toolbar\` slot, close button) above a full-bleed stage that holds the preview
content. The dialog body owns the scroll, so long previews never scroll the page behind the
overlay.

**Use when:** a builder needs to show merchant-facing output at full size — never leave a
"Preview" button unwired.

**Don't use when:** the preview is a small inline artifact (use a card in the builder's own
canvas), or the surface is a form (use \`MpFormDrawer\`).

### Usage
\`\`\`html
<MpBuilderPreviewDialog v-model="previewOpen" title="Preview — Welcome email">
  <template #toolbar>
    <MpSegmentedControl v-model="device" :items="devices" size="sm" ariaLabel="Preview device" />
  </template>
  <EmailCanvas :blocks="blocks" />
</MpBuilderPreviewDialog>
\`\`\`

### 🟢 Do's
- **Do** name what's being previewed in \`title\` ("Preview — Welcome email"), not just "Preview".
- **Do** put device/viewport toggles in the \`#toolbar\` slot so they sit beside the close button,
  and build them with \`MpSegmentedControl\` — never a raw \`v-btn-toggle\`.
- **Do** let the stage scroll — give preview content a \`max-width\` rather than its own scroller.

### 🔴 Don'ts
- **Don't** put editing controls in here — preview is read-only; edits belong in the builder.
- **Don't** nest another dialog inside the stage.

### A11y
- **Provides:** everything \`MpDialog\` does — the dialog is labelled by its title via
  \`aria-labelledby\`, the close button carries \`aria-label="Close"\`, focus is trapped, Escape
  closes and focus returns to the trigger. The stage is a focusable \`role="group"\` named after
  the title, so the keyboard can scroll a preview that has no controls of its own.
- **Consumer must:** ensure preview content is itself accessible (alt text, heading order) —
  the dialog does not sanitize what it renders.
        `,
      },
    },
  },
  args: {
    modelValue: true,
    title: 'Preview — Welcome email',
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'Open state (v-model).' },
    title: { control: 'text', description: 'Title-bar label. Defaults to "Preview"; name the artifact being previewed.' },
    'update:modelValue': { control: false, description: 'Event — emitted with `false` when the dialog closes.', table: { category: 'events' } },
    'onUpdate:modelValue': { action: 'update:modelValue', table: { disable: true } },
    default: { control: false, description: 'Slot — the preview content (email canvas, landing sheet, chatbot widget).', table: { category: 'slots' } },
    toolbar: { control: false, description: 'Slot — controls beside the close button, e.g. a device `MpSegmentedControl`.', table: { category: 'slots' } },
  },
} satisfies Meta<typeof MpBuilderPreviewDialog>

export default meta
type Story = StoryObj<typeof meta>

const components = { MpBuilderPreviewDialog, MpSegmentedControl }

/** Preview widths: the default dialog measure for desktop, the shopper-preview panel for a phone. */
const DESKTOP_WIDTH = measure.dialog
const MOBILE_WIDTH = 'var(--mp-layout-previewPanelWidth)'

const DEVICES = [
  { value: 'desktop', icon: 'monitor', label: 'Desktop' },
  { value: 'tablet', icon: 'tablet', label: 'Tablet' },
  { value: 'mobile', icon: 'smartphone', label: 'Mobile' },
]

/** A short email on the stage: a card at the desktop preview width. */
const EMAIL_PREVIEW = `
  <v-card flat border rounded="lg" class="mp-card-inset mp-card-inset--spacious" style="width: 100%; max-width: ${DESKTOP_WIDTH};">
    <div class="text-h5 font-weight-bold mb-2">Welcome</div>
    <div class="text-body-2 text-medium-emphasis">Preview content goes here.</div>
  </v-card>
`

/** A preview bound to the Controls panel on the Canvas tab, open on load. On the docs page it has its own frame, which the Controls table there cannot drive. */
const openPreview: Story['render'] = (args) => ({
  components,
  setup() {
    // Follows the `modelValue` control, so the preview can be closed and reopened from Controls
    // as well as from the trigger button.
    const open = ref(args.modelValue ?? false)
    watch(() => args.modelValue, (value) => { open.value = value ?? false })
    return { args, open }
  },
  template: `
    <div>
      <v-btn variant="outlined" prepend-icon="eye" @click="open = true">Open preview</v-btn>
      <MpBuilderPreviewDialog v-bind="args" v-model="open">${EMAIL_PREVIEW}</MpBuilderPreviewDialog>
    </div>
  `,
})

/** The overlay open over a short email preview. */
export const Default: Story = {
  parameters: overlayDocs(),
  render: openPreview,
}

// ── Template: Variants · States ──────────────────────────────────────────────

/**
 * Two structures: bar + stage, and bar + `#toolbar` controls + stage. Both are
 * `MpDialog fullscreen flush` — the header band, close affordance and body scroll come from the
 * shell, so a preview and a form modal wear the same chrome. The toolbar holds a device
 * `MpSegmentedControl`, left of the close button.
 *
 * There is no `size` prop — a preview is always full-screen, because the point is to see the
 * artefact at its real size without the app's chrome competing. The stage inside is what carries
 * a measure, and that is the caller's canvas.
 */
export const Variants: Story = {
  render: () => ({
    components,
    data: () => ({ which: '' as string, device: 'desktop', devices: DEVICES }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'plain'">Bar + stage</v-btn>
        <v-btn variant="outlined" @click="which = 'toolbar'">+ #toolbar</v-btn>

        <MpBuilderPreviewDialog :model-value="which === 'plain'" title="Email preview" @update:model-value="which = ''">
          <v-card flat border rounded="lg" class="mp-card-inset mp-card-inset--spacious" style="width: 100%; max-width: ${DESKTOP_WIDTH};">Email canvas</v-card>
        </MpBuilderPreviewDialog>

        <MpBuilderPreviewDialog :model-value="which === 'toolbar'" title="Landing page preview" @update:model-value="which = ''">
          <template #toolbar>
            <MpSegmentedControl v-model="device" :items="devices" size="sm" ariaLabel="Preview device" />
          </template>
          <v-card flat border rounded="lg" class="mp-card-inset mp-card-inset--spacious" style="width: 100%; max-width: ${DESKTOP_WIDTH};">Landing canvas — {{ device }}</v-card>
        </MpBuilderPreviewDialog>
      </div>
    `,
  }),
  args: {} as never,
}

/** Short content (the stage centres it) and content long enough to scroll (the bar stays pinned). */
export const States: Story = {
  render: () => ({
    components,
    data: () => ({ which: '' as string, blocks: Array.from({ length: 10 }, (_, i) => i + 1) }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'short'">Short</v-btn>
        <v-btn variant="outlined" @click="which = 'long'">Scrolling</v-btn>

        <MpBuilderPreviewDialog :model-value="which === 'short'" title="Short preview" @update:model-value="which = ''">
          <v-card flat border rounded="lg" class="mp-card-inset mp-card-inset--spacious" style="width: 100%; max-width: ${DESKTOP_WIDTH};">One block.</v-card>
        </MpBuilderPreviewDialog>
        <MpBuilderPreviewDialog :model-value="which === 'long'" title="Long preview" @update:model-value="which = ''">
          <div class="d-flex flex-column ga-4" style="width: 100%; max-width: ${DESKTOP_WIDTH};">
            <v-card v-for="n in blocks" :key="n" flat border rounded="lg" class="mp-card-inset mp-card-inset--spacious">Block {{ n }}</v-card>
          </div>
        </MpBuilderPreviewDialog>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Scenarios ───────────────────────────────────────────────────────────────

/**
 * **In context.** A builder's Preview button opening a real-looking email: device toggle in
 * `#toolbar`, the rendered email on the stage. It starts closed: press **Preview**.
 */
export const InContextEmailBuilderPreview: Story = {
  render: () => ({
    components,
    data: () => ({
      open: false,
      device: 'desktop',
      devices: DEVICES.filter((device) => device.value !== 'tablet'),
      widths: { desktop: DESKTOP_WIDTH, mobile: MOBILE_WIDTH },
    }),
    template: `
      <div class="d-flex align-center ga-3">
        <div class="text-body-2 text-medium-emphasis">Spring Refresh · Draft</div>
        <v-spacer />
        <v-btn variant="outlined" prepend-icon="eye" @click="open = true">Preview</v-btn>
        <v-btn color="primary" variant="flat">Send test</v-btn>

        <MpBuilderPreviewDialog v-model="open" title="Spring Refresh — preview">
          <template #toolbar>
            <MpSegmentedControl v-model="device" :items="devices" size="sm" ariaLabel="Preview device" />
          </template>
          <v-card flat border rounded="lg" :style="{ width: '100%', maxWidth: widths[device] }">
            <div class="pa-6 text-center" style="background: var(--surface-secondary); color: var(--on-surface);">
              <div class="text-h6 font-weight-bold">Northwind Supply Co.</div>
            </div>
            <div class="pa-8 text-center">
              <div class="text-h5 font-weight-bold mb-2">Spring, refreshed</div>
              <p class="text-body-2 text-medium-emphasis mb-6">New arrivals for the trail, the town and everything between.</p>
              <v-btn color="primary" variant="flat">Shop new arrivals</v-btn>
            </div>
            <div class="pa-4 text-center text-caption" style="background: var(--surface-secondary); color: var(--on-surface-muted);">
              You are receiving this because you subscribed. Unsubscribe.
            </div>
          </v-card>
        </MpBuilderPreviewDialog>
      </div>
    `,
  }),
  args: {} as never,
}

/** At 375px the title truncates and the stage fills the viewport edge to edge (canvas only; a docs frame is as wide as the page). */
export const Mobile375: Story = {
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
  parameters: overlayDocs(),
  render: openPreview,
}
