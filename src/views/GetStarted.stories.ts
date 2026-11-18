import type { Meta, StoryObj } from '@storybook/vue3'
import { isolateStorage, overlayDocs } from '@/stories/decorators'
import { liquidskyDocs } from '@/stories/storyTemplate'
import { useAccountsStore } from '@/stores/useAccounts'
import { useOnboardingStore, type SetupTaskStatus } from '@/stores/useOnboarding'
import GetStarted from './GetStarted.vue'

/** The page on a seed account (no owner, so no welcome dialog) with the given tasks done. */
function page(done: string[]) {
  const statuses: Record<string, SetupTaskStatus> = Object.fromEntries(done.map((id) => [id, 'verified' as const]))
  return () => ({
    components: { GetStarted },
    setup() {
      useAccountsStore().switchTo('2000290')
      const onboarding = useOnboardingStore()
      onboarding.statuses = { ...statuses }
      onboarding.goal = null
      return {}
    },
    template: '<GetStarted />',
  })
}

const meta = {
  title: 'Product/Onboarding/Get Started',
  component: GetStarted,
  tags: ['autodocs', 'liquidsky'],
  decorators: [isolateStorage],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('product-onboarding-get-started') + `
### Overview
The Get started page: the merchant's setup checklist, from an empty account to the first sale.

- **Progress card** at the top (\`OnboardingProgressBanner\`): ring, count, caption, bar.
- **Task groups**, one bordered card each, under a heading with the group's own count (2/2).
  A finished group gets a party mark beside its title.
- **Task rows** divided by a hairline. A done row has a green check and a muted title; a to-do
  row has an empty circle, a full-strength title and a time chip (≈ 10 min); a skipped row has a
  muted minus. Every row ends in a chevron.
- **One task is open at a time.** The page opens on the next task to do. An open task shows what
  to do, why it matters, the button that goes there, and Mark as done / Skip for now.
- When every task is done or skipped, the groups give way to one closing card.

Progress is kept per account. The page lives at \`/accounts/:accountId/get-started\`.
        `,
      },
      ...overlayDocs('720px').docs,
    },
  },
} satisfies Meta<typeof GetStarted>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Six of sixteen tasks done: one finished group, two part way, and every task closed, so the
 * groups, the done and to-do rows and the time chips read as a list.
 */
export const Default: Story = {
  render: page(['sending-domain', 'link-tracking', 'inventory-location', 'first-product', 'store-branding', 'first-list']),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('.gs-step__row[aria-expanded="true"]')?.click()
  },
}

/** The page as it opens early on: the next task to do is expanded. */
export const TaskOpen: Story = {
  render: page(['sending-domain', 'first-product']),
}
