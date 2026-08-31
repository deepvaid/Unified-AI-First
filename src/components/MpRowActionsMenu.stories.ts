import type { Meta, StoryObj } from '@storybook/vue3'
import MpMenuItem from './MpMenuItem.vue'
import MpRowActionsMenu from './MpRowActionsMenu.vue'
import MpStatusChip from './MpStatusChip.vue'
import { ORDERS } from '@/stories/fixtures'

const meta = {
  title: 'Molecules/MpRowActionsMenu',
  component: MpRowActionsMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpRowActionsMenu\` is the kebab ("more-vertical") actions menu used in the trailing column of
data-table rows. The component owns the trigger button and the compact list container; the view
supplies \`MpMenuItem\`s in the default slot, keeping row-specific actions and handlers local.

**Use when:** a table row or card needs 2–6 secondary actions behind a kebab trigger.

**Don't use when:** an action is primary/frequent (promote it to an inline icon button), or the
menu needs headers, filtering, or nested submenus (build a bespoke \`v-menu\`).

### Usage
\`\`\`html
<template #item.actions="{ item }">
  <MpRowActionsMenu ariaLabel="Journey actions" :itemLabel="item.name">
    <MpMenuItem icon="copy" title="Duplicate" @click="duplicate(item)" />
    <MpMenuItem icon="circle-pause" title="Pause" :disabled="item.status !== 'Active'" @click="pause(item)" />
    <v-divider class="my-1" />
    <MpMenuItem icon="trash-2" title="Delete" danger @click="confirmDelete(item)" />
  </MpRowActionsMenu>
</template>
\`\`\`

### ⚠️ Prop-name gotcha: \`ariaLabel\`, not \`aria-label\`
Bind the accessible name with the **camelCase prop** (\`ariaLabel="…"\` / \`:ariaLabel="…"\`).
Writing kebab-case \`aria-label="…"\` compiles, but vue-tsc treats it as a plain ARIA
**attribute** on the component root instead of the required prop — the prop stays unset and
type-checking fails with a missing-prop error (see cleanup-report §6).

### 🟢 Do's
- **Do** pass a row-specific accessible name — \`ariaLabel\` + \`itemLabel\` ("Contact actions" +
  "James Anderson") — it is the trigger's only accessible name.
- **Do** slot \`MpMenuItem\`s — they carry \`role="menuitem"\` for the \`role="menu"\` list.
- **Do** put destructive actions last, behind a \`<v-divider class="my-1" />\`, with \`danger\`.
- **Do** disable (not hide) actions that don't apply to the row's state, so the menu shape stays stable.

### 🔴 Don'ts
- **Don't** exceed ~6 actions — promote frequent actions to inline icon buttons instead.
- **Don't** put forms or inputs inside — the menu closes on click; open a drawer/dialog from the item instead.

### A11y
- **Provides:** the icon-only trigger gets its accessible name from \`ariaLabel\`/\`itemLabel\` and
  carries an explicit \`aria-haspopup="menu"\` (Vuetify's \`v-menu\` wires \`aria-expanded\`); the
  list is \`role="menu"\`; the menu opens \`bottom end\`, closes on Escape and returns focus to the
  trigger; \`v-list\` supplies arrow-key navigation; the trigger's hit area is extended to
  \`control.height\` (40px) even though the glyph stays compact; the trigger swallows its own click
  so it never activates a clickable host row.
- **Consumer must:** make the label row-specific via \`itemLabel\` (a table of 50 rows each
  announcing "Row actions" is not distinguishable), slot \`MpMenuItem\`s with a \`title\`, and
  attach real \`@click\` handlers (items without them are still focusable but inert).
- **Gaps:** destructive styling (\`text-error\`) is color-only with no textual warning — pair it
  with an MpConfirmDialog before the action commits.
        `,
      },
    },
  },
  args: {
    ariaLabel: 'Row actions',
  },
  argTypes: {
    ariaLabel: {
      control: 'text',
      description: 'Required accessible name for the kebab trigger, e.g. "Journey actions". Bind as camelCase `ariaLabel` — kebab-case `aria-label` bypasses the prop (see docs).',
    },
    itemLabel: {
      control: 'text',
      description: 'Optional row identity (name/title/number) appended to `ariaLabel` for a per-row accessible name, e.g. `ariaLabel="Contact actions"` + `itemLabel="James Anderson"` → "Contact actions for James Anderson". Omit to leave behavior unchanged.',
    },
    default: {
      control: false,
      description: 'Slot — menu content: `MpMenuItem`s (destructive actions last, behind a `<v-divider class="my-1" />`, with `danger`).',
      table: { category: 'slots' },
    },
  },
} satisfies Meta<typeof MpRowActionsMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { MpMenuItem, MpRowActionsMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex justify-center pa-8">
        <MpRowActionsMenu v-bind="args">
          <MpMenuItem icon="bar-chart-2" title="View analytics" />
          <MpMenuItem icon="copy" title="Duplicate" />
          <MpMenuItem icon="circle-pause" title="Pause" />
          <v-divider></v-divider>
          <MpMenuItem icon="trash-2" title="Delete" danger />
        </MpRowActionsMenu>
      </div>
    `,
  }),
}

/** The menu opened automatically, in a tall canvas so the popover has room. */
export const OpenMenu: Story = {
  render: (args) => ({
    components: { MpMenuItem, MpRowActionsMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex justify-center pt-4" style="min-height: 320px;">
        <MpRowActionsMenu v-bind="args">
          <MpMenuItem icon="bar-chart-2" title="View analytics" />
          <MpMenuItem icon="copy" title="Duplicate" />
          <v-divider></v-divider>
          <MpMenuItem icon="trash-2" title="Delete" danger />
        </MpRowActionsMenu>
      </div>
    `,
  }),
  args: { ariaLabel: 'Welcome Series actions' },
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Welcome Series actions"]')
    trigger?.click()
  },
}

/**
 * `itemLabel` appends the row's identity to `ariaLabel`, giving each row in a table its own
 * accessible name (e.g. "Contact actions for James Anderson") instead of one repeated static
 * string. Omitting `itemLabel` leaves behavior unchanged.
 */
export const WithItemLabel: Story = {
  render: (args) => ({
    components: { MpMenuItem, MpRowActionsMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex justify-center pt-4" style="min-height: 320px;">
        <MpRowActionsMenu v-bind="args">
          <MpMenuItem icon="bar-chart-2" title="View analytics" />
          <MpMenuItem icon="copy" title="Duplicate" />
          <v-divider></v-divider>
          <MpMenuItem icon="trash-2" title="Delete" danger />
        </MpRowActionsMenu>
      </div>
    `,
  }),
  args: { ariaLabel: 'Contact actions', itemLabel: 'James Anderson' },
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Contact actions for James Anderson"]')
    trigger?.click()
  },
}

/**
 * Actions that don't apply to the row's state stay visible but disabled, keeping the
 * menu shape stable across rows.
 */
export const DisabledItems: Story = {
  render: (args) => ({
    components: { MpMenuItem, MpRowActionsMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex justify-center pt-4" style="min-height: 320px;">
        <MpRowActionsMenu v-bind="args">
          <MpMenuItem icon="bar-chart-2" title="View analytics" />
          <MpMenuItem icon="circle-pause" title="Pause" disabled />
          <MpMenuItem icon="circle-play" title="Resume" disabled />
          <v-divider></v-divider>
          <MpMenuItem icon="trash-2" title="Delete" danger />
        </MpRowActionsMenu>
      </div>
    `,
  }),
  args: { ariaLabel: 'Draft journey actions' },
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Draft journey actions"]')
    trigger?.click()
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * One structure — a kebab trigger opening a `v-list`. What varies is the content you slot in:
 * plain items, items with a destructive action separated by a divider, and items with icons.
 * Open each to compare; the panel geometry is identical.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpMenuItem, MpRowActionsMenu },
    template: `
      <div class="d-flex ga-10">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">plain items</div>
          <MpRowActionsMenu ariaLabel="Row actions">
            <MpMenuItem title="View" />
            <MpMenuItem title="Duplicate" />
          </MpRowActionsMenu>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with icons</div>
          <MpRowActionsMenu ariaLabel="Row actions">
            <MpMenuItem title="View" icon="eye" />
            <MpMenuItem title="Duplicate" icon="copy" />
          </MpRowActionsMenu>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with a destructive action</div>
          <MpRowActionsMenu ariaLabel="Row actions">
            <MpMenuItem title="View" icon="eye" />
            <MpMenuItem title="Duplicate" icon="copy" />
            <v-divider class="my-1" />
            <MpMenuItem title="Delete" icon="trash-2" danger />
          </MpRowActionsMenu>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no `size` prop. The trigger is a small icon button sized to sit inside a table row
 * without stretching it, and the panel's rows are `component.menu.itemHeight` (36) with
 * `component.menu.itemPaddingBlock` (6) — deliberately denser than the 40px in-page row floor,
 * because a menu is transient chrome, not content. Inline inset stays `component.listItem.paddingInline`
 * (12). The panel is `component.menu.minWidth` (180) wide at minimum and its corner is
 * `component.menu.radius` (12), the menu step of the concentric radius scale.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpMenuItem, MpRowActionsMenu },
    template: `
      <div class="d-flex align-center ga-4">
        <MpRowActionsMenu ariaLabel="Row actions">
          <MpMenuItem title="View" icon="eye" />
          <MpMenuItem title="Duplicate" icon="copy" />
        </MpRowActionsMenu>
        <div class="text-body-2 text-medium-emphasis">Open the menu — its rows sit on the 36px menu floor, denser than in-page rows.</div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * Item states inside the panel: resting, disabled, destructive, and a row with a trailing hint.
 * The trigger itself has resting, hover and focus states — tab to it to see the ring.
 */
export const States: Story = {
  render: () => ({
    components: { MpMenuItem, MpRowActionsMenu },
    template: `
      <MpRowActionsMenu ariaLabel="Row actions" item-label="Order #10002">
        <MpMenuItem title="View order" icon="eye" />
        <MpMenuItem title="Print packing slip" icon="printer" />
        <MpMenuItem title="Refund" icon="undo-2" disabled subtitle="Already refunded" />
        <v-divider class="my-1" />
        <MpMenuItem title="Cancel order" icon="ban" danger />
      </MpRowActionsMenu>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** One menu per row in a real orders table — the only place this component is
 * meant to appear. Note the per-row accessible name: `itemLabel` turns "Order actions" into
 * "Order actions for #10002", so a screen-reader user tabbing down the column hears which row
 * each trigger belongs to.
 */
export const InContextOrdersTable: Story = {
  render: () => ({
    components: { MpMenuItem, MpRowActionsMenu, MpStatusChip },
    setup: () => ({
      rows: ORDERS.slice(0, 5),
      headers: [
        { title: 'Order', key: 'order' },
        { title: 'Customer', key: 'customer' },
        { title: 'Total', key: 'total', align: 'end' as const },
        { title: 'Status', key: 'status' },
        { title: '', key: 'actions', sortable: false, align: 'end' as const },
      ],
    }),
    template: `
      <v-card flat border rounded="lg">
        <v-data-table :headers="headers" :items="rows" item-value="id" hide-default-footer>
          <template #item.status="{ item }">
            <MpStatusChip :status="item.status" type="order" size="sm" />
          </template>
          <template #item.actions="{ item }">
            <MpRowActionsMenu ariaLabel="Order actions" :item-label="item.order">
              <MpMenuItem title="View order" icon="eye" />
              <MpMenuItem title="Print packing slip" icon="printer" />
              <MpMenuItem title="Send receipt" icon="mail" />
              <v-divider class="my-1" />
              <MpMenuItem title="Cancel order" icon="ban" danger />
            </MpRowActionsMenu>
          </template>
        </v-data-table>
      </v-card>
    `,
  }),
  args: {} as never,
}
