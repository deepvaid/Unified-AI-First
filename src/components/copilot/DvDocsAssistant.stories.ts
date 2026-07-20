import type { Meta, StoryObj } from '@storybook/vue3'
import DvDocsAssistant from './DvDocsAssistant.vue'

const meta = {
  title: 'Copilot/DvDocsAssistant',
  component: DvDocsAssistant,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvDocsAssistant is the design-system Da Vinci: a self-contained Q&A surface embedded on the
in-app design-system docs page. It answers questions grounded in the design-system markdown
docs (FAQ crib sheet, operating model, audit, component inventory, handover) by retrieving the
most relevant excerpts per question and calling \`/api/gemini\` in \`design-system\` mode.

Unlike MpDaVinciBot it keeps a **local** conversation (the copilot store is a global
singleton) and skips the e-commerce intent classifier — so questions containing words like
"product" or "revenue" are answered from the docs, not hijacked into canned commerce intents.

## Offline behavior
Without a \`GEMINI_API_KEY\` (including here in Storybook, where \`/api/gemini\` does not
exist), the assistant degrades to the best-matching written FAQ answer, labeled "From the
FAQ" — try a starter chip to see it.

## Do's
- Embed on documentation/knowledge surfaces where answers must come from written docs
- Keep it beside the rendered docs so answers are verifiable one tab away

## Don'ts
- Don't use it for product/commerce questions — that is MpDaVinciBot's job
- Don't wire it to the global copilot store — its isolation is the point
        `,
      },
    },
  },
} satisfies Meta<typeof DvDocsAssistant>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { DvDocsAssistant },
    template: '<div style="max-width: 420px; height: 560px; display: flex;"><DvDocsAssistant /></div>',
  }),
}
