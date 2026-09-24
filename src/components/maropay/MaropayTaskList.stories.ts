import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayTaskList from './MaropayTaskList.vue'
import { STORY_NOW, storyState, underReviewState } from './storyFixtures'

const tasks = [
  ...storyState('m03').tasks,
  ...storyState('m09').tasks,
  ...storyState('m11').tasks,
  ...storyState('m15').tasks,
].map((task) => ({ task, to: '/accounts/2000290/maropay' }))

const meta = {
  title: 'Product/Maropay/MaropayTaskList',
  component: MaropayTaskList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Open Maropay tasks — verification, payout, dispute and method reviews — each row linking to where it
gets fixed. A deadline reads "Due …" (or "Overdue since …"); a task waiting on our payments partner
reads "Waiting on review", so waiting is never mistaken for action required. The responsible role is
named on every row. Composes \`MpListRow\` + \`MpSectionHeader\`.
        `,
      },
    },
  },
  args: { items: tasks, now: STORY_NOW },
} satisfies Meta<typeof MaropayTaskList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  args: {
    title: 'Waiting on review',
    items: underReviewState().tasks.map((task) => ({ task, to: '/accounts/2000290/maropay' })),
  },
}
