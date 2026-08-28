import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpBuilderPreviewDialog from './MpBuilderPreviewDialog.vue'

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
and Chatbot builders. It's a \`v-dialog fullscreen\` wrapping a flat, square-cornered card: a
56px title bar (title, optional \`#toolbar\` slot, close button) above a scrollable stage that
holds the preview content. The stage owns the scroll, so long previews never scroll the page
behind the overlay.

**Use when:** a builder needs to show merchant-facing output at full size — never leave a
"Preview" button unwired.

**Don't use when:** the preview is a small inline artifact (use a card in the builder's own
canvas), or the surface is a form (use \`MpFormDrawer\`).

### Usage
\`\`\`html
<MpBuilderPreviewDialog v-model="previewOpen" title="Preview — Welcome email">
  <template #toolbar>
    <v-btn-toggle v-model="device" density="compact" />
  </template>
  <EmailCanvas :blocks="blocks" />
</MpBuilderPreviewDialog>
\`\`\`

### 🟢 Do's
- **Do** name what's being previewed in \`title\` ("Preview — Welcome email"), not just "Preview".
- **Do** put device/viewport toggles in the \`#toolbar\` slot so they sit beside the close button.
- **Do** let the stage scroll — give preview content a \`max-width\` rather than its own scroller.

### 🔴 Don'ts
- **Don't** put editing controls in here — preview is read-only; edits belong in the builder.
- **Don't** nest another dialog inside the stage.

### A11y
- **Provides:** the dialog is labelled by its title via \`aria-labelledby\` (\`useId()\`-scoped),
  the close button carries \`aria-label="Close preview"\`, and Vuetify's \`v-dialog\` supplies the
  focus trap, Escape-to-close, and focus restoration.
- **Consumer must:** ensure preview content is itself accessible (alt text, heading order) —
  the dialog does not sanitize what it renders.
        `,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'Open state (v-model).' },
    title: { control: 'text', description: 'Title-bar label. Defaults to "Preview"; name the artifact being previewed.' },
    'update:modelValue': { action: 'update:modelValue', description: 'Emitted when the dialog closes.' },
  },
} satisfies Meta<typeof MpBuilderPreviewDialog>

export default meta
type Story = StoryObj<typeof meta>

const EMAIL_PREVIEW = `
  <v-card flat border rounded="lg" class="pa-8" style="max-width:600px;width:100%">
    <div class="text-h5 font-weight-bold mb-2">Welcome</div>
    <div class="text-body-2 text-medium-emphasis">Preview content goes here.</div>
  </v-card>
`

/** Builds an open-by-default preview story around the given stage markup. */
function previewStory(stage: string, toolbar = ''): Story['render'] {
  return () => ({
    components: { MpBuilderPreviewDialog },
    setup: () => ({ open: ref(true) }),
    template: `
      <div>
        <v-btn class="text-none" @click="open = true">Open preview</v-btn>
        <MpBuilderPreviewDialog v-model="open" title="Preview — Welcome email">
          ${toolbar}
          ${stage}
        </MpBuilderPreviewDialog>
      </div>
    `,
  })
}

/** The overlay open over a short email preview. */
export const Default: Story = {
  render: previewStory(EMAIL_PREVIEW),
}

/** A device toggle in the `#toolbar` slot, sitting left of the close button. */
export const WithToolbar: Story = {
  render: previewStory(
    EMAIL_PREVIEW,
    `<template #toolbar>
       <v-btn-toggle model-value="desktop" density="compact" variant="outlined" divided>
         <v-btn value="desktop" size="small" icon="monitor" aria-label="Desktop" />
         <v-btn value="mobile" size="small" icon="smartphone" aria-label="Mobile" />
       </v-btn-toggle>
     </template>`,
  ),
}

/** Long content — the stage scrolls, the title bar stays pinned. */
export const LongContent: Story = {
  render: previewStory(`
    <v-card flat border rounded="lg" class="pa-8" style="max-width:600px;width:100%">
      <div class="text-h5 font-weight-bold mb-4">Spring lookbook</div>
      <p v-for="n in 24" :key="n" class="text-body-2 text-medium-emphasis mb-4">
        Section {{ n }} — preview content continues past the fold so the stage scrolls
        independently of the pinned title bar.
      </p>
    </v-card>
  `),
}

/** At 375px the title truncates and the stage fills the viewport edge to edge. */
export const Mobile375: Story = {
  render: previewStory(EMAIL_PREVIEW),
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * Two structures: bar + stage, and bar + `#toolbar` controls + stage. Since Phase 4 both are
 * `MpDialog fullscreen` — the header band, close affordance and body scroll come from the
 * shell, so a preview and a form modal wear the same chrome.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpBuilderPreviewDialog },
    data: () => ({ which: 'plain' as string, device: 'desktop' }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" class="text-none" @click="which = 'plain'">Bar + stage</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'toolbar'">+ #toolbar</v-btn>

        <MpBuilderPreviewDialog :model-value="which === 'plain'" title="Email preview" @update:model-value="which = ''">
          <v-card flat border rounded="lg" class="pa-8" style="width: 600px">Email canvas</v-card>
        </MpBuilderPreviewDialog>

        <MpBuilderPreviewDialog :model-value="which === 'toolbar'" title="Landing page preview" @update:model-value="which = ''">
          <template #toolbar>
            <v-btn-toggle v-model="device" mandatory density="compact" variant="outlined">
              <v-btn value="desktop" icon="monitor" aria-label="Desktop" />
              <v-btn value="tablet" icon="tablet" aria-label="Tablet" />
              <v-btn value="mobile" icon="smartphone" aria-label="Mobile" />
            </v-btn-toggle>
          </template>
          <v-card flat border rounded="lg" class="pa-8" style="width: 600px">Landing canvas — {{ device }}</v-card>
        </MpBuilderPreviewDialog>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no `size` prop — a preview is always full-screen, because the point is to see the
 * artefact at its real size without the app's chrome competing. The stage inside is what
 * carries a measure, and that is the caller's canvas.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpBuilderPreviewDialog },
    data: () => ({ open: true }),
    template: `
      <div>
        <v-btn variant="outlined" class="text-none" @click="open = true">Open preview</v-btn>
        <MpBuilderPreviewDialog v-model="open" title="Email preview">
          <v-card flat border rounded="lg" class="pa-8" style="width: 600px">A 600px email canvas on a full-bleed stage.</v-card>
        </MpBuilderPreviewDialog>
      </div>
    `,
  }),
  args: {} as never,
}

/** Short content (stage centres it) and content long enough to scroll (the bar stays pinned). */
export const States: Story = {
  render: () => ({
    components: { MpBuilderPreviewDialog },
    data: () => ({ which: '' as string, blocks: Array.from({ length: 10 }, (_, i) => i + 1) }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" class="text-none" @click="which = 'short'">Short</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'long'">Scrolling</v-btn>

        <MpBuilderPreviewDialog :model-value="which === 'short'" title="Short preview" @update:model-value="which = ''">
          <v-card flat border rounded="lg" class="pa-8" style="width: 600px">One block.</v-card>
        </MpBuilderPreviewDialog>
        <MpBuilderPreviewDialog :model-value="which === 'long'" title="Long preview" @update:model-value="which = ''">
          <div style="width: 600px">
            <v-card v-for="n in blocks" :key="n" flat border rounded="lg" class="pa-8 mb-4">Block {{ n }}</v-card>
          </div>
        </MpBuilderPreviewDialog>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** A builder's Preview button opening a real-looking email: device toggle in
 * `#toolbar`, the rendered email on the stage.
 */
export const InContextEmailBuilderPreview: Story = {
  render: () => ({
    components: { MpBuilderPreviewDialog },
    data: () => ({ open: true, device: 'desktop' }),
    template: `
      <div class="d-flex align-center ga-3">
        <div class="text-body-2 text-medium-emphasis">Spring Refresh · Draft</div>
        <v-spacer />
        <v-btn variant="outlined" class="text-none" prepend-icon="eye" @click="open = true">Preview</v-btn>
        <v-btn color="primary" variant="flat" class="text-none">Send test</v-btn>

        <MpBuilderPreviewDialog v-model="open" title="Spring Refresh — preview">
          <template #toolbar>
            <v-btn-toggle v-model="device" mandatory density="compact" variant="outlined">
              <v-btn value="desktop" icon="monitor" aria-label="Desktop" />
              <v-btn value="mobile" icon="smartphone" aria-label="Mobile" />
            </v-btn-toggle>
          </template>
          <v-card flat border rounded="lg" :style="{ width: device === 'mobile' ? '390px' : '640px' }">
            <div class="pa-6 text-center" style="background: var(--surface-secondary)">
              <div class="text-h6 font-weight-bold">Northwind Supply Co.</div>
            </div>
            <div class="pa-8 text-center">
              <div class="text-h5 font-weight-bold mb-2">Spring, refreshed</div>
              <p class="text-body-2 text-medium-emphasis mb-6">New arrivals for the trail, the town and everything between.</p>
              <v-btn color="primary" variant="flat" class="text-none">Shop new arrivals</v-btn>
            </div>
            <div class="pa-4 text-center text-caption text-medium-emphasis" style="background: var(--surface-secondary)">
              You are receiving this because you subscribed. Unsubscribe.
            </div>
          </v-card>
        </MpBuilderPreviewDialog>
      </div>
    `,
  }),
  args: {} as never,
}
