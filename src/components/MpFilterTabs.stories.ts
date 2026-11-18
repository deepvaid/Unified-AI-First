import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpFilterTabs from './MpFilterTabs.vue'
import { liquidskyDocs, stack } from '@/stories/storyTemplate'

const orderTabs = [
  { label: 'All', key: 'all', count: 1471 },
  { label: 'Completed', key: 'completed', count: 892 },
  { label: 'Processing', key: 'processing', count: 234 },
  { label: 'Not Fulfilled', key: 'unfulfilled', count: 345 },
]

const campaignTabs = [
  { label: 'All', key: 'all', count: 8 },
  { label: 'Drafts', key: 'drafts', count: 2 },
  { label: 'Scheduled', key: 'scheduled', count: 1 },
  { label: 'Sent', key: 'sent', count: 5 },
]

const meta = {
  title: 'Atoms/MpFilterTabs',
  component: MpFilterTabs,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('atoms-mpfiltertabs') + `
### Overview
\`MpFilterTabs\` is the tab strip that filters a list or table by status, placed between \`MpPageHeader\` and the table card. Each tab carries a key, a label, and an optional count badge; the active key is bound via \`v-model\`.

**Use when:** switching a single collection between mutually exclusive status views (All / Completed / Processing…), especially with counts.

**Don't use when:** navigating between different pages or routes (use real navigation tabs), or when more than one filter can be active at once (use filter menus in \`MpDataTableToolbar\`).

### Usage
\`\`\`html
<MpFilterTabs
  v-model="activeTab"
  :tabs="[
    { label: 'All', key: 'all', count: total },
    { label: 'Completed', key: 'completed', count: completedCount },
    { label: 'Processing', key: 'processing', count: processingCount },
  ]"
  aria-label="Filter orders"
/>
\`\`\`

### 🟢 Do's
- **Do** always lead with an "All" tab so users can clear the filter in one click.
- **Do** keep counts live — they update as the underlying data changes and are the fastest triage signal on the page.

### 🔴 Don'ts
- **Don't** exceed ~8 tabs; the strip scrolls with overflow arrows (see the TabCount story) but scanning suffers.
- **Don't** use counts for slow/expensive queries — a wrong count is worse than none (counts of 0 are hidden automatically).

### A11y
- **Provides:** Vuetify \`v-tabs\` semantics — a \`tablist\` with arrow-key navigation and a visible active indicator; the \`ariaLabel\` prop names the tablist (defaults to "Filter results"); count chips render inside the tab so they are part of its accessible name; overflow arrows appear when tabs don't fit.
- **Provides (Phase 4):** the \`controlsId\` prop wires every tab's \`aria-controls\` to the filtered results container — set an \`id\` on the table/list wrapper and pass it here.
- **Consumer must:** pass a domain-specific \`ariaLabel\` ("Filter orders"), keep tab labels distinct, and pass \`controlsId\` so assistive tech can jump from tab to results.
- **Gaps:** none known — without \`controlsId\` the tabs fall back to the unwired filter-tab pattern.
        `,
      },
    },
  },
  args: {
    modelValue: 'all',
    tabs: orderTabs,
    ariaLabel: 'Filter orders',
  },
  argTypes: {
    modelValue: { control: 'text', description: 'Active tab key (v-model)' },
    tabs: { control: 'object', description: 'Array of tab objects with label, key, and optional count (counts of 0 are hidden)' },
    ariaLabel: { control: 'text', description: 'Accessible name for the tablist. Default: "Filter results" — always override with the domain ("Filter orders").' },
    controlsId: { control: 'text', description: 'id of the filtered results container; wired to each tab\'s aria-controls.' },
  },
  render: (args) => ({
    components: { MpFilterTabs },
    setup() {
      const active = ref(args.modelValue)

      watch(
        () => args.modelValue,
        (next) => {
          active.value = next
        },
      )

      return { args, active }
    },
    template: `
      <section style="padding:24px;background:rgb(var(--v-theme-background));min-height:180px;">
        <MpFilterTabs
          v-model="active"
          :tabs="args.tabs"
          :aria-label="args.ariaLabel"
          :controls-id="args.controlsId"
        />
        <p :id="args.controlsId" class="text-body-2 text-medium-emphasis mt-4">Active tab: {{ active }}</p>
      </section>
    `,
  }),
} satisfies Meta<typeof MpFilterTabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    modelValue: 'all',
    tabs: orderTabs,
    ariaLabel: 'Filter orders',
  },
}

const statusTabs = [
  { label: 'All', key: 'all', count: 128 },
  { label: 'Processing', key: 'processing', count: 12 },
  { label: 'Refunded', key: 'refunded', count: 0 },
]

/** With and without counts — the structural axis. */
export const Variants: Story = {
  render: stack({ MpFilterTabs }, [
    {
      label: 'with counts',
      args: {
        tabs: [
          { label: 'All', key: 'all', count: 128 },
          { label: 'Processing', key: 'processing', count: 12 },
          { label: 'Completed', key: 'completed', count: 104 },
        ],
      },
    },
    {
      label: 'without counts',
      args: {
        tabs: [
          { label: 'All', key: 'all' },
          { label: 'Processing', key: 'processing' },
          { label: 'Completed', key: 'completed' },
        ],
      },
    },
  ]),
}

/** There is no `size` prop: what varies is how many tabs there are. A long set scrolls horizontally rather than wrapping. */
export const TabCount: Story = {
  render: stack({ MpFilterTabs }, [
    {
      label: 'two tabs',
      args: { tabs: [{ label: 'All', key: 'all', count: 128 }, { label: 'Draft', key: 'draft', count: 4 }] },
    },
    {
      label: 'eight tabs — scrolls, never wraps',
      args: {
        modelValue: 'k0',
        tabs: ['All', 'Processing', 'On hold', 'Completed', 'Cancelled', 'Refunded', 'Archived', 'Failed']
          .map((label, i) => ({ label, key: `k${i}`, count: (i + 1) * 7 })),
      },
    },
  ]),
}

/** Active vs inactive, and a zero count. Tab through to see the focus ring. */
export const States: Story = {
  render: stack({ MpFilterTabs }, [
    { label: 'first tab active', args: { tabs: statusTabs, modelValue: 'all' } },
    { label: 'middle tab active', args: { tabs: statusTabs, modelValue: 'processing' } },
    { label: 'zero-count tab active', args: { tabs: statusTabs, modelValue: 'refunded' } },
  ]),
}

export const CampaignTabs: Story = {
  args: {
    modelValue: 'all',
    tabs: campaignTabs,
    ariaLabel: 'Filter campaigns',
  },
}

