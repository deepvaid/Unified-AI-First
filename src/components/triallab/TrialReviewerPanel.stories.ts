import type { Meta, StoryObj } from '@storybook/vue3'
import TrialReviewerPanel from './TrialReviewerPanel.vue'
import { useTrialLabStore } from '@/stores/useTrialLab'
import { isolateStorage, overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Product/Trial Lab/TrialReviewerPanel',
  component: TrialReviewerPanel,
  tags: ['autodocs'],
  // The story seeds a run, which the store persists to localStorage: put it back on unmount.
  decorators: [isolateStorage],
  parameters: {
    docs: {
      // "Reset this run" navigates the router, so the story gets its own frame (and router).
      ...overlayDocs('720px').docs,
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
      if (!store.run(args.variant)?.account.signedUpAt) {
        store.ensureRun(args.variant)
        store.completeSignup(args.variant, 'alex.rivera@northwind.example')
      }
      return { args }
    },
    template: `<div style="height: 640px; width: 360px;"><TrialReviewerPanel v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof TrialReviewerPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
