import type { Meta, StoryObj } from '@storybook/vue3'
import { reactive } from 'vue'
import TicketNote from './TicketNote.vue'
import { surfaceFrame } from '@/stories/decorators'
import type { TicketMessage } from '@/stores/useTickets'

const note = (patch: Partial<TicketMessage> = {}): TicketMessage => ({
  id: 1,
  author: 'Deepak Vaidya',
  role: 'note',
  action: 'left an internal note',
  time: '2026-08-31T09:00:00Z',
  body: 'Refund approved by finance on 30 Aug. Waiting on the bank, 5–7 days.',
  ...patch,
})

const meta = {
  title: 'Product/Service/TicketNote',
  component: TicketNote,
  tags: ['autodocs'],
  decorators: [surfaceFrame({ width: '560px' })],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
An internal ("sticky") note in a ticket's thread: the warm note bubble (\`MpChatBubble\` with the
note skin) plus the note's own actions in a ⋯ menu.

- **Your own note** — Edit · Pin to top · Delete. Edit happens in place (Save / Cancel; Escape
  cancels, ⌘/Ctrl+Enter saves) and leaves an "Edited" mark. Delete asks first.
- **Someone else's note** — Pin to top only (\`canManage\` false).
- **Pinned** — the footer says so; the ticket lists pinned notes in a strip under its properties.
- **Read-only** (Spam and Trash tickets) — no ⋯ at all.

The thread owns the data: the component emits \`save(body)\`, \`delete\` and \`pin(pinned)\`.

### A11y
- The note is focusable (\`tabindex="-1"\`) so "jump to this note" can land on it.
- The ⋯ button is named after the note's author; the editor is named "Edit note".
        `,
      },
    },
  },
  args: { message: note(), time: 'Aug 31, 2026, 02:30 PM', canManage: true, readonly: false },
} satisfies Meta<typeof TicketNote>

export default meta
type Story = StoryObj<typeof meta>

/** Default — your own note. Open ⋯ to edit it in place, pin it or delete it. */
export const Default: Story = {
  render: (args) => ({
    components: { TicketNote },
    setup() {
      const message = reactive({ ...args.message })
      const save = (body: string) => { message.body = body; message.editedAt = new Date().toISOString() }
      const pin = (pinned: boolean) => { message.pinned = pinned }
      return { args, message, save, pin }
    },
    template: `<TicketNote :message="message" :time="args.time" :can-manage="args.canManage" :readonly="args.readonly" @save="save" @pin="pin" />`,
  }),
}

/** Variants — your own, another agent's (pin only), and a pinned note that was edited. */
export const Variants: Story = {
  render: () => ({
    components: { TicketNote },
    setup: () => ({
      mine: note(),
      theirs: note({ id: 2, author: 'Sushant Rana', body: 'Engineering ticket SD-2136 opened. Sev 3, targeting next patch.' }),
      pinned: note({ id: 3, pinned: true, editedAt: '2026-08-31T10:00:00Z', body: 'Customer prefers a phone call after 5pm.' }),
    }),
    template: `
      <div class="d-flex flex-column ga-4">
        <TicketNote :message="mine" time="Aug 31, 2026, 02:30 PM" can-manage />
        <TicketNote :message="theirs" time="Aug 31, 2026, 03:10 PM" />
        <TicketNote :message="pinned" time="Aug 31, 2026, 04:05 PM" can-manage />
      </div>
    `,
  }),
  args: {} as never,
}

/** States — read-only, as on a Spam or Trash ticket: no ⋯ menu. */
export const States: Story = {
  args: { readonly: true },
}
