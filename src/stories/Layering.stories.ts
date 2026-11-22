/**
 * Layering — overlay-stacking proof file.
 *
 * Every example here opens a real, teleported Vuetify overlay (v-menu, v-tooltip,
 * v-dialog via MpConfirmDialog) against a container that could plausibly clip or
 * out-stack it, so the correct stacking is demonstrated live rather than described.
 *
 * Reference: docs/overlay-audit/01-overlay-component-audit.md §4 (z-index tokens)
 * and §6 (portal / teleport / clipping / stacking risk table).
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import { nextTick, onMounted, ref } from 'vue'
import MpRowActionsMenu from '../components/MpRowActionsMenu.vue'
import MpMenuItem from '../components/MpMenuItem.vue'
import MpConfirmDialog from '../components/MpConfirmDialog.vue'
import MpFormDrawer from '../components/MpFormDrawer.vue'
import { constrain, overlayDocs } from './decorators'

const meta: Meta = {
  title: 'Patterns/Layering',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`Patterns/Layering\` is not a component — it is a proof file. Each story opens a real,
teleported Vuetify overlay (\`v-menu\`, \`v-tooltip\`, \`v-dialog\` via \`MpConfirmDialog\`) against a
container that could plausibly clip or out-stack it: a card grid, a data table with a sticky
header, a scrolling drawer-style body, and a form drawer. Every example ships already open (via
\`v-model\` or \`play()\`, same idiom as \`MpRowActionsMenu.stories.ts\`'s \`OpenMenu\`) so reviewers see
the actual stacking, not a description of it. On this page each example sits in its own frame, so
one story's overlay never lands on another's. See
\`docs/overlay-audit/01-overlay-component-audit.md\` §§4/6 for the full z-index token table and the
portal/teleport/clipping risk list this file works through.

**Use when:** verifying that a menu, tooltip, or dialog still renders above its surroundings
after a token, CSS, or Vuetify-version change — re-open this page in both themes before merging
anything that touches \`global.scss\`'s overlay rules or the \`--mp-zIndex-*\` tokens.

**Do not use when:** you need a component's own API/behavior docs — see \`MpRowActionsMenu\`,
\`MpConfirmDialog\`, \`MpFormDrawer\`, and \`MpToastStack\`'s own story files instead; this file only
proves stacking, not props, slots, or the rest of a component's contract.

### Usage
\`\`\`html
<!-- The pattern every example relies on: let Vuetify's teleport-based overlay system do
     the escaping. Never wrap an activator in a new stacking context (transform / filter /
     will-change) to "fix" a menu that looks clipped — the container is not the bug. -->
<div style="overflow: hidden;">
  <v-menu location="top end">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="more-vertical" />
    </template>
    <v-list><!-- ... --></v-list>
  </v-menu>
</div>
\`\`\`

### 🟢 Do's
- **Do** re-run this page after any change to \`--mp-zIndex-*\` tokens, \`global.scss\`'s overlay
  rules, or \`MpFormDrawer\`'s \`Teleport to="body"\` — it is the fastest way to catch a stacking
  regression before it reaches a real page.
- **Do** check both themes — L2/L3 surfaces collapse to the same white in light mode (audit §4),
  so a contrast regression can hide in light and only show in dark.
- **Do** trust Vuetify's own overlay z-index (\`dropdown\`/\`modal\` tokens are reference-only per
  the audit) — none of these examples override it.

### 🔴 Don'ts
- **Don't** add \`position: relative\` plus a manual \`z-index\` to a card, table, or drawer to
  "push a menu on top" — every teleported overlay already renders inside
  \`.v-overlay-container\` at the end of \`<body>\`, outside any local stacking context; a local
  z-index fix is solving the wrong layer.
- **Don't** assume \`overflow: hidden\` on a container will clip a nested \`v-menu\`/\`v-tooltip\` —
  only non-teleported content clips (audit §6); confirm against this page instead of guessing.
- **Don't** treat this file as a substitute for the destination component's own story.

### A11y
- **Provides:** every overlay here keeps its own component's contract untouched by the
  stacking scenario — \`MpConfirmDialog\`/\`MpFormDrawer\` still trap and restore focus, \`v-menu\`
  still closes on Escape and returns focus to its trigger, and \`v-tooltip\` stays reachable via
  keyboard focus on its activator, not hover-only.
- **Consumer must:** nothing extra — these are the same production components used elsewhere in
  the design system; this page only changes the container they are demonstrated against.
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Proves a card's row-action menu is not clipped by a neighboring card's own
 * `overflow: hidden` — the menu paints in front of the whole grid regardless.
 */
export const MenuOverCardGrid: Story = {
  parameters: overlayDocs('360px'),
  decorators: [constrain('section')],
  render: () => ({
    components: { MpRowActionsMenu, MpMenuItem },
    setup() {
      const cards = [
        { id: 'a', name: 'Welcome Series', meta: 'Journey · 3 steps' },
        { id: 'b', name: 'VIP Repeat Buyers', meta: 'Segment · 312 contacts', constrained: true },
        { id: 'c', name: 'Spring Refresh', meta: 'Campaign · Sent' },
        { id: 'd', name: 'Cart Abandoned', meta: 'Automation · Active' },
        { id: 'e', name: 'Signup Form — Footer', meta: 'Form · 6 fields' },
        { id: 'f', name: 'April Loyalty Email', meta: 'Template · Draft' },
      ]
      return { cards }
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--mp-space-16);">
        <v-card
          v-for="card in cards"
          :key="card.id"
          flat border rounded="lg"
          class="mp-card-inset mp-card-inset--compact"
          :style="card.constrained ? 'overflow: hidden;' : undefined"
        >
          <div class="d-flex align-start justify-space-between ga-2">
            <div>
              <div class="text-body-2 font-weight-bold">{{ card.name }}</div>
              <div class="text-caption text-medium-emphasis mt-1">{{ card.meta }}</div>
            </div>
            <MpRowActionsMenu ariaLabel="Card actions" :itemLabel="card.name">
              <MpMenuItem icon="pencil" title="Edit" />
              <MpMenuItem icon="copy" title="Duplicate" />
              <v-divider class="my-1" />
              <MpMenuItem icon="trash-2" title="Delete" danger />
            </MpRowActionsMenu>
          </div>
        </v-card>
      </div>
    `,
  }),
  // The "VIP Repeat Buyers" card carries overflow: hidden — open its menu on load to prove
  // the menu (teleported to <body>) escapes that card's own clipping and the whole grid.
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Card actions for VIP Repeat Buyers"]')
    trigger?.click()
  },
}

/**
 * Proves a row-action menu renders above the table's sticky header (position: sticky +
 * the `--mp-zIndex-stickyHeader` token, same pattern as DashboardTableWidget.vue) instead
 * of being trapped behind it.
 */
export const MenuOverStickyHeaderTable: Story = {
  parameters: overlayDocs('360px'),
  decorators: [constrain('drawer')],
  render: () => ({
    components: { MpMenuItem },
    setup() {
      const menuOpen = ref(true)
      const scrollBody = ref<HTMLElement | null>(null)
      const rows = [
        { id: 1, name: 'MB-1041', date: 'Jul 17, 2026', total: '$184.50' },
        { id: 2, name: 'MB-1040', date: 'Jul 17, 2026', total: '$59.00' },
        { id: 3, name: 'MB-1039', date: 'Jul 16, 2026', total: '$412.75' },
        { id: 4, name: 'MB-1038', date: 'Jul 16, 2026', total: '$96.20' },
        { id: 5, name: 'MB-1037', date: 'Jul 15, 2026', total: '$233.10' },
        { id: 6, name: 'MB-1036', date: 'Jul 15, 2026', total: '$28.99' },
        { id: 7, name: 'MB-1035', date: 'Jul 14, 2026', total: '$540.00' },
        { id: 8, name: 'MB-1034', date: 'Jul 14, 2026', total: '$147.35' },
      ]
      const stickyHeader = 'position: sticky; top: 0; z-index: var(--mp-zIndex-stickyHeader); background: var(--surface-primary); color: var(--on-surface); border-bottom: 1px solid var(--border-subtle);'
      // Pre-scroll by one row so the sticky header is proven mid-scroll (not just a plain top
      // header), with the open-menu row landing directly beneath it.
      onMounted(async () => {
        await nextTick()
        const firstRow = scrollBody.value?.querySelector<HTMLElement>('tbody tr')
        if (scrollBody.value && firstRow) scrollBody.value.scrollTop = firstRow.offsetHeight
      })
      return { menuOpen, scrollBody, rows, stickyHeader }
    },
    template: `
      <div
        ref="scrollBody"
        style="max-height: var(--mp-component-state-minHeight); overflow-y: auto; border: 1px solid var(--border-default); border-radius: var(--mp-radius-12);"
      >
        <v-table density="comfortable">
          <thead>
            <tr>
              <th :style="stickyHeader">Order</th>
              <th :style="stickyHeader">Date</th>
              <th class="text-right" :style="stickyHeader">Total</th>
              <th :style="stickyHeader"><span class="d-sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td class="text-primary font-weight-bold">{{ row.name }}</td>
              <td class="text-medium-emphasis">{{ row.date }}</td>
              <td class="text-right font-weight-semibold">{{ row.total }}</td>
              <td class="text-right">
                <v-menu v-if="row.id === 3" v-model="menuOpen" location="top end">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="more-vertical" variant="text" size="x-small" aria-label="MB-1039 actions"></v-btn>
                  </template>
                  <v-list density="compact" role="menu">
                    <MpMenuItem icon="eye" title="View order" />
                    <MpMenuItem icon="printer" title="Print invoice" />
                    <v-divider class="my-1" />
                    <MpMenuItem icon="ban" title="Cancel order" danger />
                  </v-list>
                </v-menu>
                <v-btn v-else icon="more-vertical" variant="text" size="x-small" :aria-label="row.name + ' actions'"></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    `,
  }),
}

/**
 * Proves a tooltip near a scroll container's edge is not clipped by the container's
 * `overflow-y: auto` — Vuetify's teleport-based overlay escapes it instead of being cut off.
 */
export const TooltipInScrollContainer: Story = {
  parameters: overlayDocs('360px'),
  decorators: [constrain('narrow')],
  render: () => ({
    setup() {
      const tooltipOpen = ref(true)
      const items = Array.from({ length: 10 }, (_, i) => i + 1)
      return { tooltipOpen, items }
    },
    template: `
      <div
        style="height: var(--mp-component-state-minHeight); overflow-y: auto; border: 1px solid var(--border-default); border-radius: var(--mp-radius-12); padding: var(--mp-space-4) var(--mp-space-16); background: var(--surface-primary); color: var(--on-surface);"
      >
        <div v-for="n in items" :key="n" class="d-flex align-center justify-space-between py-2">
          <span class="text-body-2">Segment rule {{ n }}</span>
          <v-tooltip
            v-if="n === 5"
            v-model="tooltipOpen"
            location="bottom"
            text="Escapes the scroll container's overflow-y: auto via Vuetify's teleport-based overlay — not clipped at the edge."
          >
            <template #activator="{ props }">
              <v-icon v-bind="props" size="18" class="text-medium-emphasis">info</v-icon>
            </template>
          </v-tooltip>
          <v-icon v-else size="18" class="text-disabled">info</v-icon>
        </div>
      </div>
    `,
  }),
}

/**
 * Proves MpConfirmDialog stacks correctly above an open MpFormDrawer instead of being
 * trapped behind its scrim — a "discard changes" confirm over a form drawer.
 */
export const DialogInsideFormDrawer: Story = {
  parameters: overlayDocs(),
  render: () => ({
    components: { MpFormDrawer, MpConfirmDialog },
    setup() {
      const drawerOpen = ref(true)
      const confirmOpen = ref(true)
      return { drawerOpen, confirmOpen }
    },
    template: `
      <div>
        <v-btn variant="outlined" prepend-icon="panel-right" @click="drawerOpen = true">Edit campaign details</v-btn>
        <MpFormDrawer v-model="drawerOpen" title="Edit campaign details" subtitle="Welcome Series — Step 2">
          <v-text-field label="Campaign name" model-value="Welcome Series — Step 2" />
          <v-textarea label="Subject line" model-value="Thanks for joining us!" rows="3" />
          <template #footer>
            <v-btn variant="text" @click="confirmOpen = true">Cancel</v-btn>
            <v-btn color="primary" variant="flat">Save</v-btn>
          </template>
        </MpFormDrawer>

        <MpConfirmDialog
          v-model="confirmOpen"
          title="Discard unsaved changes?"
          message="You have unsaved edits to this campaign. Closing now will discard them."
          confirm-label="Discard"
          danger
          @confirm="drawerOpen = false"
        />
      </div>
    `,
  }),
}
