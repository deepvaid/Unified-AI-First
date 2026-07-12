import type { Meta, StoryObj } from '@storybook/vue3'
import MpIllustration, { type IllustrationName } from './MpIllustration.vue'

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
  title: 'Feedback/MpIllustration',
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
<MpIllustration name="empty-orders" :size="160" />
\`\`\`

Pair with \`MpEmptyState\` in place of (or above) the standard icon for a first-use surface. The
illustration is \`aria-hidden\` — meaning lives in the surrounding title and description.
        `,
      },
    },
  },
  argTypes: {
    name: { control: 'select', options: names, description: 'Which illustration to render.' },
    size: { control: { type: 'number' }, description: 'Rendered width in px (height = size × 0.75).' },
  },
} satisfies Meta<typeof MpIllustration>

export default meta
type Story = StoryObj<typeof meta>

/** Every illustration in the set at a common size, with labels. */
export const Gallery: Story = {
  args: { name: 'no-results', size: 160 },
  render: () => ({
    components: { MpIllustration },
    setup() {
      return { names }
    },
    template: `
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:32px 24px;padding:8px">
        <div v-for="n in names" :key="n" style="display:flex;flex-direction:column;align-items:center;gap:12px">
          <MpIllustration :name="n" :size="140" />
          <code style="font:12px/1 ui-monospace,monospace;color:#6b7280">{{ n }}</code>
        </div>
      </div>
    `,
  }),
}
