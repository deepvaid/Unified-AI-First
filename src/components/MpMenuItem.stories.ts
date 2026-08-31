import type { Meta, StoryObj } from '@storybook/vue3'
import MpMenuItem from './MpMenuItem.vue'
import MpRowActionsMenu from './MpRowActionsMenu.vue'

const meta = {
  title: 'Atoms/MpMenuItem',
  component: MpMenuItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpMenuItem\` is the one action-menu item — a \`v-list-item\` that owns the menu contract:
\`role="menuitem"\`, verb-first \`title\`, optional leading \`icon\`, and the \`danger\` treatment.
It exists so the role stops being a call-site convention (GAPS §1).

**Use when:** slotting actions into \`MpRowActionsMenu\` (or any \`role="menu"\` panel).

**Don't use when:** the row is a picker option, nav link, or list content — those aren't menu
items; use \`v-list-item\` (or \`MpListRow\`) directly.

### Usage
\`\`\`html
<MpRowActionsMenu ariaLabel="Order actions" :itemLabel="item.order">
  <MpMenuItem title="View order" icon="eye" @click="view(item)" />
  <MpMenuItem title="Duplicate" icon="copy" @click="duplicate(item)" />
  <v-divider class="my-1" />
  <MpMenuItem title="Delete" icon="trash-2" danger @click="confirmDelete(item)" />
</MpRowActionsMenu>
\`\`\`

### 🟢 Do's
- **Do** keep titles verb-first and short — no descriptions in menus.
- **Do** place \`danger\` items last, behind a \`<v-divider class="my-1" />\`.
- **Do** pass \`disabled\`, \`subtitle\`, \`@click\` etc. straight through — attrs reach the
  underlying \`v-list-item\`.

### 🔴 Don'ts
- **Don't** hand-roll \`role="menuitem"\` + \`class="text-error"\` on a bare \`v-list-item\` —
  that convention is what this component retires.
- **Don't** use it outside a \`role="menu"\` panel.

### A11y
- **Provides:** \`role="menuitem"\`; the danger treatment (colour is reinforced by position —
  last, divided — and destructive actions confirm via MpConfirmDialog before committing).
- **Consumer must:** supply the surrounding \`role="menu"\` (MpRowActionsMenu does) and attach a
  real \`@click\`.
        `,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Verb-first label.' },
    icon: { control: 'text', description: 'Optional leading Lucide icon name.' },
    danger: { control: 'boolean', description: 'Destructive treatment (text-error). Place last, after a divider.' },
  },
  args: { title: 'Duplicate', icon: 'copy', danger: false },
} satisfies Meta<typeof MpMenuItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { MpMenuItem },
    setup: () => ({ args }),
    template: `<v-list density="compact" role="menu" style="max-width: 220px"><MpMenuItem v-bind="args" /></v-list>`,
  }),
}

/** One structure; what varies is icon presence and the danger treatment. */
export const Variants: Story = {
  render: () => ({
    components: { MpMenuItem },
    template: `
      <v-list density="compact" role="menu" style="max-width: 220px">
        <MpMenuItem title="Plain item" />
        <MpMenuItem title="With icon" icon="eye" />
        <v-divider class="my-1" />
        <MpMenuItem title="Delete" icon="trash-2" danger />
      </v-list>
    `,
  }),
  args: {} as never,
}

/** Sizing comes from the menu panel (`component.menu.itemHeight`/`itemPaddingBlock`) — there is no size prop. */
export const States: Story = {
  render: () => ({
    components: { MpMenuItem },
    template: `
      <v-list density="compact" role="menu" style="max-width: 240px">
        <MpMenuItem title="Resting" icon="eye" />
        <MpMenuItem title="Disabled" icon="circle-pause" disabled />
        <MpMenuItem title="With subtitle" icon="undo-2" subtitle="Already refunded" disabled />
        <v-divider class="my-1" />
        <MpMenuItem title="Destructive" icon="trash-2" danger />
      </v-list>
    `,
  }),
  args: {} as never,
}

/** In context: slotted into the canonical kebab menu. */
export const InRowActionsMenu: Story = {
  render: () => ({
    components: { MpMenuItem, MpRowActionsMenu },
    template: `
      <div class="d-flex justify-center pt-4" style="min-height: 280px">
        <MpRowActionsMenu ariaLabel="Order actions" itemLabel="#10002">
          <MpMenuItem title="View order" icon="eye" />
          <MpMenuItem title="Print packing slip" icon="printer" />
          <v-divider class="my-1" />
          <MpMenuItem title="Cancel order" icon="ban" danger />
        </MpRowActionsMenu>
      </div>
    `,
  }),
  args: {} as never,
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    canvasElement.querySelector<HTMLElement>('[aria-label="Order actions for #10002"]')?.click()
  },
}
