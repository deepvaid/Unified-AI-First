import type { Meta, StoryObj } from '@storybook/vue3'
import SettingsPlaceholder from './SettingsPlaceholder.vue'

const meta = {
  title: 'Patterns/Settings/SettingsPlaceholder',
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
    title: {
      control: 'text',
      description: 'Name of the settings area that does not exist yet. Used both as the page heading and inside the coming-soon copy, so pass the area name alone (\\"Tax & rounding\\"), not a sentence.',
    },
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

/** With and without the supporting description line. */
export const Variants: Story = {
  render: () => ({
    components: { SettingsPlaceholder },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with description</div>
          <SettingsPlaceholder title="Webhooks" description="Send events to your own endpoints." />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">title only</div>
          <SettingsPlaceholder title="Webhooks" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * One state — "planned, not built yet". This is deliberately a left-aligned inline notice,
 * not a centred empty state: the navigation exists so deep links keep working, and the copy
 * is an aside rather than the page's whole content. If the surface exists but has no data,
 * that is `MpEmptyState`; if it failed to load, `MpErrorState`.
 */
export const States: Story = {
  render: () => ({
    components: { SettingsPlaceholder },
    template: `<SettingsPlaceholder title="Webhooks" description="Send events to your own endpoints." />`,
  }),
  args: {} as never,
}

export const WithoutDescription: Story = {
  args: { title: 'Audit Log', description: undefined },
}
