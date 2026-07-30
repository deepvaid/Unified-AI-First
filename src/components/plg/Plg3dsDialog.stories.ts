import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import Plg3dsDialog from './Plg3dsDialog.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'PLG/Plg3dsDialog',
  component: Plg3dsDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`Plg3dsDialog\` simulates the 3-D Secure challenge a card issuer shows mid-checkout — a
one-time passcode sent to the cardholder that must be entered before a purchase completes. It's
a real, blocking modal by design (per \`docs/overlay-audit/01\`, section 2 — PLG flows): it's
\`persistent\` so Escape and backdrop click can't dismiss it, and it owns its own 6-digit code and
\`verifying\` state internally, resetting both every time it reopens. Approve stays disabled until
all 6 digits are entered, then shows a brief loading state (\`:loading="verifying"\`) before
emitting \`approved\` and closing itself — there's no decline/failure path, so any complete code
approves.

**Use when:** a demo checkout flow needs to simulate the bank's OTP step before a card purchase
finalizes (see \`CheckoutView.vue\`).

**Don't use when:** the flow needs a real payment gateway integration, or a decision needs a
decline path — this dialog always approves after the simulated delay.

### Usage
\`\`\`html
<Plg3dsDialog
  v-model="dialogOpen"
  :amount-label="\`Maropost purchase — \${money(total)}\`"
  @approved="onApproved"
/>
\`\`\`

### 🟢 Do's
- **Do** pass a formatted \`amountLabel\` — it's the only context the shopper sees for what
  they're approving.
- **Do** treat \`@approved\` as the single signal to continue the checkout flow; the dialog
  already closes itself.
- **Do** rely on \`persistent\` — don't layer your own close-on-backdrop behavior around it.

### 🔴 Don'ts
- **Don't** expect a decline/error state — every completed code approves; this is a demo
  simulation, not a real 3DS integration.
- **Don't** reopen it pre-filled — the code and verifying state always reset to empty on open.

### A11y
- **Provides:** \`aria-labelledby\` ties the dialog to its title; \`persistent\` blocks
  Escape/backdrop dismissal, matching a real bank challenge that can't be casually dismissed;
  the OTP field autofocuses on open; Approve stays disabled until the code is complete and shows
  a loading state while verifying.
- **Consumer must:** pass a clear \`amountLabel\` — the dialog has no other way to say what's
  being approved.
        `,
      },
    },
  },
  args: {
    modelValue: true,
    amountLabel: 'Maropost purchase — $348.00',
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — dialog visibility. Reopening resets the entered code and clears the verifying state.' },
    amountLabel: { control: 'text', description: 'Context line under the title, e.g. "Maropost purchase — $348.00".' },
    approved: { control: false, description: 'Event — emitted once the (always-successful) verification completes; the dialog then closes itself.', table: { category: 'events' } },
  },
  render: (args) => ({
    components: { Plg3dsDialog },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:420px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="landmark" @click="open = true">Open verification</v-btn>
        <Plg3dsDialog v-bind="args" v-model="open" />
      </section>
    `,
  }),
} satisfies Meta<typeof Plg3dsDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Dialog open, empty code — ready for the shopper to enter the 6-digit passcode. */
export const Default: Story = {}

/**
 * Play-driven: pastes the demo code (123456) into the OTP field and clicks Approve, exercising
 * the real ~800ms verification delay — the OTP field disables and Approve shows its loading
 * state before the dialog auto-approves and closes.
 */
export const Verifying: Story = {
  play: async () => {
    // Dialog content teleports to <body> via v-dialog/v-overlay, so it's queried from
    // `document` rather than canvasElement. Give the open transition a beat to settle.
    await new Promise(resolve => setTimeout(resolve, 400))
    const firstField = document.querySelector<HTMLInputElement>('.v-otp-input__field')
    if (firstField) {
      const paste = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '123456' } })
      firstField.dispatchEvent(paste)
    }
    await new Promise(resolve => setTimeout(resolve, 250))
    const approveBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      .find(btn => btn.textContent?.trim() === 'Approve')
    approveBtn?.click()
  },
}

/** L4 modal surface in dark mode. */
export const DarkModeOpen: Story = {
  globals: darkModeGlobals,
  ...Default,
}
