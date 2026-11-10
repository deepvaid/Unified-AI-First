import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import TicketViewSwitcher from './TicketViewSwitcher.vue'
import { constrain } from '@/stories/decorators'

const meta = {
  title: 'Product/Service/TicketViewSwitcher',
  component: TicketViewSwitcher,
  tags: ['autodocs'],
  decorators: [constrain('compact')],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The ticket list's inbox × view picker. It reads the tickets and Service settings stores, so the
inboxes, saved views and counts are the seeded ones.

- **Search** finds a view or inbox across every group.
- **Inbox groups** are disclosures with the inbox's open count; which ones are open is remembered
  (\`mp.tickets.viewsExpanded.v1\`) and the active inbox always opens.
- Each group lists the built-in views, then the **custom views saved in that inbox**, each with
  its open count.
- **Spam** and **Trash** are pinned under the scroll, with counts.

### A11y
- Trigger: \`aria-haspopup="dialog"\` + \`aria-expanded\`; the panel is a labelled dialog and
  focus moves to the search on open; Escape returns focus to the trigger.
- Group heads are buttons with \`aria-expanded\`/\`aria-controls\`; the active view carries
  \`aria-current\`; result counts are announced politely while searching.
        `,
      },
    },
  },
  args: { inbox: 'all', view: 'All Tickets', currentAgent: 'Deepak Vaidya' },
} satisfies Meta<typeof TicketViewSwitcher>

export default meta
type Story = StoryObj<typeof meta>

/** Default — click the trigger; pick a view and the trigger follows. */
export const Default: Story = {
  render: (args) => ({
    components: { TicketViewSwitcher },
    setup: () => {
      const inbox = ref(args.inbox)
      const view = ref(args.view)
      return { args, inbox, view }
    },
    template: `
      <div class="d-flex">
        <TicketViewSwitcher :inbox="inbox" :view="view" :current-agent="args.currentAgent"
          @select="(i, v) => { inbox = i; view = v }" />
      </div>`,
  }),
}

/** Variants — the trigger for an inbox view, a custom view, Spam and Trash. */
export const Variants: Story = {
  render: () => ({
    components: { TicketViewSwitcher },
    setup: () => ({
      cases: [
        { inbox: 'all', view: 'All Tickets' },
        { inbox: 'orders', view: 'From the webstore' },
        { inbox: 'spam', view: 'All Tickets' },
        { inbox: 'trash', view: 'All Tickets' },
      ],
    }),
    template: `
      <div class="d-flex flex-column ga-3">
        <TicketViewSwitcher v-for="c in cases" :key="c.inbox + c.view" :inbox="c.inbox" :view="c.view" current-agent="Deepak Vaidya" />
      </div>`,
  }),
}
