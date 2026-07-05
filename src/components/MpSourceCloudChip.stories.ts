import type { Meta, StoryObj } from '@storybook/vue3'
import MpSourceCloudChip from './MpSourceCloudChip.vue'
// The app loads the --cloud-* accent tokens via main.ts; preview.ts doesn't.
import '@/styles/source-cloud-colors.css'

const meta = {
  title: 'Data Display/MpSourceCloudChip',
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
- **Provides:** an \`aria-label\` with the full source name is always set, and icon-only chips additionally get a \`title\` tooltip; text color per cloud comes from the \`--cloud-*-text\` tokens tuned for contrast on the neutral pill.
- **Consumer must:** nothing — the chip is self-labelling and non-interactive.
- **Gaps:** the chip is a plain \`span\` with an \`aria-label\` but no role, which some screen readers skip for non-interactive elements (low impact — the visible label matches; icon-only usage relies on it, noted for Phase 4); \`merchandising\` has no accent-color rule and renders in neutral ink.
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
    size: { control: 'inline-radio', options: ['sm', 'md'], description: 'Pill height: md = 22px (default), sm = 20px.' },
    iconOnly: { control: 'boolean', description: 'Hide the label and render a round icon pill (label moves to title/aria-label).' },
  },
} satisfies Meta<typeof MpSourceCloudChip>

export default meta
type Story = StoryObj<typeof meta>

export const Marketing: Story = {
  args: { dataSource: 'marketing', size: 'md' },
}

export const Commerce: Story = {
  args: { dataSource: 'commerce', size: 'md' },
}

export const Service: Story = {
  args: { dataSource: 'service', size: 'md' },
}

export const Neto: Story = {
  args: { dataSource: 'neto', size: 'md' },
}

export const SmallSize: Story = {
  args: { dataSource: 'marketing', size: 'sm' },
}

export const IconOnly: Story = {
  args: { dataSource: 'commerce', size: 'sm', iconOnly: true },
}

/** Every source cloud the platform knows about, in one row. */
export const AllSources: Story = {
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

/** Size × icon-only matrix on a single source. */
export const SizeMatrix: Story = {
  render: () => ({
    components: { MpSourceCloudChip },
    template: `
      <div class="d-flex flex-column ga-3">
        <div class="d-flex align-center ga-2">
          <MpSourceCloudChip data-source="marketing" size="md" />
          <MpSourceCloudChip data-source="marketing" size="md" icon-only />
          <span class="text-caption text-medium-emphasis">md</span>
        </div>
        <div class="d-flex align-center ga-2">
          <MpSourceCloudChip data-source="marketing" size="sm" />
          <MpSourceCloudChip data-source="marketing" size="sm" icon-only />
          <span class="text-caption text-medium-emphasis">sm</span>
        </div>
      </div>
    `,
  }),
  args: { dataSource: 'marketing' },
}
