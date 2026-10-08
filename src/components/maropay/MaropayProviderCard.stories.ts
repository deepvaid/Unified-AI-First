import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayProviderCard from './MaropayProviderCard.vue'
import { stack } from '@/stories/storyTemplate'
import { STORY_NOW, storyState, underReviewState } from './storyFixtures'
import { deriveMaropayCard } from '@/maropay/providerCard'
import type { MaropayAccountState } from '@/maropay/model'
import { deactivateStore, defaultFailures } from '@/services/maropay/mockAdapter'

const ATLAS = 'retest-sales-notification'
const BETA = 'beta-sales-channel'
const FACTS = {
  [ATLAS]: { name: 'Atlas Outfitters', type: 'web_store' as const, provider: 'maropost_store_builder', status: 'connected' },
  [BETA]: { name: 'Beta Sales Channel', type: 'web_store' as const, provider: 'maropost_store_builder', status: 'needs_setup' },
}

function model(state: MaropayAccountState, channelId: string = ATLAS) {
  return deriveMaropayCard({
    state, channelId, channel: FACTS[channelId as keyof typeof FACTS] ?? null, now: STORY_NOW,
    can: () => true, factsFor: (id) => FACTS[id as keyof typeof FACTS] ?? null,
  })
}

function stopped() {
  const state = storyState('m14')
  deactivateStore(state, ATLAS, { now: STORY_NOW, actor: { role: 'owner', assignedChannelIds: null }, failures: defaultFailures() })
  return state
}

/** Stories have no account route; every target lands on the Maropay overview path. */
const routeFor = () => '/accounts/2000290/maropay'

const meta = {
  title: 'Product/Maropay/MaropayProviderCard',
  component: MaropayProviderCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The Maropay card at the top of a store's Payments page — the one place Maropay is sold, the way
Shopify sells Shopify Payments above a merchant's other providers. It is presentational: \`deriveMaropayCard\`
(\`src/maropay/providerCard.ts\`) turns the account's and the store's state into one of twelve card states,
each with its headline, facts, marks, actions and the quiet "Recommended" eyebrow (pre-live only). Account-level
states read the overview's own instruction, so the card never grows a second state machine.

**Use when:** the store's Payments page (\`StorePayments\`).

**Don't use when:** you need Maropay's settings for the store — that's the manage page (\`StorePaymentsMaropay\`),
which this card's **Manage** opens.

### A11y
- **Provides:** a real heading (\`headingLevel\`), the readiness chip with its icon, a named list of accepted
  method marks, disabled primaries that keep their tooltip reason.
- **Consumer must:** resolve routes through \`routeFor\` and handle \`activate\`, \`link\`, \`stop\` and
  \`see-providers\` (which should move focus to the providers list).
        `,
      },
    },
  },
  args: { model: model(storyState('m01')), routeFor },
} satisfies Meta<typeof MaropayProviderCard>

export default meta
type Story = StoryObj<typeof meta>

/** The sell: a merchant who has never opened Maropay. */
export const Default: Story = {}

export const States: Story = {
  render: stack({ MaropayProviderCard }, [
    { label: 'Not set up (M01)', args: { model: model(storyState('m01')), routeFor } },
    { label: 'Setup in progress (M02)', args: { model: model(storyState('m02')), routeFor } },
    { label: 'Action required (M03)', args: { model: model(storyState('m03')), routeFor } },
    { label: 'Under review', args: { model: model(underReviewState()), routeFor } },
    { label: 'Declined (M04)', args: { model: model(storyState('m04')), routeFor } },
    { label: 'Unlinked store (M06, second store)', args: { model: model(storyState('m06'), BETA), routeFor } },
    { label: 'Needs setup (M06)', args: { model: model(storyState('m06')), routeFor } },
    { label: 'Ready to activate (M15)', args: { model: model(storyState('m15')), routeFor } },
    { label: 'Live (M10)', args: { model: model(storyState('m10')), routeFor } },
    { label: 'Live, payouts need attention (M08)', args: { model: model(storyState('m08')), routeFor } },
    { label: 'Stopped (M14 after stopping)', args: { model: model(stopped()), routeFor } },
  ]),
}
