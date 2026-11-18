import { computed } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import WelcomeDialog from './WelcomeDialog.vue'
import { useAccountsStore, type Account } from '@/stores/useAccounts'
import { isolateStorage, overlayDocs } from '@/stories/decorators'

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
  // The accounts store and the profile name persist to localStorage: put it back on unmount.
  decorators: [isolateStorage],
  parameters: {
    docs: {
      // Both stories open the dialog on mount, so each gets its own frame on the docs page.
      ...overlayDocs('560px').docs,
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
  render: (args) => ({
    components: { WelcomeDialog },
    setup() {
      // Continue and Skip write to the account in the store, and the dialog closes when that
      // account is marked welcomed. So the story adds the account to the store (fresh, in case
      // a stored copy was already welcomed) and hands the dialog the store's copy.
      const accounts = useAccountsStore()
      accounts.removeAccount(args.account.id)
      accounts.addAccount(args.account)
      const stored = computed(() => accounts.accounts.find(a => a.id === args.account.id) ?? args.account)
      const reopen = () => accounts.updateAccount(args.account.id, { owner: args.account.owner })
      return { stored, reopen }
    },
    template: `
      <div>
        <v-btn variant="outlined" prepend-icon="sparkles" @click="reopen">Show the welcome again</v-btn>
        <WelcomeDialog :account="stored" />
      </div>
    `,
  }),
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
