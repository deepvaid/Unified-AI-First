import type { Meta, StoryObj } from '@storybook/vue3'
import MpPageHeader from '@/components/MpPageHeader.vue'
import { constrain } from '@/stories/decorators'
import { liquidskyDocs, stack } from '@/stories/storyTemplate'
import OnboardingProgressBanner from './OnboardingProgressBanner.vue'

const meta = {
  title: 'Product/Onboarding/OnboardingProgressBanner',
  component: OnboardingProgressBanner,
  tags: ['autodocs', 'liquidsky'],
  decorators: [constrain('wide')],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('product-onboarding-onboardingprogressbanner') + `
### Overview
The setup progress card: a ring with the percentage, a title, a caption and a bar. It has two
places.

- **On Get started** it opens the page. The title is the count ("6 of 16 tasks complete").
- **On a task page** it sits under the page header while the merchant does one setup task. Pass a
  \`title\` naming the task; the count moves to its own line above the bar, and \`actionLabel\` +
  \`to\` add the link back to the full list at the end of the row.

The percentage is worked out from \`done\` and \`total\`. On a phone the link drops under the text.

### Usage
\`\`\`html
<OnboardingProgressBanner
  :done="7"
  :total="16"
  title="Onboarding: Set up your sending domain"
  caption="This task is part of Connect with your customers."
  action-label="View all tasks"
  :to="{ name: 'GetStarted', params: { accountId } }"
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    done: { control: { type: 'number', min: 0 }, description: 'Setup tasks completed.' },
    total: { control: { type: 'number', min: 0 }, description: 'Setup tasks in the plan.' },
    title: { control: 'text', description: 'Replaces the count as the title. The count then gets its own line above the bar.' },
    caption: { control: 'text', description: 'Muted line under the title.' },
    hideCount: { control: 'boolean', description: 'Drops the count line under a custom title.' },
    actionLabel: { control: 'text', description: 'Link at the end of the row. Needs `to`.' },
    to: { control: 'object', description: 'Route the link opens.' },
  },
  args: {
    done: 6,
    total: 16,
    caption: 'Most merchants finish setup in under an hour.',
  },
} satisfies Meta<typeof OnboardingProgressBanner>

export default meta
type Story = StoryObj<typeof meta>

/** The form that opens the Get started page: the count is the title. */
export const Default: Story = {}

/** On one setup task's page, under the page header: the task is the title and the link goes back to the list. */
export const OnTaskPage: Story = {
  args: {
    done: 7,
    title: 'Onboarding: Set up your sending domain',
    caption: 'This task is part of Connect with your customers.',
    actionLabel: 'View all tasks',
    to: { name: 'GetStarted', params: { accountId: '2000290' } },
  },
  render: (args) => ({
    components: { MpPageHeader, OnboardingProgressBanner },
    setup: () => ({ args }),
    template: `
      <div>
        <MpPageHeader
          eyebrow="Settings · Sending domains · New domain"
          title="New sending domain"
          subtitle="Verify the domain your campaigns are sent from."
        />
        <OnboardingProgressBanner v-bind="args" class="mt-4" />
      </div>
    `,
  }),
}

/** Not started, part way and complete. A complete plan says so in the title and drops the count line. */
export const States: Story = {
  render: stack({ OnboardingProgressBanner }, [
    { label: 'Not started', args: { done: 0 } },
    { label: 'Part way', args: { done: 6 } },
    {
      label: 'Complete',
      args: {
        done: 16,
        title: 'Setup complete — nicely done.',
        caption: 'Your store, email, audience, and support desk are ready for customers.',
        hideCount: true,
      },
    },
  ]),
}
