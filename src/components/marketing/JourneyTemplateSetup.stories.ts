import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import { templateById } from '@/stores/journeyFlowData'
import { blankBindings, templateSetupById } from '@/stores/journeyTemplateSetup'
import JourneyTemplateSetup from './JourneyTemplateSetup.vue'

function story(id: string): Story {
  return {
    args: { template: templateById[id]!, meta: templateSetupById[id]! },
  }
}

const meta = {
  title: 'Product/Marketing/Journeys/JourneyTemplateSetup',
  component: JourneyTemplateSetup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
### Overview
Step 2 of the template wizard ("Setup for … journey"): prerequisites checklist (✓ / ✗ with a
"create it" action), sender defaults, the trigger binding that varies per template (lists · store ·
segment · product / product categories), one content pick per email, and — where the template has
one — the Lapsed Buyer filter segment and the Email Re-Engagement Do Not Mail list.

Option lists come from the sandbox mock stores. **Abandoned Cart** shows the missing-prerequisite
state: the sandbox has no connected webstore, so Finish stays blocked.
        `,
      },
    },
  },
  render: (args) => ({
    components: { JourneyTemplateSetup },
    setup() {
      const bindings = ref(blankBindings(args.meta.emails.length))
      const valid = ref(false)
      return { args, bindings, valid }
    },
    template: `
      <div style="max-width: 880px;">
        <JourneyTemplateSetup v-model="bindings" :template="args.template" :meta="args.meta" @update:valid="valid = $event" />
        <p class="text-caption text-medium-emphasis mt-4">finish enabled: {{ valid }}</p>
      </div>
    `,
  }),
} satisfies Meta<typeof JourneyTemplateSetup>

export default meta
type Story = StoryObj<typeof meta>

export const Welcome: Story = story('welcome')
export const AbandonedCartMissingStore: Story = story('abandoned-cart')
export const NurtureProducts: Story = story('nurture')
export const ReEngagementDoNotMail: Story = story('re-engagement')
export const LapsedBuyerFilter: Story = story('lapsed-buyer')
