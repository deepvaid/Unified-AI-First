import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpBuilderPreviewDialog from './MpBuilderPreviewDialog.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Overlays/MpBuilderPreviewDialog',
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

export const DarkMode: Story = {
  render: previewStory(EMAIL_PREVIEW),
  globals: darkModeGlobals,
}
