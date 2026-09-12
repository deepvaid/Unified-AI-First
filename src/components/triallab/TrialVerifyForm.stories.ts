import type { Meta, StoryObj } from '@storybook/vue3'
import TrialVerifyForm from './TrialVerifyForm.vue'
import { grid } from '@/stories/storyTemplate'
import { constrain } from '@/stories/decorators'

const meta = {
  title: 'Product/Trial Lab/TrialVerifyForm',
  component: TrialVerifyForm,
  tags: ['autodocs'],
  decorators: [constrain('compact')],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The one email-verification surface in the Trial Lab. It appears full-size on the verify screen and
inside the dialog that gated actions open, so both places accept the same 6-digit code, offer the
same resend / change-email recovery and speak the same error copy. The parent owns the challenge
state and the last result; this component owns only the typed code.

**Behaviour:** auto-submits at six digits (paste-safe), clears after a rejected code, disables
resend for a short cooldown after each send, and lets the user correct the address inline.
        `,
      },
    },
  },
  args: {
    email: 'alex.rivera@northwind.example',
    challengeState: 'pending',
    lastResult: null,
    sentAt: new Date(Date.now() - 20_000).toISOString(),
    now: Date.now(),
    submitting: false,
  },
} satisfies Meta<typeof TrialVerifyForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: grid(TrialVerifyForm, [
    { label: 'Pending', args: { ...meta.args } },
    { label: 'Delayed email', args: { ...meta.args, challengeState: 'delayed' } },
    { label: 'Wrong code', args: { ...meta.args, lastResult: 'wrong' } },
    { label: 'Expired', args: { ...meta.args, challengeState: 'expired', lastResult: 'expired' } },
    { label: 'Submitting', args: { ...meta.args, submitting: true } },
  ], { columns: 1 }),
}
