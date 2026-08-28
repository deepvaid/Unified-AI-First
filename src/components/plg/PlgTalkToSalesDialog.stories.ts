import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import PlgTalkToSalesDialog from './PlgTalkToSalesDialog.vue'

const meta = {
  title: 'Product/PLG/PlgTalkToSalesDialog',
  component: PlgTalkToSalesDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`PlgTalkToSalesDialog\` is the lightweight lead-capture form behind every "Talk to sales" link
in the PLG flows (the trial popover, the Plans page). It asks what the shopper is interested in
and an optional free-text note, then on submit closes itself, emits \`submitted\`, and fires a
confirmation toast — there's no real backend, so "interest" and "notes" aren't persisted
anywhere.

**Use when:** a PLG surface needs a low-friction way to request a sales callback without
leaving the page.

**Don't use when:** the request needs to route to a specific rep or capture more structured
detail (that needs a real form flow, not this demo dialog), or the decision is a yes/no gate
(use \`MpConfirmDialog\`).

### Usage
\`\`\`html
<PlgTalkToSalesDialog v-model="salesDialogOpen" />
\`\`\`

### 🟢 Do's
- **Do** open it from a text/tonal button labelled "Talk to sales" — never as the page's
  primary CTA.
- **Do** let it manage its own submit/close/toast — don't duplicate that confirmation elsewhere.
- **Do** keep the mailto fallback visible for shoppers who'd rather not wait for a callback.

### 🔴 Don'ts
- **Don't** treat \`submitted\` as delivery confirmation — this demo has no backend; the toast is
  the only feedback the shopper gets.
- **Don't** require the interest dropdown — it's optional context, not a form gate.

### A11y
- **Provides:** the dialog surface is wired to its title via \`aria-labelledby\`; Vuetify's
  \`v-dialog\` traps focus, closes on Escape/backdrop click, and restores focus on close; the
  select and textarea are standard labelled Vuetify fields.
- **Consumer must:** nothing beyond mounting it with a \`v-model\`.
        `,
      },
    },
  },
  args: {
    modelValue: true,
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — dialog visibility. Submitting or cancelling resets the form and closes it.' },
    submitted: { control: false, description: 'Event — emitted after "Request a call" is clicked (the dialog closes and a confirmation toast fires first).', table: { category: 'events' } },
  },
  render: (args) => ({
    components: { PlgTalkToSalesDialog },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:460px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="messages-square" @click="open = true">Talk to sales</v-btn>
        <PlgTalkToSalesDialog v-bind="args" v-model="open" />
      </section>
    `,
  }),
} satisfies Meta<typeof PlgTalkToSalesDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Dialog open, empty form. */
export const Default: Story = {}

/**
 * Play-driven: opens the "interested in" dropdown, picks "Enterprise pricing", and types a note,
 * showing the dialog ready to submit.
 */
export const FilledIn: Story = {
  play: async () => {
    // Dialog content teleports to <body> via v-dialog/v-overlay, so it's queried from
    // `document` rather than canvasElement. Give the open transition a beat to settle.
    await new Promise(resolve => setTimeout(resolve, 400))
    const select = document.querySelector<HTMLElement>('.v-select')
    select?.click()
    await new Promise(resolve => setTimeout(resolve, 200))
    const option = Array.from(document.querySelectorAll<HTMLElement>('.v-list-item'))
      .find(item => item.textContent?.includes('Enterprise pricing'))
    option?.click()

    const textarea = document.querySelector<HTMLTextAreaElement>('textarea')
    if (textarea) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
      setter?.call(textarea, 'We\'re evaluating a move from Marketing Cloud + a legacy help desk — want to understand migration effort.')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a short contact form. Nothing about it varies by prop. */
export const Variants: Story = {
  render: (args) => ({
    components: { PlgTalkToSalesDialog },
    setup: () => ({ args }),
    template: `<PlgTalkToSalesDialog v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — this is `MpDialog`'s `sm` (440px). Phase 4 replaced this file's
 * `pa-1` card, Vuetify's default card insets and the `gap-2` / `gap-4` global shims with the
 * shell: one 20px inset, and a body whose field rhythm is `component.dialog.gap`.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { PlgTalkToSalesDialog },
    setup: () => ({ args }),
    template: `<PlgTalkToSalesDialog v-bind="args" />`,
  }),
}

/** Empty and filled in — submitting closes the dialog and raises a toast. */
export const States: Story = {
  render: (args) => ({
    components: { PlgTalkToSalesDialog },
    setup: () => ({ args }),
    template: `<PlgTalkToSalesDialog v-bind="args" />`,
  }),
}
