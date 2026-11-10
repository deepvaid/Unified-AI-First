import type { Meta, StoryObj } from '@storybook/vue3'
import MpTagChip from './MpTagChip.vue'
import { TAG_COLORS, TAG_COLOR_LABELS } from '@/service/model'

const meta = {
  title: 'Atoms/MpTagChip',
  component: MpTagChip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpTagChip\` is a user-defined tag: a soft pill in one of the eight tag swatches
(\`TAG_COLORS\` — sky, green, slate, amber, violet, blue, orange, red; the UAT tag palette).
Each swatch is one token pair, \`color.{light,dark}.tag.<hue>.container\` + \`onContainer\`,
and the chip paints both from it — it never inherits a text colour.

**Use when:** showing tags a merchant created (ticket tags in lists, the ticket header, the
Tags settings table), optionally removable in an editor.

**Don't use when:** the chip communicates a workflow state (use \`MpStatusChip\`) or a source
cloud (use \`MpSourceCloudChip\`). Tag colours are categorical: a red tag is not an error.

### Usage
\`\`\`html
<MpTagChip :name="tag.name" :color="tag.color" />
<MpTagChip :name="tag.name" :color="tag.color" size="md" removable @remove="untag(tag.id)" />
\`\`\`

### A11y
- **Provides:** every pair is gated at 4.5:1 in \`$contrastPairs\` (both themes); a long name
  truncates with the full name in \`title\`; the remove button is a real \`<button>\` named
  "Remove tag <name>" with a 24px hit area and the global focus ring.
- **Consumer must:** move focus somewhere sensible after a remove (the next tag, or the field
  that adds tags) — the chip unmounts with its button.
        `,
      },
    },
  },
  argTypes: {
    name: { control: 'text', description: 'Tag name. Truncates with an ellipsis; full name in `title`.' },
    color: { control: 'select', options: [...TAG_COLORS], description: 'One of the eight tag swatches.' },
    size: { control: 'inline-radio', options: ['sm', 'md'], description: 'Chip ramp height: sm 20 (default) · md 24.' },
    removable: { control: 'boolean', description: 'Adds a labelled remove button that emits `remove`.' },
  },
  args: { name: 'Billing', color: 'sky', size: 'sm', removable: false },
} satisfies Meta<typeof MpTagChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Variants — all eight swatches. Flip the toolbar Theme to check the dark pairs. */
export const Variants: Story = {
  render: () => ({
    components: { MpTagChip },
    setup: () => ({ colors: TAG_COLORS, labels: TAG_COLOR_LABELS }),
    template: `
      <div class="d-flex flex-column ga-4">
        <div class="d-flex flex-wrap ga-2 align-center">
          <MpTagChip v-for="c in colors" :key="c" :name="labels[c]" :color="c" />
        </div>
        <div class="d-flex flex-wrap ga-2 align-center">
          <MpTagChip v-for="c in colors" :key="c" :name="labels[c]" :color="c" size="md" removable />
        </div>
      </div>
    `,
  }),
}

/** Sizes — the chip ramp's sm (20) and md (24) stops, plain and removable. */
export const Sizes: Story = {
  render: () => ({
    components: { MpTagChip },
    setup: () => ({ sizes: ['sm', 'md'] as const }),
    template: `
      <div class="d-flex flex-column ga-4">
        <div v-for="size in sizes" :key="size" class="d-flex align-center ga-3">
          <span class="text-caption text-medium-emphasis" style="width: 2rem;">{{ size }}</span>
          <MpTagChip name="Refund" color="green" :size="size" />
          <MpTagChip name="Refund" color="green" :size="size" removable />
        </div>
      </div>
    `,
  }),
}

/**
 * States — removable, a long name truncating inside a narrow column, and focus on the remove
 * button. The play function focuses it; the ring is `:focus-visible`, so if a mouse click got
 * there first, Tab to it.
 */
export const States: Story = {
  render: () => ({
    components: { MpTagChip },
    template: `
      <div class="d-flex flex-column ga-4">
        <div class="d-flex align-center ga-3">
          <span class="text-caption text-medium-emphasis" style="width: 6rem;">removable</span>
          <MpTagChip name="VIP customer" color="violet" removable />
        </div>
        <div class="d-flex align-center ga-3">
          <span class="text-caption text-medium-emphasis" style="width: 6rem;">long name</span>
          <div style="max-width: var(--mp-component-toolbar-titleMinWidth); min-width: 0;">
            <MpTagChip name="Escalated to the warehouse team — damaged in transit" color="orange" removable />
          </div>
        </div>
        <div class="d-flex align-center ga-3">
          <span class="text-caption text-medium-emphasis" style="width: 6rem;">focus</span>
          <MpTagChip name="Urgent" color="red" removable data-story-focus />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('[data-story-focus] .mp-tag-chip__remove')?.focus()
  },
}
