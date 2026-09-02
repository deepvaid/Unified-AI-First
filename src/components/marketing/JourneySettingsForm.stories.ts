import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import JourneySettingsForm, { type JourneySettingsValue } from './JourneySettingsForm.vue'

const meta = {
  title: 'Product/Marketing/Journeys/JourneySettingsForm',
  component: JourneySettingsForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The "Journey settings" form shared by the from-scratch page (\`CreateJourneyScratch\`) and step 1
of the template wizard (\`JourneyTemplateWizard\`), mirroring production's \`NewJourneyScratch\`:
journey name (required, no emoji, unique), optional end date + 15-minute end-time slots (past
slots disabled for today; picking one half fills the other), and the Enable / Retrigger switches.

Validity streams out through \`update:valid\`; \`validate()\` forces the messages on an untouched
form. Duplicate names error inline instead of production's vanishing toast.
        `,
      },
    },
  },
  render: (args) => ({
    components: { JourneySettingsForm },
    setup() {
      const value = ref<JourneySettingsValue>({ name: '', endDate: '', endTime: '', enabled: false, retrigger: false })
      const valid = ref(false)
      return { args, value, valid }
    },
    template: `
      <div style="max-width: 640px;">
        <JourneySettingsForm v-model="value" :existing-names="args.existingNames" @update:valid="valid = $event" />
        <p class="text-caption text-medium-emphasis mt-4">valid: {{ valid }}</p>
      </div>
    `,
  }),
} satisfies Meta<typeof JourneySettingsForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { existingNames: ['Welcome Series', 'Win-Back'] },
}
