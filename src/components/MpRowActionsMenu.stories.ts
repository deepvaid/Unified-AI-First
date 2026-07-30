import type { Meta, StoryObj } from '@storybook/vue3'
import MpRowActionsMenu from './MpRowActionsMenu.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Overlays/MpRowActionsMenu',
  component: MpRowActionsMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpRowActionsMenu\` is the kebab ("more-vertical") actions menu used in the trailing column of
data-table rows. The component owns the trigger button and the compact list container; the view
supplies \`v-list-item\`s in the default slot, keeping row-specific actions and handlers local.

**Use when:** a table row or card needs 2–6 secondary actions behind a kebab trigger.

**Don't use when:** an action is primary/frequent (promote it to an inline icon button), or the
menu needs headers, filtering, or nested submenus (build a bespoke \`v-menu\`).

### Usage
\`\`\`html
<template #item.actions="{ item }">
  <MpRowActionsMenu :ariaLabel="\`\${item.name} actions\`">
    <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
    <v-list-item prepend-icon="circle-pause" title="Pause" :disabled="item.status !== 'Active'" @click="pause(item)" />
    <v-divider />
    <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="confirmDelete(item)" />
  </MpRowActionsMenu>
</template>
\`\`\`

### ⚠️ Prop-name gotcha: \`ariaLabel\`, not \`aria-label\`
Bind the accessible name with the **camelCase prop** (\`ariaLabel="…"\` / \`:ariaLabel="…"\`).
Writing kebab-case \`aria-label="…"\` compiles, but vue-tsc treats it as a plain ARIA
**attribute** on the component root instead of the required prop — the prop stays unset and
type-checking fails with a missing-prop error (see cleanup-report §6).

### 🟢 Do's
- **Do** pass a row-specific \`ariaLabel\` ("Journey actions", "Welcome Series actions") — it is
  the trigger's only accessible name.
- **Do** put destructive actions last, behind a \`v-divider\`, with \`class="text-error"\`.
- **Do** disable (not hide) actions that don't apply to the row's state, so the menu shape stays stable.

### 🔴 Don'ts
- **Don't** exceed ~6 actions — promote frequent actions to inline icon buttons instead.
- **Don't** put forms or inputs inside — the menu closes on click; open a drawer/dialog from the item instead.

### A11y
- **Provides:** the icon-only trigger gets its accessible name from \`ariaLabel\` and Vuetify's
  \`v-menu\` wires \`aria-haspopup\`/\`aria-expanded\` on it; the menu closes on Escape and returns
  focus to the trigger; \`v-list\` supplies arrow-key navigation between items.
- **Consumer must:** make the label row-specific (a table of 50 rows each announcing "Row actions"
  is not distinguishable), give every \`v-list-item\` a \`title\` or text content, and attach real
  \`@click\` handlers (items without them are still focusable but inert).
- **Gaps:** the list is not \`role="menu"\`/\`menuitem\` (Vuetify renders a listbox-style list), so
  screen readers announce it as a list rather than a menu — acceptable, but noted for the Phase 4
  a11y pass; destructive styling (\`text-error\`) is color-only with no textual warning.
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
      description: 'Slot — menu content: `v-list-item`s (destructive actions last, behind a `v-divider`, with `class="text-error"`).',
      table: { category: 'slots' },
    },
  },
} satisfies Meta<typeof MpRowActionsMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { MpRowActionsMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex justify-center pa-8">
        <MpRowActionsMenu v-bind="args">
          <v-list-item prepend-icon="bar-chart-2" title="View analytics"></v-list-item>
          <v-list-item prepend-icon="copy" title="Duplicate"></v-list-item>
          <v-list-item prepend-icon="circle-pause" title="Pause"></v-list-item>
          <v-divider></v-divider>
          <v-list-item prepend-icon="trash-2" title="Delete" class="text-error"></v-list-item>
        </MpRowActionsMenu>
      </div>
    `,
  }),
}

/** The menu opened automatically, in a tall canvas so the popover has room. */
export const OpenMenu: Story = {
  render: (args) => ({
    components: { MpRowActionsMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex justify-center pt-4" style="min-height: 320px;">
        <MpRowActionsMenu v-bind="args">
          <v-list-item prepend-icon="bar-chart-2" title="View analytics"></v-list-item>
          <v-list-item prepend-icon="copy" title="Duplicate"></v-list-item>
          <v-divider></v-divider>
          <v-list-item prepend-icon="trash-2" title="Delete" class="text-error"></v-list-item>
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

/** L3 menu surface in dark mode — open via play interaction. */
export const DarkModeOpen: Story = {
  globals: darkModeGlobals,
  ...OpenMenu,
}

/**
 * `itemLabel` appends the row's identity to `ariaLabel`, giving each row in a table its own
 * accessible name (e.g. "Contact actions for James Anderson") instead of one repeated static
 * string. Omitting `itemLabel` leaves behavior unchanged.
 */
export const WithItemLabel: Story = {
  render: (args) => ({
    components: { MpRowActionsMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex justify-center pt-4" style="min-height: 320px;">
        <MpRowActionsMenu v-bind="args">
          <v-list-item prepend-icon="bar-chart-2" title="View analytics"></v-list-item>
          <v-list-item prepend-icon="copy" title="Duplicate"></v-list-item>
          <v-divider></v-divider>
          <v-list-item prepend-icon="trash-2" title="Delete" class="text-error"></v-list-item>
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
    components: { MpRowActionsMenu },
    setup: () => ({ args }),
    template: `
      <div class="d-flex justify-center pt-4" style="min-height: 320px;">
        <MpRowActionsMenu v-bind="args">
          <v-list-item prepend-icon="bar-chart-2" title="View analytics"></v-list-item>
          <v-list-item prepend-icon="circle-pause" title="Pause" disabled></v-list-item>
          <v-list-item prepend-icon="circle-play" title="Resume" disabled></v-list-item>
          <v-divider></v-divider>
          <v-list-item prepend-icon="trash-2" title="Delete" class="text-error"></v-list-item>
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
