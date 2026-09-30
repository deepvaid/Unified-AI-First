import type { Meta, StoryObj } from '@storybook/vue3'
import DvInsightCard from './DvInsightCard.vue'
import { constrain, measure } from '@/stories/decorators'
import { grid } from '@/stories/storyTemplate'

const INFO = {
  icon: 'lightbulb',
  headline: 'Optimize your send time',
  description: 'Your audience typically opens emails between 10 AM and 2 PM. Consider scheduling this campaign for Tuesday at 11 AM.',
  actionLabel: 'Apply recommendation',
  severity: 'info',
} as const

const WARNING = {
  icon: 'triangle-alert',
  headline: 'Low audience engagement',
  description: 'Your last 3 campaigns had below-average open rates (18% vs 24%). Review your subject lines and consider A/B testing.',
  actionLabel: 'View analytics',
  severity: 'warning',
} as const

const SUCCESS = {
  icon: 'circle-check',
  headline: 'Campaign performing well',
  description: 'Your spring sale campaign exceeded projections with a 34% open rate and a 12% click-through rate.',
  actionLabel: 'View details',
  severity: 'success',
} as const

const ERROR = {
  icon: 'circle-alert',
  headline: 'Campaign launch failed',
  description: 'Your email campaign could not be sent because sender verification is missing. Complete domain verification in Settings.',
  actionLabel: 'Fix now',
  severity: 'error',
} as const

const meta = {
  title: 'Product/Da Vinci/DvInsightCard',
  component: DvInsightCard,
  tags: ['autodocs'],
  args: INFO,
  argTypes: {
    icon: { control: 'text', description: 'Lucide icon name. Defaults to a lightbulb.' },
    headline: { control: 'text', description: 'The insight in one line.' },
    description: { control: 'textarea', description: 'What it means and what to do about it.' },
    actionLabel: { control: 'text', description: 'Label of the call-to-action; omit for a card without one.' },
    routeName: { control: 'text', description: 'Where the host sends the merchant when the action is pressed (route name, resolved with the current account). Not rendered.' },
    severity: { control: 'select', options: ['info', 'warning', 'success', 'error'], description: 'Sets the tint and its paired ink. Defaults to info.' },
    onAction: { action: 'action', description: 'The call-to-action was pressed.' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
An insight, recommendation or alert from Da Vinci — an \`MpAlert\` (soft fill on the semantic container
pairs, ink paired with it) with an action button. It doesn't announce itself: inside the chat transcript,
which is already a live log, the message that carries it is what gets read out.

## Do's
- Match severity to the impact: error for something broken, warning for a risk, success for a win, info for a suggestion
- Give one clear next step in the action

## Don'ts
- Don't mix several unrelated insights in one card
- Don't use it for a system failure — that is an \`MpErrorState\` or \`MpBanner\`
`,
      },
    },
  },
  decorators: [constrain('drawer')],
  render: (args) => ({
    components: { DvInsightCard },
    setup: () => ({ args }),
    template: '<DvInsightCard v-bind="args" />',
  }),
} satisfies Meta<typeof DvInsightCard>

export default meta
type Story = StoryObj<typeof meta>

/** An informational suggestion with an action. */
export const Default: Story = {}

/** The four severities — each a container fill with its own paired ink. */
export const Variants: Story = {
  decorators: [constrain('dialog')],
  render: grid({ DvInsightCard }, [
    { label: 'Info', args: INFO },
    { label: 'Warning', args: WARNING },
    { label: 'Success', args: SUCCESS },
    { label: 'Error', args: ERROR },
  ], { columns: 'repeat(auto-fit, minmax(300px, 1fr))' }),
}

/** There is no size prop: the card fills its host — the 480px drawer body, or a narrow panel. */
export const Sizes: Story = {
  decorators: [constrain('dialog')],
  render: (args) => ({
    components: { DvInsightCard },
    setup: () => ({ args, narrow: measure.narrow, drawer: measure.drawer }),
    template: `
      <div style="display: flex; gap: var(--mp-space-24); align-items: flex-start; flex-wrap: wrap;">
        <div :style="{ width: narrow }"><DvInsightCard v-bind="args" /></div>
        <div :style="{ width: drawer }"><DvInsightCard v-bind="args" /></div>
      </div>
    `,
  }),
}

/** With an action, without one, and the default lightbulb when no icon is given. */
export const States: Story = {
  decorators: [constrain('dialog')],
  render: grid({ DvInsightCard }, [
    { label: 'With an action', args: INFO },
    { label: 'No action', args: { ...INFO, actionLabel: undefined } },
    { label: 'Default icon', args: { ...INFO, icon: undefined, actionLabel: undefined } },
  ], { columns: 'repeat(auto-fit, minmax(300px, 1fr))' }),
}
