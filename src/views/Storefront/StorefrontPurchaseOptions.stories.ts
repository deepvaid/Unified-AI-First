import { computed, provide, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { fromDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { formatStorePrice } from '@/storefront/price'
import { VITAHEAL_CHANNEL_ID, VITAHEAL_PLANS } from '@/storefront/vitahealDemo'
import { defaultOptionId, planFromOptions, plansForProduct, purchaseOptions, roundForDisplay } from '@/subscriptions/plans'
import type { SubscriptionPlan } from '@/subscriptions/plans'
import StorefrontPurchaseOptions from './StorefrontPurchaseOptions.vue'
import { STOREFRONT } from './storefrontContext'
import type { StorefrontContext } from './storefrontContext'
import { storefrontFrame } from './storefrontStoryFixtures'

// A plan sold by delivery options, as Commerce › Subscriptions › Plans saves it.
const SUBSCRIBE_AND_SAVE: SubscriptionPlan = {
  ...planFromOptions({
    name: 'Standard plan',
    shopperLabel: 'Subscribe and save',
    status: 'Active',
    options: [
      { id: 'o1', intervalCount: 1, intervalUnit: 'month', discountPct: 20, isDefault: true },
      { id: 'o2', intervalCount: 2, intervalUnit: 'month', discountPct: 20, isDefault: false },
      { id: 'o3', intervalCount: 3, intervalUnit: 'month', discountPct: 30, isDefault: false },
    ],
    productIds: [1],
  }),
  id: 'plan-1',
  channelId: 'store',
}

const byOptions = purchaseOptions(fromDecimal('29.00', 'USD'), plansForProduct([SUBSCRIBE_AND_SAVE], 'store', 1))
// Vitaheal's plans of one fixed delivery, on its Electrolytes at 279 kr.
const fixed = purchaseOptions(fromDecimal('279.00', 'SEK'), plansForProduct(VITAHEAL_PLANS, VITAHEAL_CHANNEL_ID, 2005))
const dollars = (amount: Money) => formatStorePrice(amount, 'en-US')
const kronor = (amount: Money) => formatStorePrice(roundForDisplay(amount), 'sv-SE')

const POLICY = { policyText: 'Pause or cancel any time.', termsHref: 'https://example.com/subscription-terms' }

const meta = {
  title: 'Product/Storefront/StorefrontPurchaseOptions',
  component: StorefrontPurchaseOptions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The ways to buy a product, on its page. Which plans a product has is set in Commerce ›
Subscriptions › Plans; how they are laid out is the store theme's **Purchase options** block
(theme builder › Product template › Product detail).

### Two kinds of plan
- **A plan with delivery options** ("Subscribe and save"): buying once reads first, then the plan's
  label with the most it saves, and one row per frequency, each with its own discount.
- **A plan of one fixed delivery** ("3-month supply"): a card of its own before buying once, with
  what a delivery holds, a free-shipping badge and, once chosen, its benefits.

### Behaviour
- **Real radio buttons** in one \`fieldset\`: arrow keys move between the rows.
- \`variant\`: \`cards\` (boxed rows), \`radios\` (the same rows without boxes) or \`dropdown\` (one
  native select, the saving in each row's words).
- \`policyText\`, \`termsHref\` and \`accountHref\` make the line under the options. None of them, no line.
- Which option is chosen first is the page's call (\`defaultOptionId\`): buying once, unless the
  theme's block puts the subscription first.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [
    storefrontFrame(),
    () => ({
      setup() {
        provide(STOREFRONT, { link: (href: string) => href } as unknown as StorefrontContext)
      },
      template: '<story />',
    }),
  ],
  args: { options: byOptions, modelValue: defaultOptionId(byOptions), formatMoney: dollars, ...POLICY },
  render: (args) => ({
    components: { StorefrontPurchaseOptions },
    setup() {
      const chosen = ref(args.modelValue)
      const bound = computed(() => ({ ...args, modelValue: chosen.value }))
      return { bound, chosen }
    },
    template: '<StorefrontPurchaseOptions v-bind="bound" @update:model-value="chosen = $event" />',
  }),
} satisfies Meta<typeof StorefrontPurchaseOptions>

export default meta
type Story = StoryObj<typeof meta>

/** A plan with delivery options as cards: buying once is chosen until the shopper picks a frequency. */
export const Default: Story = {}

/** The theme puts the subscription first and asks for plain radio rows. */
export const RadioButtons: Story = {
  args: { variant: 'radios', modelValue: defaultOptionId(byOptions, true) },
}

/** One native select: the saving is in each row's words, the plan's label is the group's name. */
export const Dropdown: Story = {
  args: { variant: 'dropdown' },
}

/** Vitaheal's plans of one fixed delivery, with no line under them: as the store shows them without the block. */
export const FixedDeliveryPlans: Story = {
  args: { options: fixed, modelValue: defaultOptionId(fixed), formatMoney: kronor, policyText: '', termsHref: '' },
}
