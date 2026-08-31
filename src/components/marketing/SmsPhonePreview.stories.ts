import type { Meta, StoryObj } from '@storybook/vue3'
import SmsPhonePreview from './SmsPhonePreview.vue'

const meta = {
  title: 'Product/Marketing/Campaigns/SmsPhonePreview',
  component: SmsPhonePreview,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The live phone mock beside the SMS composers (SMS campaign wizard and
Transactional SMS). Shows the message exactly as the customer would receive
it, under the sender number or alphanumeric sender ID.

Its bezel/notch/bubble geometry is a deliberate raw-px exemption (the same
class as PosPreview): it draws a phone, not app chrome.
`,
      },
    },
  },
  argTypes: {
    sender: { control: 'text', description: 'The sender line — a phone number or alphanumeric sender ID.' },
    message: { control: 'text', description: 'The message exactly as received, opt-out line included.' },
  },
} satisfies Meta<typeof SmsPhonePreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sender: '+61481074914',
    message: 'Weekend flash sale — 40% off sitewide until Sunday. Shop now: 0.mpt1.co/x7Fh2 Text STOP to opt-out',
  },
  render: (args) => ({
    components: { SmsPhonePreview },
    setup: () => ({ args }),
    template: `<div style="max-width:320px"><SmsPhonePreview v-bind="args" /></div>`,
  }),
}

/** Sender ID vs number, and a long multi-segment message wrapping in the bubble. */
export const Variants: Story = {
  args: { sender: '', message: '' },
  render: () => ({
    components: { SmsPhonePreview },
    template: `
      <div class="d-flex flex-wrap ga-6">
        <div style="max-width:320px"><SmsPhonePreview sender="MAROPOST" message="Your verification code is 482910. It expires in 10 minutes." /></div>
        <div style="max-width:320px"><SmsPhonePreview sender="+61481074914" message="Good news! Your order #45012 has shipped and is on its way. Track the parcel any time: 0.mpt1.co/x7Fh2 — expected delivery Thursday. Questions? Just reply to this message and our team will help. Text STOP to opt-out" /></div>
      </div>
    `,
  }),
}
