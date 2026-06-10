import type { Meta, StoryObj } from '@storybook/vue3'
import MpFloatingBulkBar from './MpFloatingBulkBar.vue'
import { ref } from 'vue'

const meta = {
  title: 'Feedback/MpFloatingBulkBar',
  component: MpFloatingBulkBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpFloatingBulkBar\` appears highly visible at the bottom of the screen when a user selects multiple items in a list or grid to perform bulk actions.

### 🟢 Do's
- **Do** show this bar *only* when \`count > 0\`. It should completely disappear when nothing is selected.
- **Do** populate the default slot with 2-4 clearly labeled \`v-btn(variant="outlined")\` actions.
- **Do** ensure your cancel/clear event properly deselects everything in the underlying UI.

### 🔴 Don'ts
- **Don't** use this component inside modals or drawers. It is designed only for the main page-level workspace.
- **Don't** provide more than 4 actions, which gets crowded on small screens. Use a dropdown menu if more bulk actions are required.
- **Don't** use solid/elevated buttons inside the bar; stick to outlined variants to contrast nicely against the solid bar surface.

### 💡 Best Practices
- **Destructive Actions:** Place dangerous bulk actions (like Delete) at the far right of your button list and color them red (\`color="error"\`).
- **Z-Index:** This component uses \`position: fixed\` and needs to float above page content. Ensure page footers don't obscure it.
        `,
      },
    },
  },
  argTypes: {
    count: { control: { type: 'number', min: 0, max: 100 } },
    total: { control: { type: 'number', min: 0, max: 100 } },
  },
} satisfies Meta<typeof MpFloatingBulkBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MpFloatingBulkBar },
    setup() {
      const count = ref(5)
      return { count }
    },
    template: `
      <div style="min-height: 200px; position: relative;">
        <div class="d-flex gap-2 mb-4">
          <v-btn size="small" @click="count++">Select more</v-btn>
          <v-btn size="small" @click="count = Math.max(0, count - 1)">Deselect one</v-btn>
        </div>
        <MpFloatingBulkBar :count="count" @clear="count = 0">
          <v-btn size="small" variant="outlined" prepend-icon="truck">Fulfill</v-btn>
          <v-btn size="small" variant="outlined" prepend-icon="download">Export</v-btn>
          <v-btn size="small" variant="outlined" color="error" prepend-icon="trash-2">Delete</v-btn>
        </MpFloatingBulkBar>
      </div>
    `,
  }),
  args: {} as any, // Fixes TS strict mode error
}

export const WithSelectAll: Story = {
  render: () => ({
    components: { MpFloatingBulkBar },
    setup() {
      const count = ref(5)
      const total = ref(42)
      return { count, total }
    },
    template: `
      <div style="min-height: 200px; position: relative;">
        <MpFloatingBulkBar :count="count" :total="total" @clear="count = 0" @select-all="count = total">
          <v-btn size="small" variant="outlined" prepend-icon="tag">Tag</v-btn>
          <v-btn size="small" variant="outlined" color="error" prepend-icon="trash-2">Delete</v-btn>
        </MpFloatingBulkBar>
      </div>
    `,
  }),
  args: {} as any, // Fixes TS strict mode error
}

export const WithThreeSelected: Story = {
  args: { count: 3 },
  render: (args) => ({
    components: { MpFloatingBulkBar },
    setup: () => ({ args }),
    template: `
      <div style="min-height: 200px; position: relative;">
        <MpFloatingBulkBar v-bind="args">
          <v-btn size="small" variant="outlined" prepend-icon="tag">Tag</v-btn>
          <v-btn size="small" variant="outlined" prepend-icon="mail">Email</v-btn>
        </MpFloatingBulkBar>
      </div>
    `,
  }),
}
