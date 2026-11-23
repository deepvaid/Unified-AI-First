import { computed, nextTick, provide } from 'vue'
import type { Decorator, Meta, StoryObj } from '@storybook/vue3'
import { demoStoreFor } from '@/storefront/demoStores'
import StorefrontSignIn from './StorefrontSignIn.vue'
import { STOREFRONT } from './storefrontContext'
import type { StorefrontContext } from './storefrontContext'
import { storefrontFrame } from './storefrontStoryFixtures'

// The sign-in reads two things from the store it is on (StorefrontLayout provides them on
// the real pages): which store, and whether it is shown to prospects.
const northfold = demoStoreFor('northfold').homeChannel
const onNorthfold: Decorator = () => ({
  setup() {
    provide(STOREFRONT, { channel: computed(() => northfold), demo: computed(() => true) } as unknown as StorefrontContext)
  },
  template: '<story />',
})

const meta = {
  title: 'Product/Storefront/StorefrontSignIn',
  component: StorefrontSignIn,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
How a shopper signs in to a store: on the account page (\`/account\`), and on an order's page
(\`/account/orders/:number\`) when nobody is signed in yet. An email, then a 6-digit code; sign-in
is mocked, so any six digits work, and the store says so in plain words. A checkout signs its
shopper in on its own, so "Track your order" on the confirmation never asks.

### Behaviour
- **Email me a code** checks the address and moves the keyboard to the code field; **Sign in**
  checks the code. A mistake is said under the field, linked with \`aria-describedby\`, and the
  field takes focus.
- **Use another email** goes back to the first step.
- Emits \`signed-in\` with the address; \`focus()\` puts the keyboard on the field the form asks for.

Out of system on purpose (P4-8): it draws with the store's theme variables.
        `,
      },
    },
  },
  decorators: [onNorthfold, storefrontFrame('520px', '32px')],
  args: {},
} satisfies Meta<typeof StorefrontSignIn>

export default meta
type Story = StoryObj<typeof meta>

/** The account page, signed out. */
export const Default: Story = {}

/** An order's page opened from a link while signed out: it names the order. */
export const ForAnOrder: Story = {
  args: {
    title: 'Sign in to see your order',
    lead: 'Enter the email you used for order #20001. We’ll send you a 6-digit code to sign in, so there is no password to remember.',
  },
}

/** Types an address and asks for the code, as a shopper would. */
async function askForCode(root: HTMLElement, email: string): Promise<void> {
  const field = root.querySelector<HTMLInputElement>('#sf-acct-email')
  if (!field) return
  field.value = email
  field.dispatchEvent(new Event('input'))
  await nextTick()
  root.querySelector<HTMLButtonElement>('button[type="submit"]')?.click()
  await nextTick()
}

/** A mistyped address is said under the field, which keeps the keyboard. */
export const EmailNotValid: Story = {
  play: ({ canvasElement }) => askForCode(canvasElement, 'ava.brown@'),
}

/** The second step: the code was sent, and the store says any six digits work. */
export const CodeStep: Story = {
  play: ({ canvasElement }) => askForCode(canvasElement, 'ava.brown@example.com'),
}
