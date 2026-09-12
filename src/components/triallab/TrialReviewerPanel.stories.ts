import type { Meta, StoryObj } from '@storybook/vue3'
import TrialReviewerPanel from './TrialReviewerPanel.vue'
import { useTrialLabStore } from '@/stores/useTrialLab'

const meta = {
  title: 'Product/Trial Lab/TrialReviewerPanel',
  component: TrialReviewerPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The aside reviewers use to drive a Trial Lab run: variant summary, the **simulated inbox** (each
verification email exposes its link and 6-digit code), and "Reset this run". It sits on the sunken
surface with an uppercase eyebrow and a hairline so it reads as instrumentation rather than
customer UI. Store-bound — it reads and writes \`useTrialLabStore\` for the given variant.
        `,
      },
    },
  },
  args: { variant: 'b' },
  render: (args) => ({
    components: { TrialReviewerPanel },
    setup() {
      const store = useTrialLabStore()
      if (!store.run('b')?.account.signedUpAt) {
        store.ensureRun('b')
        store.completeSignup('b', 'alex.rivera@northwind.example')
      }
      return { args }
    },
    template: `<div style="height: 640px; width: 360px;"><TrialReviewerPanel v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof TrialReviewerPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
