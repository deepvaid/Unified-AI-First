import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpOptionCard from './MpOptionCard.vue'

const meta = {
  title: 'Molecules/MpOptionCard',
  component: MpOptionCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpOptionCard\` is the card of a chooser gallery, in **two modes** derived from its props (the
MpListRow "resolve your own tag" rule):

- **Selection** — pass \`selected\`: a keyboard-operable toggle (\`role="button"\`,
  \`aria-pressed\`, Enter/Space) with the primary ring + check when selected. Wizard galleries
  that select-then-commit.
- **Navigation** — pass \`to\` (or \`href\`): a real anchor via v-card's own link rendering,
  natively keyboard operable, **no** \`aria-pressed\` (a link is not a toggle). Click-to-go
  choosers: campaign type, segment builder.

The card owns the chrome; the view owns the grid wrapper and extra body content via slots.
Chooser tiles that are page landmarks pass \`heading-level\` so the title is a real h2/h3.

**Use when:** the user picks one option from a visual set of 2–8 alternatives in a wizard or create flow.

**Don't use when:** the choice is binary (use a switch/checkbox), the list is long (use a select or list), or options can't be described in a title + one line. A disabled state is **not supported** — filter unavailable options out instead of rendering them inert.

### Usage
\`\`\`html
<v-col v-for="opt in options" :key="opt.id" cols="12" sm="4">
  <MpOptionCard
    :selected="selectedId === opt.id"
    :title="opt.title"
    :description="opt.description"
    :icon="opt.icon"
    class="h-100"
    @click="selectedId = opt.id"
  />
</v-col>
\`\`\`

### Slots
- **default** — extra body content below the description (chips, meta rows, inset previews).
- **title-append** — inline beside the title (a "New" chip, a count).
- **media** — full-bleed footer area (top border + background), e.g. a flow mini preview.

### 🟢 Do's
- **Do** keep exactly one card selected per group and drive it from view state.
- **Do** wire \`@click\` on the card; the component emits native click through the root.

### 🔴 Don'ts
- **Don't** re-implement the selected ring in views — pass \`selected\` instead.
- **Don't** nest interactive controls inside the card body; the whole card is the click target.

### A11y
- **Provides (selection mode):** the root is a keyboard-operable toggle button — \`role="button"\`, \`tabindex="0"\`, Enter/Space re-dispatch a native click (so fallthrough \`@click\` handlers fire), and a \`:focus-visible\` ring in the primary theme color; \`aria-pressed\` reflects the selection, and the selected state is marked by both a ring **and** a check icon, so it is never color-only. *(Fixed in the Phase 4 a11y pass.)*
- **Provides (navigation mode):** a real anchor — no \`aria-pressed\`, no synthetic key handling; never announce a link as an unpressed toggle (don't pass \`:selected="false"\` to fake a plain card — omit the prop).
- **Consumer must:** manage single-selection in view state and pass \`selected\` back down.
- **Gaps:** none known — keyboard double-press does not synthesize \`dblclick\`, so keep any \`@dblclick\` shortcut redundant with a visible button (as the wizards do).
        `,
      },
    },
  },
  args: {
    selected: false,
    title: 'Abandoned cart recovery',
    description: 'Bring shoppers back with a timed three-email nudge sequence.',
    icon: 'shopping-cart',
  },
  argTypes: {
    selected: { control: 'boolean', description: 'Selection mode: whether this option is selected (primary ring + check, aria-pressed). OMIT entirely for navigation/plain cards — a false value still announces a toggle.' },
    to: { control: 'object', description: 'Navigation mode: RouteLocationRaw — the card renders as a router-link anchor and drops role/aria-pressed.' },
    href: { control: 'text', description: 'Navigation mode: plain anchor target.' },
    headingLevel: { control: 'select', options: [2, 3], description: 'Render the title as a real heading — chooser tiles are page landmarks.' },
    'title-append': { control: false, description: 'Slot — inline beside the title (a "New" chip, a count).', table: { category: 'slots' } },
    title: { control: 'text', description: 'Option name, bold, next to the optional icon avatar.' },
    description: { control: 'text', description: 'One-line supporting copy under the title row.' },
    icon: { control: 'text', description: 'Lucide icon name rendered in a tonal primary avatar before the title.' },
    default: { control: false, description: 'Slot — extra body content below the description (chips, meta rows).', table: { category: 'slots' } },
    media: { control: false, description: 'Slot — full-bleed footer area with top border, e.g. a flow mini preview.', table: { category: 'slots' } },
  },
} satisfies Meta<typeof MpOptionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    selected: false,
    icon: 'file',
    title: 'Start from scratch',
    description: 'A blank canvas — build the layout yourself.',
  },
}

/** With and without a media slot — the structural axis. */
export const Variants: Story = {
  render: () => ({
    components: { MpOptionCard },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--mp-space-16);">
        <MpOptionCard :selected="false" icon="file" title="Start from scratch" description="A blank canvas." />
        <MpOptionCard :selected="false" icon="layout-template" title="Use a template" description="Start from a proven layout.">
          <template #media>
            <div style="height: 96px; background: var(--surface-secondary);"></div>
          </template>
        </MpOptionCard>
      </div>
    `,
  }),
  args: {} as never,
}

/** Selected, unselected, and focus — tab through to see the focus ring. */
export const States: Story = {
  render: () => ({
    components: { MpOptionCard },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--mp-space-16);">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">unselected</div>
          <MpOptionCard :selected="false" icon="file" title="Start from scratch" description="A blank canvas." />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">selected</div>
          <MpOptionCard :selected="true" icon="layout-template" title="Use a template" description="Start from a proven layout." />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">tab to focus</div>
          <MpOptionCard :selected="false" icon="sparkles" title="Draft with Da Vinci" description="Let AI propose a first pass." />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

export const Unselected: Story = {
  render: (args) => ({
    components: { MpOptionCard },
    setup: () => ({ args }),
    template: `
      <div style="max-width:340px;">
        <MpOptionCard v-bind="args" />
      </div>
    `,
  }),
}

export const Selected: Story = {
  args: { selected: true },
  render: (args) => ({
    components: { MpOptionCard },
    setup: () => ({ args }),
    template: `
      <div style="max-width:340px;">
        <MpOptionCard v-bind="args" />
      </div>
    `,
  }),
}

export const WithMedia: Story = {
  args: { selected: true },
  render: (args) => ({
    components: { MpOptionCard },
    setup: () => ({ args }),
    template: `
      <div style="max-width:340px;">
        <MpOptionCard v-bind="args">
          <div class="d-flex gap-2 mt-3">
            <v-chip size="x-small" variant="tonal" color="primary">4 steps</v-chip>
            <v-chip size="x-small" variant="tonal" color="secondary">1 branch</v-chip>
          </div>
          <template #media>
            <div class="pa-4 d-flex justify-center text-medium-emphasis text-caption">
              Flow preview renders here
            </div>
          </template>
        </MpOptionCard>
      </div>
    `,
  }),
}

export const SelectionGroup: Story = {
  render: () => ({
    components: { MpOptionCard },
    setup() {
      const selectedId = ref('newsletter')
      const options = [
        { id: 'promo', title: 'Promotional Sale', icon: 'heart-handshake', description: 'Highlight discounts and flash deals' },
        { id: 'newsletter', title: 'Newsletter', icon: 'newspaper', description: 'Curated content updates' },
        { id: 'launch', title: 'Product Launch', icon: 'rocket', description: 'Announce a new product arrival' },
      ]
      return { selectedId, options }
    },
    template: `
      <v-row style="max-width:900px;">
        <v-col v-for="opt in options" :key="opt.id" cols="12" sm="4">
          <MpOptionCard
            :selected="selectedId === opt.id"
            :title="opt.title"
            :description="opt.description"
            :icon="opt.icon"
            class="h-100"
            @click="selectedId = opt.id"
          />
        </v-col>
      </v-row>
    `,
  }),
}

/** Navigation mode: real links (inspect the DOM — anchors, no aria-pressed), with a title-append badge. */
export const NavigationTiles: Story = {
  render: () => ({
    components: { MpOptionCard },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--mp-space-20); max-width: 720px;">
        <MpOptionCard
          title="Next-Gen segment builder"
          description="Build rules from contact attributes, purchases and campaign activity."
          icon="sparkles"
          :heading-level="2"
          href="#next-gen"
        >
          <template #title-append>
            <v-chip size="small" color="primary" variant="tonal" class="ml-auto">New</v-chip>
          </template>
          <p class="text-caption font-weight-medium text-primary mb-0 mt-2">Recommended for new segments</p>
        </MpOptionCard>
        <MpOptionCard
          title="Legacy segment builder"
          description="The original builder, with multiple sets of rules."
          icon="layers"
          :heading-level="2"
          href="#legacy"
        />
      </div>
    `,
  }),
  args: {} as never,
}
