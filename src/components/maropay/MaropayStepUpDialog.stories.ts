import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayStepUpDialog from './MaropayStepUpDialog.vue'
import { overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Product/Maropay/MaropayStepUpDialog',
  component: MaropayStepUpDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      ...overlayDocs('520px').docs,
      description: {
        component: `
### Overview
A fresh "is it really you?" check before bank details change (plan §3G). Composes \`MpDialog\` at
\`sm\`, persistent. Opening it requests a challenge from the Maropay store; a correct code leaves a
short-lived token in memory (never saved) that \`updateBankAccount\` needs. Three wrong codes end the
attempt. The prototype prints its code, **246810**, because there is no authenticator to read.

**Use when:** before changing where payouts go.

**Don't use when:** confirming an ordinary action — that's \`MpConfirmDialog\`.

### A11y
- **Provides:** the code field is labelled through \`MpFormField\`; a wrong code replaces the hint with
  the error, which is announced.
        `,
      },
    },
  },
  args: {
    modelValue: true,
    purpose: 'Changing where payouts go needs a fresh check.',
  },
  // Storybook does not write `update:modelValue` back into args, so the story holds the open state.
  render: (args) => ({
    components: { MaropayStepUpDialog },
    setup() {
      const open = ref(args.modelValue)
      return { args, open }
    },
    template: `
      <div>
        <v-btn variant="outlined" @click="open = true">Reopen</v-btn>
        <MaropayStepUpDialog v-bind="args" v-model="open" />
      </div>
    `,
  }),
} satisfies Meta<typeof MaropayStepUpDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
