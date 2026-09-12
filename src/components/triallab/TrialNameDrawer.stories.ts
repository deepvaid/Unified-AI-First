import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import TrialNameDrawer from './TrialNameDrawer.vue'

const meta = {
  title: 'Product/Trial Lab/TrialNameDrawer',
  component: TrialNameDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The contextual way to supply a name after onboarding — variants B and D never ask up front. One
field, Save / Cancel, no reminder afterwards. Saving an empty field removes the name again and the
display falls back to the neutral label. Composes \`MpFormDrawer\` at \`size="sm"\`.

\`kind="person"\` edits the user's own name; \`kind="workspace"\` edits the workspace label — a
recognisable name for the account switcher, never the legal company name.
        `,
      },
    },
  },
  args: {
    kind: 'workspace',
    initial: null,
  },
  render: (args) => ({
    components: { TrialNameDrawer },
    setup() {
      const open = ref(true)
      const saved = ref<string | null>(args.initial)
      return { args, open, saved }
    },
    template: `
      <div class="pa-4">
        <v-btn class="text-none" variant="outlined" @click="open = true">Open drawer</v-btn>
        <p class="mt-3 text-body-2">Saved value: <strong>{{ saved ?? '— (fallback label)' }}</strong></p>
        <TrialNameDrawer v-model="open" v-bind="args" @save="saved = $event" />
      </div>
    `,
  }),
} satisfies Meta<typeof TrialNameDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Workspace: Story = {}

export const Person: Story = { args: { kind: 'person' } }

export const EditingExisting: Story = { args: { kind: 'workspace', initial: 'Northwind Trading' } }
