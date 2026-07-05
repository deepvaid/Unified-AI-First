import type { Meta, StoryObj } from '@storybook/vue3'
import SettingsPlaceholder from './SettingsPlaceholder.vue'

const meta = {
  title: 'Settings/SettingsPlaceholder',
  component: SettingsPlaceholder,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`SettingsPlaceholder\` is the "coming soon" page body used by not-yet-built Settings routes
(16 of them at last count). It renders a compact \`MpPageHeader\` plus a \`SettingsSection\`
with a fixed explanation, so future deep links resolve instead of 404ing.
        `,
      },
    },
  },
  args: {
    title: 'DNS Setup',
    description: 'Verify sending domains and manage DKIM, SPF, and tracking CNAMEs.',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
  render: (args) => ({
    components: { SettingsPlaceholder },
    setup: () => ({ args }),
    template: `
      <div style="max-width: 880px;">
        <SettingsPlaceholder v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof SettingsPlaceholder>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithoutDescription: Story = {
  args: { title: 'Audit Log', description: undefined },
}
