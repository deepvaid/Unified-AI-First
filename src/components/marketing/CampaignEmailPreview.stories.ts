import type { Meta, StoryObj } from '@storybook/vue3'
import CampaignEmailPreview from './CampaignEmailPreview.vue'

const meta = {
  title: 'Product/Marketing/Campaigns/CampaignEmailPreview',
  component: CampaignEmailPreview,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`CampaignEmailPreview\` is the mock rendering of a campaign's email content, standing in for
the HTML the real platform renders from the selected Email Content record. Merge tags are shown
verbatim (\`{{contact.first_name}}\`, \`{{campaign.unsubscribe_link}}\`, …) exactly as UAT's
inline campaign preview does.

Used by the Create Campaign wizard (Content and Review steps) and by
\`CampaignContentEditor\`'s device-preview frames.
        `,
      },
    },
  },
  args: {
    contentName: 'Email Content for abandoned_cart',
    showPreviewLink: false,
    dark: false,
  },
} satisfies Meta<typeof CampaignEmailPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithPreviewLink: Story = {
  args: { showPreviewLink: true },
}

export const DarkEmail: Story = {
  name: 'Dark (device preview frame)',
  args: { dark: true },
  render: (args) => ({
    components: { CampaignEmailPreview },
    setup: () => ({ args }),
    template: `
      <div style="background: var(--ink-panel-bg); padding: var(--mp-space-24); border-radius: var(--mp-radius-12);">
        <CampaignEmailPreview v-bind="args" />
      </div>
    `,
  }),
}
