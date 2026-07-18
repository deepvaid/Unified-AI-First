import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpBuilderPreviewDialog from './MpBuilderPreviewDialog.vue'

const meta = {
  title: 'Overlays/MpBuilderPreviewDialog',
  component: MpBuilderPreviewDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Fullscreen preview overlay shared by Email, Landing, and Chatbot builders.
Use for merchant-facing preview — never leave a Preview button without wiring this (or equivalent).
`,
      },
    },
  },
} satisfies Meta<typeof MpBuilderPreviewDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MpBuilderPreviewDialog },
    setup() {
      const open = ref(true)
      return { open }
    },
    template: `
      <div>
        <v-btn class="text-none" @click="open = true">Open preview</v-btn>
        <MpBuilderPreviewDialog v-model="open" title="Preview — Welcome email">
          <v-card flat border rounded="lg" class="pa-8" style="max-width:600px;width:100%">
            <div class="text-h5 font-weight-bold mb-2">Welcome</div>
            <div class="text-body-2 text-medium-emphasis">Preview content goes here.</div>
          </v-card>
        </MpBuilderPreviewDialog>
      </div>
    `,
  }),
}
