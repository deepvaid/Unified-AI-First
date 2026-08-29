import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import CampaignContentEditor from './CampaignContentEditor.vue'

const meta = {
  title: 'Product/Marketing/Campaigns/CampaignContentEditor',
  component: CampaignContentEditor,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`CampaignContentEditor\` is the sandbox stand-in for the platform's embedded third-party
drag-and-drop email builder ("Edit Content — Editor Type: DnD"), reached from the campaign
wizard's Content step. It is a **visual mock** (see \`docs/rebuild/new-campaign/GAPS.md\`):
the block palette and canvas do not edit, and **Device previews → Generate previews** simulates
the third-party inbox-preview service with desktop / tablet / mobile / dark-mode frames.

Composes \`MpDialog\` (fullscreen, flush) and \`CampaignEmailPreview\`.
        `,
      },
    },
  },
} satisfies Meta<typeof CampaignContentEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { CampaignContentEditor },
    setup() {
      const open = ref(false)
      return { open }
    },
    template: `
      <div>
        <v-btn color="primary" class="text-none" @click="open = true">Open content editor</v-btn>
        <CampaignContentEditor v-model="open" content-name="Email Content for abandoned_cart" />
      </div>
    `,
  }),
}
