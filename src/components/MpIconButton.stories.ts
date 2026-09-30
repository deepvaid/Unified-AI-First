import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MpIconButton from './MpIconButton.vue'
import { grid } from '@/stories/storyTemplate'

const meta = {
  title: 'Atoms/MpIconButton',
  component: MpIconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpIconButton\` is the one icon-only button. An icon with no visible text is only usable when
it carries a name — so \`ariaLabel\` is required — and, for sighted pointer users, the same name
as a tooltip (recipe D2), which is on by default. It owns a square geometry on
\`component.iconButton.*\`:

| size | box | icon | where |
|---|---|---|---|
| \`sm\` | 24 | 16 | inside a 32px tree/list row (the WCAG 2.5.8 target floor) |
| \`md\` | 32 | 18 | panel headers, tab strips, tool columns |
| \`lg\` | 40 | 20 | toolbars, beside 40px fields and buttons (\`control.height\`) |

Why it exists: \`maropostDefaults.VBtn\` writes text-button geometry (min-height 40,
padding-inline 14) as an inline style on every \`v-btn\`, so a raw \`<v-btn icon size="x-small">\`
paints a 32×40 capsule and inflates whatever row it sits in. This atom restates those two
properties in its own \`style\`, which Vuetify merges after the default — no \`!important\`, no
app-wide reset.

**Use when:** an action is an icon alone — row actions, close buttons, toolbar tools, toggles.

**Don't use when:** the action has a visible label (use \`v-btn\` with \`prepend-icon\`), or it
opens a row's action menu (use \`MpRowActionsMenu\`, which composes this at \`size="sm"|"md"\`).

### Usage
\`\`\`html
<MpIconButton icon="trash-2" size="sm" :ariaLabel="\`Remove \${section.label}\`" @click="remove" />
<MpIconButton icon="files" ariaLabel="Explorer" role="tab" :active="panel === 'explorer'"
              :aria-selected="panel === 'explorer'" tooltipLocation="end" />
\`\`\`

### 🟢 Do's
- **Do** make \`ariaLabel\` name the object as well as the verb ("Remove Hero Banner").
- **Do** use \`active\` for a pressed tool or a current tab — the tonal primary look — and state
  the matching ARIA yourself (\`aria-pressed\` for a toggle, \`aria-selected\` for a tab).
- **Do** pass \`:tooltip="false"\` only where a visible label already names the control.

### 🔴 Don'ts
- **Don't** reach for \`<v-btn icon size="x-small">\` in new code — it is the 32×40 capsule.
- **Don't** swap colour alone to show a pressed state — that is what \`active\` is for.

### A11y
- **Provides:** the accessible name, a matching tooltip on hover and focus, a 24px minimum
  target, the focus ring from the global \`:focus-visible\` rule.
- **Consumer must:** give each button a unique, specific \`ariaLabel\`, and set the ARIA state
  that matches \`active\`.
        `,
      },
    },
  },
  args: {
    icon: 'pencil',
    ariaLabel: 'Edit Hero Banner',
    size: 'md',
    active: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    tooltipLocation: { control: 'radio', options: ['top', 'bottom', 'start', 'end'] },
  },
} satisfies Meta<typeof MpIconButton>

export default meta
type Story = StoryObj<typeof meta>

/** One md icon button with its tooltip. */
export const Default: Story = {}

/** The glyphs the builders use most, at the default size. */
export const Variants: Story = {
  name: 'Variants (common actions)',
  render: grid({ MpIconButton }, [
    { label: 'Edit', args: { icon: 'pencil', ariaLabel: 'Edit' } },
    { label: 'Remove', args: { icon: 'trash-2', ariaLabel: 'Remove' } },
    { label: 'Close', args: { icon: 'x', ariaLabel: 'Close' } },
    { label: 'More', args: { icon: 'more-vertical', ariaLabel: 'More actions' } },
    { label: 'Back', args: { icon: 'chevron-left', ariaLabel: 'Back' } },
  ], { columns: 'repeat(auto-fit, minmax(120px, 1fr))' }),
}

/** The square ramp — sm 24 · md 32 · lg 40. */
export const Sizes: Story = {
  render: grid({ MpIconButton }, [
    { label: 'sm · 24 (tree rows)', args: { size: 'sm', icon: 'trash-2', ariaLabel: 'Remove' } },
    { label: 'md · 32 (panel chrome)', args: { size: 'md', icon: 'trash-2', ariaLabel: 'Remove' } },
    { label: 'lg · 40 (toolbars)', args: { size: 'lg', icon: 'trash-2', ariaLabel: 'Remove' } },
  ], { columns: 'repeat(auto-fit, minmax(160px, 1fr))' }),
}

/** Rest, active (pressed / current), disabled — hover and focus are live on each. */
export const States: Story = {
  render: () => ({
    components: { MpIconButton },
    setup() {
      const pressed = ref(true)
      return { pressed }
    },
    template: `
      <div style="display: flex; gap: var(--mp-space-24); align-items: center;">
        <MpIconButton icon="search" ariaLabel="Search" />
        <MpIconButton icon="files" ariaLabel="Explorer (pressed)" :active="pressed" :aria-pressed="pressed" @click="pressed = !pressed" />
        <MpIconButton icon="trash-2" ariaLabel="Remove (disabled)" disabled />
      </div>
    `,
  }),
}
