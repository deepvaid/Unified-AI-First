import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import { templateById } from '@/stores/journeyFlowData'
import JourneyTemplateDialog from './JourneyTemplateDialog.vue'

const meta = {
  title: 'Product/Marketing/Journeys/JourneyTemplateDialog',
  component: JourneyTemplateDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The template detail dialog of Journey Selection (\`/journeys/new\`): the template's live flow
preview (\`JourneyMiniPreview\` replaces production's static PNG), its long description from
\`journeyTemplateSetup.ts\`, and **Create**, which hands the template id to the wizard. Composes
\`MpDialog size="lg"\`.
        `,
      },
    },
  },
  argTypes: {
    template: { control: 'select', options: ['welcome', 'abandoned-cart', 'nurture', 'advocacy', 're-engagement', 'lapsed-buyer'], mapping: templateById },
  },
  args: { template: templateById['welcome'] },
  render: (args) => ({
    components: { JourneyTemplateDialog },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <div>
        <v-btn color="primary" variant="flat" class="text-none" @click="open = true">Open template dialog</v-btn>
        <JourneyTemplateDialog v-model="open" :template="args.template" @create="open = false" />
      </div>
    `,
  }),
} satisfies Meta<typeof JourneyTemplateDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Welcome: Story = {}
export const LapsedBuyer: Story = { args: { template: templateById['lapsed-buyer'] } }
