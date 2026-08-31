import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MpSegmentedControl from './MpSegmentedControl.vue'

const meta = {
  title: 'Atoms/MpSegmentedControl',
  component: MpSegmentedControl,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpSegmentedControl\` is the one segmented toggle: a padded track with pill segments, for
switching between 2–5 mutually exclusive views or modes (preview device, light/dark, widget
size, AND/OR). It wraps \`v-btn-toggle\` and owns every pixel of the geometry on
\`component.segmented.*\` tokens, so it is immune to the raw \`v-btn-toggle\` styling pitfalls
(the global button pill radius and 40px min-height are written as inline styles, which broke
every hand-rolled group).

**Use when:** one value from a small, always-visible set changes what the surface shows —
a view switch, not an action.

**Don't use when:** the options are actions (use buttons), the set is long or dynamic (use a
\`v-select\`), the choice is part of a form record (use \`MpFormField\` + radio/chip group), or
it's content-set filtering above a table (use \`MpFilterTabs\`).

### Usage
\`\`\`html
<MpSegmentedControl
  v-model="device"
  size="sm"
  ariaLabel="Preview device"
  :items="[
    { value: 'desktop', icon: 'monitor', label: 'Desktop', tooltip: 'Desktop' },
    { value: 'tablet', icon: 'tablet', label: 'Tablet', tooltip: 'Tablet' },
    { value: 'mobile', icon: 'smartphone', label: 'Mobile', tooltip: 'Mobile' },
  ]"
/>
\`\`\`

### 🟢 Do's
- **Do** give every icon segment a \`label\` — it becomes the segment's \`aria-label\` — and
  usually a \`tooltip\` too.
- **Do** keep it \`mandatory\` (the default) for view switchers: a view is always showing.
- **Do** pick \`size="md"\` (40, aligns with buttons) in toolbars and forms, \`sm\` (32) in
  dense chrome — builder bars, menu rows.

### 🔴 Don'ts
- **Don't** hand-roll a \`v-btn-toggle\` for a new switcher — the global normalization only
  keeps legacy sites presentable; this component is the API.
- **Don't** mix icon and text segments in one control — pick one form.
- **Don't** exceed ~5 segments; the control doesn't wrap or scroll.

### A11y
- **Provides:** the group is named by the required \`ariaLabel\`; Vuetify wires
  \`aria-pressed\` per segment; icon segments get an \`aria-label\` from \`label\`; disabled
  segments stay in the tab order's group semantics.
- **Consumer must:** pass a \`label\` for every icon segment, and make \`ariaLabel\` say what
  is being switched ("Preview device", not "Options").
- **Gaps:** segments are individual buttons (tab moves between them), not a radiogroup with
  arrow-key navigation; selection is announced via \`aria-pressed\`, not \`aria-checked\`.
        `,
      },
    },
  },
  args: {
    ariaLabel: 'View',
    modelValue: 'trend',
    items: [
      { value: 'trend', label: 'Trend' },
      { value: 'compare', label: 'Compare' },
    ],
  },
  argTypes: {
    modelValue: {
      control: 'text',
      description: 'The selected segment value (`v-model`). `null` when nothing is selected (only possible with `mandatory: false`).',
    },
    items: {
      control: 'object',
      description: 'Segments: `{ value, label?, icon?, disabled?, tooltip? }[]`. An `icon` makes the segment icon-only (square) and `label` becomes its `aria-label`; without `icon`, `label` is the visible text.',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: 'Track height — md 40 (`component.segmented.height.md` = `control.height`, aligns with buttons), sm 32 for dense chrome. Default md.',
    },
    mandatory: {
      control: 'boolean',
      description: 'When true (default) one segment is always selected. When false, clicking the active segment clears the model to `null`.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Required accessible name for the group, e.g. "Preview device". Bind as camelCase `ariaLabel`.',
    },
  },
} satisfies Meta<typeof MpSegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { MpSegmentedControl },
    setup() {
      const model = ref(args.modelValue)
      return { args, model }
    },
    template: `
      <div class="d-flex flex-column align-start ga-3 pa-4">
        <MpSegmentedControl v-bind="args" v-model="model" />
        <div class="text-body-2 text-medium-emphasis">Selected: {{ model ?? '—' }}</div>
      </div>
    `,
  }),
}

/**
 * One ramp, two stops: md (40) equals `control.height` so a segmented control and a button
 * align on one baseline; sm (32) is for dense chrome — builder bars, menu rows. The pill
 * segment is always `height − 2×padding`, every number on a scale stop.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpSegmentedControl },
    setup() {
      const md = ref('desktop')
      const sm = ref('desktop')
      const items = [
        { value: 'desktop', icon: 'monitor', label: 'Desktop' },
        { value: 'tablet', icon: 'tablet', label: 'Tablet' },
        { value: 'mobile', icon: 'smartphone', label: 'Mobile' },
      ]
      return { md, sm, items }
    },
    template: `
      <div class="d-flex flex-column align-start ga-4 pa-4">
        <div class="d-flex align-center ga-4">
          <MpSegmentedControl v-model="md" :items="items" ariaLabel="Preview device (md)" />
          <span class="text-body-2 text-medium-emphasis">md — 40, aligns with buttons</span>
        </div>
        <div class="d-flex align-center ga-4">
          <MpSegmentedControl v-model="sm" :items="items" size="sm" ariaLabel="Preview device (sm)" />
          <span class="text-body-2 text-medium-emphasis">sm — 32, dense chrome</span>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * Active, disabled segment, and a non-mandatory control where clicking the active segment
 * clears the selection. Tab to a segment to see the focus treatment.
 */
export const States: Story = {
  render: () => ({
    components: { MpSegmentedControl },
    setup() {
      const withDisabled = ref('s')
      const optional = ref<string | null>(null)
      return { withDisabled, optional }
    },
    template: `
      <div class="d-flex flex-column align-start ga-4 pa-4">
        <div class="d-flex align-center ga-4">
          <MpSegmentedControl
            v-model="withDisabled"
            :items="[
              { value: 's', label: 'S' },
              { value: 'm', label: 'M' },
              { value: 'l', label: 'L' },
              { value: 'xl', label: 'XL', disabled: true },
            ]"
            size="sm"
            ariaLabel="Widget size"
          />
          <span class="text-body-2 text-medium-emphasis">disabled segment (XL)</span>
        </div>
        <div class="d-flex align-center ga-4">
          <MpSegmentedControl
            v-model="optional"
            :mandatory="false"
            :items="[
              { value: 'and', label: 'AND' },
              { value: 'or', label: 'OR' },
            ]"
            ariaLabel="Match mode"
          />
          <span class="text-body-2 text-medium-emphasis">mandatory: false — selected: {{ optional ?? 'none' }}</span>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Scenarios ────────────────────────────────────────────────────────────────

/**
 * Icon-only segments — the builder device switcher. Each segment's `label` becomes its
 * `aria-label` and doubles as the tooltip.
 */
export const IconOnly: Story = {
  render: () => ({
    components: { MpSegmentedControl },
    setup() {
      const device = ref('desktop')
      const items = [
        { value: 'desktop', icon: 'monitor', label: 'Desktop', tooltip: 'Desktop' },
        { value: 'tablet', icon: 'tablet', label: 'Tablet', tooltip: 'Tablet' },
        { value: 'mobile', icon: 'smartphone', label: 'Mobile', tooltip: 'Mobile' },
      ]
      return { device, items }
    },
    template: `
      <div class="d-flex flex-column align-start ga-3 pa-4">
        <MpSegmentedControl v-model="device" :items="items" size="sm" ariaLabel="Preview device" />
        <div class="text-body-2 text-medium-emphasis">Hover a segment for its tooltip — previewing: {{ device }}</div>
      </div>
    `,
  }),
  args: {} as never,
}
