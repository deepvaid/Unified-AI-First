import type { Meta, StoryObj } from '@storybook/vue3'
import JourneyAddStepMenu from './JourneyAddStepMenu.vue'
import { nodeCatalog } from '@/stores/journeyFlowData'

const meta = {
  title: 'Product/Marketing/Journeys/JourneyAddStepMenu',
  component: JourneyAddStepMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`JourneyAddStepMenu\` is the "+" popover used at every step-insertion point on the journey builder
canvas — after a linear node, and inside an empty branch. It renders a right-anchored card with a
search field, a "Common" quick-picks section (the handful of kinds most journeys reach for first),
then the remaining catalog grouped by category (Trigger / Action / Filter / Delay / End) with
per-type colored icon avatars from \`flowTheme\`'s \`categoryColor\`. The component owns none of the
trigger markup — the default slot hands back \`{ props }\` to bind onto the caller's own
button/icon, and \`pick\` fires with the chosen \`CatalogItem\` when a row is clicked.

**Use when:** inserting a step at a specific point in a journey or data-journey flow graph —
\`JourneyFlowColumn\` opens one at every outgoing edge and every empty branch target.

**Don't use when:** building a standalone "create step" picker outside a flow graph (use
\`MpOptionCard\` galleries instead), or when the target needs multi-select — this is a single-pick menu.

### Usage
\`\`\`html
<JourneyAddStepMenu :items="addableItems" @pick="item => emit('add', seg.node.id, item, 0)">
  <template #default="{ props: menu }">
    <v-btn v-bind="menu" icon="plus" size="x-small" variant="flat" class="add-btn"
      aria-label="Add step after this one"></v-btn>
  </template>
</JourneyAddStepMenu>
\`\`\`

### 🟢 Do's
- **Do** pass the full category catalog (\`nodeCatalog\` or \`dataNodeCatalog\` from
  \`journeyFlowData.ts\`) so Common quick-picks and category grouping both render meaningfully.
- **Do** bind the activator slot's \`props\` onto a real, focusable trigger element with its own
  descriptive \`aria-label\` — the component supplies none itself.
- **Do** let the built-in search field narrow a long catalog rather than trimming the \`items\`
  prop per call site.

### 🔴 Don'ts
- **Don't** hand-pick a subset expecting Common items to travel with it — \`COMMON_KINDS\` is a
  fixed internal set matched by \`kind\`; grouping is derived from \`items\`, not configurable.
- **Don't** open another menu or dialog synchronously from the \`pick\` handler — the menu already
  closes itself (\`close-on-content-click\`) before your handler's side effects run.

### A11y
- **Provides:** Vuetify's \`v-menu\` adds \`aria-haspopup\`/\`aria-expanded\` to the bound activator
  and closes on Escape or outside click, restoring focus to the trigger; the search field carries
  an explicit \`aria-label="Search steps"\`; every catalog row is a keyboard-navigable \`v-list-item\`.
- **Consumer must:** give the activator its own descriptive \`aria-label\` (as \`JourneyFlowColumn\`
  does — "Add step after this one" / "Add a step to the {label} branch") since the trigger renders
  no visible text of its own.
- **Gaps:** the "Common" and category section headers are plain text, not wired to their
  \`v-list\` via \`role="group"\`/\`aria-labelledby\` — screen readers hear them as separate lines
  rather than announced group headings (backlog).
        `,
      },
    },
  },
  args: {
    items: nodeCatalog,
  },
  argTypes: {
    items: { control: false, description: 'Addable catalog items — pass `nodeCatalog` or `dataNodeCatalog` (or a derived subset) from `journeyFlowData.ts`.' },
    pick: { control: false, description: 'Event — emitted with the chosen `CatalogItem` when a row is clicked; the menu then closes itself.', table: { category: 'events' } },
    default: { control: false, description: 'Slot — the activator. Bind the provided `{ props }` onto your own trigger element, including its own `aria-label`.', table: { category: 'slots' } },
  },
  render: (args) => ({
    components: { JourneyAddStepMenu },
    setup: () => ({ args }),
    template: `
      <section style="min-height:480px;background:rgb(var(--v-theme-background));padding:32px;display:flex;justify-content:center;">
        <JourneyAddStepMenu :items="args.items" @pick="() => {}">
          <template #default="{ props: menu }">
            <v-btn v-bind="menu" icon="plus" size="small" variant="tonal" color="primary" aria-label="Add step"></v-btn>
          </template>
        </JourneyAddStepMenu>
      </section>
    `,
  }),
} satisfies Meta<typeof JourneyAddStepMenu>

export default meta
type Story = StoryObj<typeof meta>

/** Closed trigger — the plus button on its own, before the menu opens. */
export const Default: Story = {}

/**
 * Opened automatically via the plus trigger: "Common" quick-picks up top (Send Email, Delay,
 * Yes / No, % Split, A/B Split), then the rest of the catalog grouped by category — Trigger,
 * Action, Filter, Delay, End — each with its colored per-type icon avatar (UX-002).
 */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Add step"]')
    trigger?.click()
  },
}

/**
 * The full 31-item marketing catalog overflows the menu's `.jas-scroll` region (max-height
 * 320px) — this story opens the menu, then scrolls the list to the bottom to show the Filter,
 * Delay, and End groups still render cleanly past the fold.
 */
export const LongCatalogScrolled: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Add step"]')
    trigger?.click()
    await new Promise(resolve => setTimeout(resolve, 200))
    const scrollEl = document.querySelector<HTMLElement>('.jas-scroll')
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
  },
}
