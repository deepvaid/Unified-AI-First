import type { Meta, StoryObj } from '@storybook/vue3'
import WelcomeDialog from './WelcomeDialog.vue'
import type { Account } from '@/stores/useAccounts'

const account: Account = {
  id: '2000304',
  name: 'Trial workspace',
  initials: 'TR',
  color: 'primary',
  subscriptions: ['commerce', 'marketing', 'analytics', 'service', 'davinci'],
  owner: { name: null, email: 'maya@harbour-lights.example', role: 'Owner', welcomedAt: null },
}

const meta = {
  title: 'Product/Onboarding/WelcomeDialog',
  component: WelcomeDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The first thing a self-created trial account sees inside the real app, mounted on **Get started**.
Two optional fields — the person's name and a workspace label suggested from the business email's
domain (\`maya@harbour-lights.example\` → "Harbour Lights"). **Continue** writes to the real account
(AppBar identity, account switcher, Da Vinci greeting update immediately); **Skip for now** keeps the
neutral fallbacks. Both mark the account as welcomed, so the dialog never asks twice.

Composes \`MpDialog size="sm" persistent\` — Esc and the scrim do not dismiss it; the two buttons do.
Seed accounts have no \`owner\`, so the dialog never opens for them.
        `,
      },
    },
  },
  args: { account },
} satisfies Meta<typeof WelcomeDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The classic signup form already supplied both values — Continue is a one-click confirm. */
export const Prefilled: Story = {
  args: {
    account: { ...account, name: 'Harbour Lights', initials: 'HL', owner: { ...account.owner!, name: 'Maya Chen' } },
  },
}
