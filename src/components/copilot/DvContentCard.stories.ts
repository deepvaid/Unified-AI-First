import type { Meta, StoryObj } from '@storybook/vue3'
import DvContentCard from './DvContentCard.vue'
import { constrain, measure } from '@/stories/decorators'
import { grid } from '@/stories/storyTemplate'

const EMAIL = {
  type: 'email' as const,
  title: 'Welcome email',
  content:
    'Subject: Welcome — here’s 15% off your first order\n\nHi there,\n\nThanks for joining. Browse the new arrivals, claim your welcome discount, and explore the style guides.\n\nWelcome aboard!',
}

const PRODUCT = {
  type: 'product' as const,
  title: 'Aurora Trail Jacket',
  content:
    'Built for shoulder-season hikes, the Aurora Trail Jacket pairs a windproof ripstop shell with a brushed-mesh lining that breathes when the pace picks up.\n\n• Packs into its own chest pocket\n• Taped seams\n• Reflective trim',
}

const BLOG = {
  type: 'blog' as const,
  title: 'Tips for building your summer wardrobe',
  content: 'As the weather warms up, it’s the perfect time to refresh your wardrobe.\n\n1. Start with the basics\n2. Add colour and pattern\n3. Don’t forget accessories',
}

const SMS = {
  type: 'sms' as const,
  title: 'Flash sale alert',
  content: 'Your 24-hour sale starts now. Save 40% with code FLASH40. Offer ends tomorrow.',
}

const meta = {
  title: 'Product/Da Vinci/DvContentCard',
  component: DvContentCard,
  tags: ['autodocs'],
  args: PRODUCT,
  argTypes: {
    type: { control: 'select', options: ['email', 'product', 'blog', 'sms'], description: 'What kind of copy this is. Sets the label, the icon, and where the primary button opens the draft.' },
    title: { control: 'text', description: 'Headline of the draft.' },
    content: { control: 'textarea', description: 'The draft itself.' },
    onCopy: { action: 'copy', description: 'Copy the draft to the clipboard. The host reports whether it really was copied.' },
    onUse: { action: 'use', description: 'Copy the draft and open the page it belongs on — the product editor, or email content. Nothing is saved until the merchant pastes it.' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
A piece of copy Da Vinci drafted — product description, email, blog post or SMS — with two actions:
**Copy**, and a primary button named for where the draft goes (**Open product editor** / **Open
email content**). The primary button copies the draft and navigates; nothing is written into the
account, and if the browser blocks the clipboard the host says so instead of opening an empty editor.

## Do's
- Show the full draft in a scrollable preview
- Name the primary button for its destination

## Don'ts
- Don't claim the draft was added to a campaign or saved — it isn't
`,
      },
    },
  },
  decorators: [constrain('drawer')],
  render: (args) => ({
    components: { DvContentCard },
    setup: () => ({ args }),
    template: '<DvContentCard v-bind="args" />',
  }),
} satisfies Meta<typeof DvContentCard>

export default meta
type Story = StoryObj<typeof meta>

/** A product description — the drawer's most common draft. */
export const Default: Story = {}

/** One card per content type: each has its own label, icon and destination. */
export const Variants: Story = {
  decorators: [constrain('dialog')],
  render: grid({ DvContentCard }, [
    { label: 'Product description', args: PRODUCT },
    { label: 'Email copy', args: EMAIL },
    { label: 'Blog post', args: BLOG },
    { label: 'SMS message', args: SMS },
  ], { columns: 'repeat(auto-fit, minmax(300px, 1fr))' }),
}

/** There is no size prop: the card fills its host — the 480px drawer body, or a narrow panel. */
export const Sizes: Story = {
  decorators: [constrain('dialog')],
  render: (args) => ({
    components: { DvContentCard },
    setup: () => ({ args, narrow: measure.narrow, drawer: measure.drawer }),
    template: `
      <div style="display: flex; gap: var(--mp-space-24); align-items: flex-start; flex-wrap: wrap;">
        <div :style="{ width: narrow }"><DvContentCard v-bind="args" /></div>
        <div :style="{ width: drawer }"><DvContentCard v-bind="args" /></div>
      </div>
    `,
  }),
}

/** A short draft, and one long enough to scroll inside its preview. */
export const States: Story = {
  decorators: [constrain('dialog')],
  render: grid({ DvContentCard }, [
    { label: 'Short draft', args: SMS },
    { label: 'Long draft (scrolls)', args: { ...BLOG, content: Array.from({ length: 6 }, () => BLOG.content).join('\n\n') } },
  ], { columns: 'repeat(auto-fit, minmax(300px, 1fr))' }),
}
