import type { Meta, StoryObj } from '@storybook/vue3'
import MpSectionHeader from './MpSectionHeader.vue'

const meta = {
  title: 'Atoms/MpSectionHeader',
  component: MpSectionHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpSectionHeader\` is used to divide content within a single page into logical blocks or sections, often placed above a grid of cards or a specific list.

**Use when:** labelling a section of a dashboard or long page — a card grid, a recent-activity list, a settings group.

**Don't use when:** heading the page itself (use \`MpPageHeader\`) or titling content inside a \`v-card\` (cards have their own title patterns).

### Usage
\`\`\`html
<MpSectionHeader title="Recent Orders">
  <template #actions>
    <v-btn size="small" variant="text" color="primary">View All</v-btn>
  </template>
</MpSectionHeader>
\`\`\`

### 🟢 Do's
- **Do** use this component to break up long scrolling pages with distinct visual anchors.
- **Do** use the \`#actions\` slot for simple, section-level controls like "View All" links or simple sorting dropdowns.
- **Do** keep titles brief and descriptive.

### 🔴 Don'ts
- **Don't** use this component inside a \`v-card\`. Cards have their own title patterns. This is strictly for dividing raw page real-estate.
- **Don't** place primary page actions (like "Save" or "Submit") in a section header. 

### 💡 Best Practices
- **Spacing:** The component comes with intrinsic bottom margins (\`mb-4\`). Ensure it has enough top spacing from preceding sections so it clearly anchors to the content below it.

### A11y
- **Provides:** the title carries \`role="heading"\` + \`aria-level\` (default 2, tune via \`headingLevel\`), so it participates in screen-reader heading navigation without changing the visual style *(fixed in the Phase 4 a11y pass)*; slot actions keep their own button semantics and focus rings.
- **Consumer must:** give icon-only buttons in \`#actions\` an \`aria-label\`, and set \`headingLevel\` when the section nests below another level-2 heading.
- **Gaps:** none known.
        `,
      },
    },
  },
  argTypes: {
    headingLevel: { control: 'number', description: 'Heading level announced to assistive tech (`role="heading"` + `aria-level`). Keeps the pages outline correct without changing the visual size.' },
    icon: { control: 'text', description: 'Optional quiet leading glyph for wayfinding (Lucide name, kebab-case).' },
    title: { control: 'text', description: 'Section label. Keep it brief — it sits on one line beside the actions.' },
    eyebrow: { control: 'text', description: 'Optional muted, uppercase, tracked label rendered above the title.' },
    description: { control: 'text', description: 'Optional supporting line rendered under the title.' },
    actions: { control: false, description: 'Slot — right-aligned section-level controls ("View All", sort menus).', table: { category: 'slots' } },
  },
} satisfies Meta<typeof MpSectionHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { title: 'Recent Orders' },
}

/** With and without the optional leading icon and eyebrow — the structural axes here. */
export const Variants: Story = {
  render: () => ({
    components: { MpSectionHeader },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">title only</div>
          <MpSectionHeader title="Recent orders" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with icon</div>
          <MpSectionHeader icon="package" title="Recent orders" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with eyebrow + description</div>
          <MpSectionHeader eyebrow="LAST 30 DAYS" title="Recent orders" description="Every order placed across your sales channels." />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** The heading-level ramp — there is no `size` prop; `headingLevel` is semantic, not visual. */
export const Sizes: Story = {
  render: () => ({
    components: { MpSectionHeader },
    template: `
      <div class="d-flex flex-column ga-6">
        <div v-for="lvl in [2, 3, 4]" :key="lvl">
          <div class="text-caption text-medium-emphasis mb-2">headingLevel={{ lvl }} — same size, different aria-level</div>
          <MpSectionHeader :heading-level="lvl" title="Recent orders" description="Rendered identically; only the announced level changes." />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** With and without actions, and with a title long enough to crowd them. */
export const States: Story = {
  render: () => ({
    components: { MpSectionHeader },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">no actions</div>
          <MpSectionHeader title="Recent orders" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with actions</div>
          <MpSectionHeader title="Recent orders">
            <template #actions><v-btn size="small" variant="text" class="text-none">View all</v-btn></template>
          </MpSectionHeader>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">long title beside actions</div>
          <MpSectionHeader title="Abandoned-cart recovery performance across every connected sales channel">
            <template #actions><v-btn size="small" variant="text" class="text-none">View all</v-btn></template>
          </MpSectionHeader>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

export const WithActions: Story = {
  render: (args) => ({
    components: { MpSectionHeader },
    setup: () => ({ args }),
    template: `
      <MpSectionHeader v-bind="args">
        <template #actions>
          <v-btn size="small" variant="text">Last 7 days</v-btn>
          <v-btn size="small" variant="text" color="primary">View All</v-btn>
        </template>
      </MpSectionHeader>
    `,
  }),
  args: { title: 'Top Campaigns' },
}

/** Eyebrow above and a supporting description below the title — the fullest section-header form. */
export const WithEyebrowAndDescription: Story = {
  render: (args) => ({
    components: { MpSectionHeader },
    setup: () => ({ args }),
    template: `
      <MpSectionHeader v-bind="args">
        <template #actions>
          <v-btn size="small" variant="text" color="primary">View All</v-btn>
        </template>
      </MpSectionHeader>
    `,
  }),
  args: {
    title: 'Top Campaigns',
    eyebrow: 'Last 30 days',
    description: 'Ranked by revenue attributed within the attribution window.',
  },
}

/** A long title next to actions — title and actions share one row, so keep titles short. */
export const LongTitle: Story = {
  render: (args) => ({
    components: { MpSectionHeader },
    setup: () => ({ args }),
    template: `
      <div style="max-width: 640px;">
        <MpSectionHeader v-bind="args">
          <template #actions>
            <v-btn size="small" variant="text" color="primary">View All</v-btn>
          </template>
        </MpSectionHeader>
      </div>
    `,
  }),
  args: { title: 'Campaigns sent to VIP repeat buyers in the last 30 days' },
}
