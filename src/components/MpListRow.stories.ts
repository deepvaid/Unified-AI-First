import type { Meta, StoryObj } from '@storybook/vue3'
import MpListRow from './MpListRow.vue'

const meta = {
  title: 'Atoms/MpListRow',
  component: MpListRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpListRow\` is the one row geometry for every list in the system. Before it, a single
file (\`ModuleLandingPage\`) hand-rolled three different rows at three different heights,
and \`DvDraftPreview\` hand-rolled a fourth. This consolidates them.

**Use when:** you are rendering a repeating row — an activity feed, a checklist, a menu of
suggestions, a settings list.

**Don't use when:** you need a real data table (use \`v-data-table\` with the
\`MpDataTableToolbar\` pattern) or a selectable card (use \`MpOptionCard\`).

### Usage
\`\`\`html
<MpListRow
  v-for="item in activity"
  :key="item.id"
  :to="item.to"
  variant="divided"
  :eyebrow="item.time"
  :title="item.title"
  :meta="item.value"
>
  <template #lead><v-icon size="14">{{ item.icon }}</v-icon></template>
</MpListRow>
\`\`\`

### Geometry
Everything comes from \`component.listItem.*\`. \`minHeight\` reuses
\`component.control.height\` (40px), so a list row, a button and a form field all sit on
one baseline. \`density="compact"\` drops that floor for checklists and dense menus, where
a full control height reads loose rather than calm.

### The tag is inferred
Pass \`to\` for a \`RouterLink\`, \`href\` for an anchor, \`clickable\` for a \`<button>\`, or
nothing for a \`<div>\`. Consumers no longer need three hand-written branches per row —
binding an unconditional \`:href\` alongside RouterLink's \`:to\` used to clobber the href
RouterLink computes internally, which is exactly the bug this removes.

### 🟢 Do's
- **Do** use \`variant="divided"\` for a feed inside a card — the hairline is drawn
  *between* siblings, never above the first or below the last.
- **Do** put the timestamp or count in \`meta\`; it right-aligns and renders tabular.

### 🔴 Don'ts
- **Don't** re-implement a row because you need one different colour — pass a class and
  style the \`#lead\` slot, as \`ModuleLandingPage\` does for its tinted activity chips.

### A11y
- **Provides:** interactive rows render as real links or buttons, so they are focusable
  and keyboard-operable, and carry a visible \`:focus-visible\` ring.
- **Consumer must:** give \`#lead\` icons \`aria-hidden\` (Vuetify's \`v-icon\` already does)
  and make sure \`title\` reads sensibly on its own.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['plain', 'divided', 'boxed'],
      description: "Structure: 'plain' (bare row), 'divided' (hairline between siblings), 'boxed' (each row its own bordered tile).",
    },
    emphasis: {
      control: 'inline-radio',
      options: ['default', 'prominent'],
      description: 'Visual weight of the title. Shared system-wide vocabulary (P2-7).',
    },
    density: {
      control: 'inline-radio',
      options: ['default', 'compact'],
      description: "'default' holds the 40px control-height floor; 'compact' drops it for checklists and dense menus.",
    },
    title: { control: 'text', description: 'Row title. Truncates with an ellipsis rather than wrapping.' },
    eyebrow: { control: 'text', description: 'Muted line above the title.' },
    meta: { control: 'text', description: 'Trailing muted value — right-aligned, tabular figures.' },
    to: { control: false, description: 'Router target — renders the row as a RouterLink.' },
    href: { control: false, description: 'External target — renders the row as an anchor.' },
    clickable: { control: 'boolean', description: 'Renders the row as a <button> (use with @click).' },
  },
} satisfies Meta<typeof MpListRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Spring Refresh sent to Segment A',
    eyebrow: '2m ago',
    meta: '58.2% open',
  },
}

/** All three structures. `divided` only draws its hairline between siblings, so it needs a group to be visible. */
export const Variants: Story = {
  render: () => ({
    components: { MpListRow },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">plain</div>
          <MpListRow title="Verify sending domain" meta="Done" />
          <MpListRow title="Connect a contact list" meta="Done" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">divided</div>
          <MpListRow variant="divided" title="Spring Refresh sent" eyebrow="2m ago" meta="58.2% open" />
          <MpListRow variant="divided" title="Cart abandoned · Step 2" eyebrow="14m ago" meta="In flow" />
          <MpListRow variant="divided" title="VIP segment refreshed" eyebrow="32m ago" meta="+312" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">boxed</div>
          <div class="d-flex flex-column ga-2">
            <MpListRow variant="boxed" title="Find best send time for VIP segment" />
            <MpListRow variant="boxed" title="Generate subject line variants" />
          </div>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no `size` prop — a row spans its container. The axes that vary are density
 * (row height) and emphasis (title weight), shown together here.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpListRow },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">density="default" — 40px floor, matches a button</div>
          <MpListRow variant="divided" title="Verify sending domain (DKIM, SPF)" />
          <MpListRow variant="divided" title="Connect a contact list" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">density="compact" — no floor, for checklists</div>
          <MpListRow density="compact" title="Verify sending domain (DKIM, SPF)" />
          <MpListRow density="compact" title="Connect a contact list" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">emphasis="prominent" — heavier title</div>
          <MpListRow emphasis="prominent" title="Spring Refresh sent to Segment A" eyebrow="2m ago" meta="58.2% open" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Static vs interactive, and each tag the component can resolve to. Hover and focus a row to see the affordance. */
export const States: Story = {
  render: () => ({
    components: { MpListRow },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">static — renders a &lt;div&gt;, no hover</div>
          <MpListRow title="Read-only row" meta="—" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">clickable — renders a &lt;button&gt;, hover + focus ring</div>
          <MpListRow clickable title="Click or tab to me" meta="→" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">href — renders an &lt;a&gt;</div>
          <MpListRow href="https://maropost.com" title="External link row" meta="↗" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">boxed + interactive — border reacts too</div>
          <MpListRow variant="boxed" clickable title="Boxed and clickable" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">long title — truncates rather than wrapping</div>
          <MpListRow
            title="An abandoned-cart automation that recovers revenue by nudging shoppers who left items behind"
            meta="2h ago"
          />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Scenarios ───────────────────────────────────────────────────────────────

/** The activity-feed shape, as ModuleLandingPage composes it: tinted lead glyph + eyebrow + meta. */
export const ActivityFeed: Story = {
  render: () => ({
    components: { MpListRow },
    setup: () => ({
      items: [
        { icon: 'mail', eyebrow: '2m ago', title: 'Spring Refresh sent to Segment A · 12,408 recipients', meta: '58.2% open' },
        { icon: 'workflow', eyebrow: '14m ago', title: 'Cart abandoned · Step 2 enrolled 84 contacts', meta: 'In flow' },
        { icon: 'users', eyebrow: '32m ago', title: 'VIP repeat buyers segment refreshed', meta: '+312' },
      ],
    }),
    template: `
      <v-card flat border rounded="lg" style="padding-inline: var(--mp-component-card-paddingCompact);">
        <MpListRow
          v-for="item in items"
          :key="item.title"
          variant="divided"
          clickable
          :eyebrow="item.eyebrow"
          :title="item.title"
          :meta="item.meta"
        >
          <template #lead>
            <span style="
              width: var(--mp-space-28); height: var(--mp-space-28);
              display: flex; align-items: center; justify-content: center;
              border-radius: var(--mp-component-chip-radius);
              background: color-mix(in oklch, var(--accent) 14%, transparent);
              color: var(--accent-ink);
            "><v-icon size="14">{{ item.icon }}</v-icon></span>
          </template>
        </MpListRow>
      </v-card>
    `,
  }),
  args: {} as never,
}

/** The setup-checklist shape: compact density, a state glyph in #lead, no meta. */
export const Checklist: Story = {
  render: () => ({
    components: { MpListRow },
    setup: () => ({
      items: [
        { label: 'Verify sending domain (DKIM, SPF)', complete: true },
        { label: 'Connect a contact list', complete: true },
        { label: 'Send a test campaign', complete: false },
        { label: 'Set up a welcome journey', complete: false },
      ],
    }),
    template: `
      <div class="d-flex flex-column ga-1">
        <MpListRow v-for="i in items" :key="i.label" density="compact" :title="i.label">
          <template #lead>
            <v-icon size="14" :color="i.complete ? 'success' : undefined" class="text-medium-emphasis">
              {{ i.complete ? 'circle-check' : 'circle' }}
            </v-icon>
          </template>
        </MpListRow>
      </div>
    `,
  }),
  args: {} as never,
}
