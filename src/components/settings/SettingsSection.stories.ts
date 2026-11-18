import type { Meta, StoryObj } from '@storybook/vue3'
import SettingsSection from './SettingsSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { constrain, measure } from '@/stories/decorators'

const meta = {
  title: 'Patterns/Settings/SettingsSection',
  component: SettingsSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`SettingsSection\` is the bordered content card used on every Settings page. It renders an
optional head (title + description + right-aligned \`#actions\` slot) above the default-slot body.
Settings pages stack several sections vertically with \`gap\` spacing; \`density="compact"\`
tightens the padding for short utility sections.
        `,
      },
    },
  },
  decorators: [constrain('section')],
  args: {
    title: 'Sender defaults',
    description: 'The from-name and reply-to address used when a campaign does not set its own.',
    density: 'default',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Section heading. Omit it for an unheaded section that is only a bordered body — the head row is skipped entirely when there is no title, description or `#actions` slot.',
    },
    description: { control: 'text' },
    density: {
      control: 'inline-radio',
      options: ['default', 'compact'],
      description: '`compact` tightens the section\'s inset. Use it when several sections stack inside one card and the standard spacing reads as loose.',
    },
  },
  render: (args) => ({
    components: { SettingsSection, MpFormGrid },
    setup: () => ({ args }),
    template: `
      <SettingsSection v-bind="args">
        <MpFormGrid :cols="2">
          <v-text-field label="From name" model-value="Maison Nord" />
          <v-text-field label="Reply-to address" model-value="hello@maisonnord.com" />
        </MpFormGrid>
      </SettingsSection>
    `,
  }),
} satisfies Meta<typeof SettingsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** With and without a header — the structural axis. */
export const Variants: Story = {
  render: () => ({
    components: { SettingsSection },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with title + description</div>
          <SettingsSection title="Sender identity" description="The name and address your campaigns send from.">
            <div class="text-body-2">Section body</div>
          </SettingsSection>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">body only — no header</div>
          <SettingsSection><div class="text-body-2">Section body</div></SettingsSection>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** The density ramp. */
export const Density: Story = {
  render: () => ({
    components: { SettingsSection },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">default</div>
          <SettingsSection title="Sender identity" description="The name and address your campaigns send from.">
            <div class="text-body-2">Section body</div>
          </SettingsSection>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">compact</div>
          <SettingsSection density="compact" title="Sender identity" description="The name and address your campaigns send from.">
            <div class="text-body-2">Section body</div>
          </SettingsSection>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** With and without header actions, and with a form stack using the field.groupGap token. */
export const States: Story = {
  render: () => ({
    components: { SettingsSection, MpFormGrid },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">no actions</div>
          <SettingsSection title="Sender identity"><div class="text-body-2">Section body</div></SettingsSection>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with actions</div>
          <SettingsSection title="Sender identity">
            <template #actions><v-btn size="small" variant="text" class="text-none">Edit</v-btn></template>
            <div class="text-body-2">Section body</div>
          </SettingsSection>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">form stack — spacing from component.field.groupGap</div>
          <SettingsSection title="Sender identity" description="Fields sit on one shared rhythm.">
            <MpFormGrid>
              <v-text-field label="From name" model-value="Maropost" />
              <v-text-field label="From address" model-value="hello@maropost.com" hint="Must be a verified domain." persistent-hint />
            </MpFormGrid>
          </SettingsSection>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

export const WithActions: Story = {
  args: {
    title: 'API keys',
    description: 'Keys grant full access to this account over the REST API.',
  },
  render: (args) => ({
    components: { SettingsSection },
    setup: () => ({ args }),
    template: `
      <SettingsSection v-bind="args">
        <template #actions>
          <v-btn size="small" variant="outlined" prepend-icon="plus">Create key</v-btn>
        </template>
        <div class="d-flex align-center justify-space-between py-2">
          <div>
            <div class="text-body-2 font-weight-medium">Production key</div>
            <div class="text-caption text-medium-emphasis">mk_live_••••••••4f2a · created May 12, 2026</div>
          </div>
          <v-btn size="small" variant="text" icon="copy" aria-label="Copy key" />
        </div>
      </SettingsSection>
    `,
  }),
}

export const Compact: Story = {
  args: {
    title: 'Time zone',
    description: 'Used for scheduling sends and report date ranges.',
    density: 'compact',
  },
  render: (args) => ({
    components: { SettingsSection },
    setup: () => ({ args, measure }),
    template: `
      <SettingsSection v-bind="args">
        <v-select label="Time zone" :items="['(GMT-05:00) Eastern Time', '(GMT-08:00) Pacific Time']"
          model-value="(GMT-05:00) Eastern Time" :style="{ maxWidth: measure.narrow }" />
      </SettingsSection>
    `,
  }),
}

export const BodyOnly: Story = {
  args: { title: undefined, description: undefined },
  render: () => ({
    components: { SettingsSection },
    template: `
      <SettingsSection>
        <div class="d-flex align-start gap-3">
          <v-icon size="20" color="primary" class="mt-1">shield-check</v-icon>
          <div>
            <div class="text-body-2 font-weight-medium">Two-factor authentication is on</div>
            <div class="text-caption text-medium-emphasis">All users in this account sign in with an authenticator app.</div>
          </div>
        </div>
      </SettingsSection>
    `,
  }),
}
