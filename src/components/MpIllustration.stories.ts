import type { Meta, StoryObj } from '@storybook/vue3'
import MpIllustration, { type IllustrationName } from './MpIllustration.vue'
import { grid } from '@/stories/storyTemplate'

const names: IllustrationName[] = [
  'no-results',
  'empty-orders',
  'empty-contacts',
  'empty-campaigns',
  'empty-products',
  'empty-generic',
  'start-here',
  'error',
]

const meta = {
  title: 'Atoms/MpIllustration',
  component: MpIllustration,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A monochrome line-illustration system for empty states across commerce + marketing. Single-weight
line drawings — no mascots, no faces, no gradients. Each illustration draws in \`currentColor\`
(muted via \`--muted\`) with exactly one accent detail keyed to \`--accent\`, so the set adapts to
light/dark themes automatically.

### Usage
\`\`\`html
<MpIllustration name="empty-orders" size="md" />
\`\`\`

Pair with \`MpEmptyState\` in place of (or above) the standard icon for a first-use surface. The
illustration is \`aria-hidden\` — meaning lives in the surrounding title and description.
        `,
      },
    },
  },
  argTypes: {
    name: { control: 'select', options: names, description: 'Which illustration to render.' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Rendered width on `component.illustration.size` — sm 120 / md 160 / lg 180. Height follows the 4:3 viewBox.',
    },
  },
} satisfies Meta<typeof MpIllustration>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { name: 'empty-orders', size: 'md' },
}

/** Every illustration in the set. */
export const Variants: Story = {
  args: { name: 'no-results' },
  render: grid({ MpIllustration }, names.map((name) => ({ label: name, args: { name } }))),
}

/** The width ramp. `lg` is what a prominent `MpEmptyState` shows. */
export const Sizes: Story = {
  args: { name: 'empty-orders' },
  render: grid({ MpIllustration }, [
    { label: 'size="sm"', args: { size: 'sm' } },
    { label: 'size="md"', args: { size: 'md' } },
    { label: 'size="lg"', args: { size: 'lg' } },
  ]),
}
