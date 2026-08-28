import type { Meta, StoryObj } from '@storybook/vue3'
import MpSourceCloudChip from './MpSourceCloudChip.vue'
// The app loads the --cloud-* accent tokens via main.ts; preview.ts doesn't.
import '@/styles/source-cloud-colors.css'

const meta = {
  title: 'Atoms/MpSourceCloudChip',
  component: MpSourceCloudChip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpSourceCloudChip\` component is a small pill that identifies which source cloud a dashboard widget pulls from — Commerce, Marketing, Analytics, Contacts, Service, Neto, Retail, or Merchandising.

It reads label and icon from the canonical \`DASHBOARD_SOURCE_META\` map in the dashboards store, so the chip and the rest of the app stay aligned.

**Use when:** attributing a widget, metric, or list row to the cloud its data comes from (widget footers, eyebrows, catalog rows).

**Don't use when:** communicating a state (use \`MpStatusChip\`) or offering an interactive filter (use \`v-chip\` with click semantics — this chip is intentionally inert).

### Usage
\`\`\`html
<MpSourceCloudChip :data-source="widget.dataSource" />
<!-- tight layouts -->
<MpSourceCloudChip :data-source="widget.dataSource" size="sm" icon-only />
\`\`\`

### 🟢 Do's
- **Do** place this chip in widget footers or eyebrows so users can immediately see where the data is coming from.
- **Do** use \`size="sm"\` or \`iconOnly\` in tight layouts (KPI cards).

### 🔴 Don'ts
- **Don't** wrap the chip in another colored background — it's intentionally neutral.
- **Don't** use it as a status indicator. Use \`MpStatusChip\` for status semantics.

### A11y
- **Provides:** the chip carries \`role="img"\` so its \`aria-label\` (the full source name) is reliably announced even in icon-only usage *(fixed in the Phase 4 a11y pass)*; icon-only chips additionally get a \`title\` tooltip; text color per cloud comes from the \`--cloud-*-text\` tokens tuned for contrast on the neutral pill.
- **Consumer must:** nothing — the chip is self-labelling and non-interactive.
- **Gaps:** \`merchandising\` has no accent-color rule and renders in neutral ink (visual token gap, not a11y).
        `,
      },
    },
  },
  argTypes: {
    dataSource: {
      control: 'select',
      options: ['commerce', 'marketing', 'analytics', 'contacts', 'service', 'neto', 'retail', 'merchandising'],
      description: 'Which source cloud to display. Label + icon resolve from DASHBOARD_SOURCE_META.',
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'], description: 'Pill height on the shared chip ramp (component.chip.height.*): sm 20 · md 24 (default) · lg 32.' },
    iconOnly: { control: 'boolean', description: 'Hide the label and render a round icon pill (label moves to title/aria-label).' },
  },
} satisfies Meta<typeof MpSourceCloudChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { dataSource: 'marketing', size: 'md' },
}

/** Every source cloud the platform knows about, in one row. */
/** Variants — every source cloud. The per-cloud colour is the variant axis here. */
export const Variants: Story = {
  render: () => ({
    components: { MpSourceCloudChip },
    setup() {
      const sources = ['commerce', 'marketing', 'analytics', 'contacts', 'service', 'neto', 'retail', 'merchandising']
      return { sources }
    },
    template: `
      <div class="d-flex flex-wrap ga-2 align-center">
        <MpSourceCloudChip v-for="s in sources" :key="s" :data-source="s" />
      </div>
    `,
  }),
  args: { dataSource: 'commerce' },
}

/** Every size on the shared chip ramp — 20 / 24 / 32, from component.chip.height.*. */
export const Sizes: Story = {
  render: () => ({
    components: { MpSourceCloudChip },
    setup: () => ({ sizes: ['sm', 'md', 'lg'] }),
    template: `
      <div class="d-flex flex-column ga-4">
        <div v-for="size in sizes" :key="size" class="d-flex align-center ga-3">
          <span class="text-caption text-medium-emphasis" style="width: 2rem;">{{ size }}</span>
          <MpSourceCloudChip data-source="marketing" :size="size" />
          <MpSourceCloudChip data-source="marketing" :size="size" icon-only />
        </div>
      </div>
    `,
  }),
  args: { dataSource: 'marketing' },
}

/** States — label vs icon-only, at every size, so the square collapse is verifiable. */
export const States: Story = {
  render: () => ({
    components: { MpSourceCloudChip },
    template: `
      <div class="d-flex flex-column ga-4">
        <div class="d-flex align-center ga-3">
          <span class="text-caption text-medium-emphasis" style="width: 5rem;">with label</span>
          <MpSourceCloudChip data-source="commerce" />
        </div>
        <div class="d-flex align-center ga-3">
          <span class="text-caption text-medium-emphasis" style="width: 5rem;">icon only</span>
          <MpSourceCloudChip data-source="commerce" icon-only />
        </div>
      </div>
    `,
  }),
  args: { dataSource: 'commerce' },
}

// ── Scenarios ───────────────────────────────────────────────────────────────

export const Commerce: Story = {
  args: { dataSource: 'commerce', size: 'md' },
}

export const Service: Story = {
  args: { dataSource: 'service', size: 'md' },
}

export const Neto: Story = {
  args: { dataSource: 'neto', size: 'md' },
}
