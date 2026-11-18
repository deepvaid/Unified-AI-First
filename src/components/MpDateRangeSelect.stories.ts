import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpDateRangeSelect from './MpDateRangeSelect.vue'
import { dateRangeLabel, dateRangePresets, type DateRangeValue } from '@/stores/useAnalytics'
import { liquidskyDocs } from '@/stories/storyTemplate'
import { overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Molecules/MpDateRangeSelect',
  component: MpDateRangeSelect,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('molecules-mpdaterangeselect') + `
### Overview
\`MpDateRangeSelect\` is the shared report date-range control used across every Analytics report
view (Sales Summary, Campaign Reports, Orders Report, Website Reports, and more — 14 usages).
It renders as a single trigger button showing the active range as text, backed by a popover menu
of standard presets plus a "Custom range" option that reveals From/To date fields inline.

**Use when:** a report or dashboard needs one date-range filter driving its queried data — pair
it with \`isWithinRange()\` from \`useAnalytics\` to filter rows against the selected value.

**Don't use when:** a form needs one date (use the single-date field — Patterns › Form Fields,
\`DateField\`), two independent dates, or a range that isn't report-scoped (use plain
\`v-text-field type="date"\` fields instead).

### Usage
\`\`\`html
<script setup>
import { ref } from 'vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import { isWithinRange, type DateRangeValue } from '@/stores/useAnalytics'

const dateRange = ref<DateRangeValue>({ preset: 'Last 30 days' })
const filteredRows = computed(() => rows.filter((r) => isWithinRange(r.date, dateRange.value)))
</script>

<MpDateRangeSelect v-model="dateRange" />
\`\`\`

### 🟢 Do's
- **Do** default new reports to \`{ preset: 'Last 30 days' }\` (\`DEFAULT_DATE_RANGE\`) for consistency.
- **Do** drive filtering through \`isWithinRange()\` rather than re-implementing date math per view.

### 🔴 Don'ts
- **Don't** allow an invalid Custom range — Apply stays disabled until at least one of From/To is filled.
- **Don't** rename or reorder the presets; they're a fixed shared union (\`DateRangePreset\`) used by every report.

### 💡 Best Practices
- **Label:** the trigger text is always \`dateRangeLabel(modelValue)\` — the preset name, or the
  formatted "MMM D, YYYY – MMM D, YYYY" bounds for Custom ("Custom range" if both bounds are empty).
- **Persistence:** the popover re-syncs its Custom fields from \`modelValue\` every time it opens,
  so a cancelled edit never leaks into the next open.

### A11y
- **Provides:** the trigger is a real \`<button>\` whose visible text is always the current range
  (never color- or icon-only); the popover is a standard Vuetify \`v-menu\`/\`v-list\`, keyboard
  navigable, closing on Escape; the Apply button is disabled (not hidden) until the Custom range
  has at least one bound filled.
- **Consumer must:** keep passing \`modelValue\` through \`dateRangeLabel()\` for any place the
  range is echoed outside the control (e.g. a report subtitle).
- **Gaps:** the trigger \`<button>\` has no explicit \`aria-haspopup\`/\`aria-label\` — its accessible
  name comes from its visible text content only (acceptable since the label always renders, but
  not an explicit popup affordance for assistive tech).
        `,
      },
    },
  },
  argTypes: {
    modelValue: {
      control: 'object',
      description: 'v-model — the active range: `{ preset: DateRangePreset | \'Custom\', from?: string, to?: string }`. `from`/`to` are ISO date strings, only meaningful when `preset` is \'Custom\'.',
    },
    'update:modelValue': {
      control: false,
      description: 'Event — emitted with the new `DateRangeValue` when a preset is picked or a Custom range is applied.',
      table: { category: 'events' },
    },
  },
  render: (args) => ({
    components: { MpDateRangeSelect },
    setup() {
      const value = ref<DateRangeValue>({ ...args.modelValue })
      watch(
        () => args.modelValue,
        (next) => {
          value.value = { ...next }
        },
      )
      return { value }
    },
    template: '<MpDateRangeSelect v-model="value" />',
  }),
} satisfies Meta<typeof MpDateRangeSelect>

export default meta
type Story = StoryObj<typeof meta>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const Default: Story = {
  args: { modelValue: { preset: 'Last 30 days' } },
}

/**
 * What the trigger shows for each kind of value: a preset shows its name; a custom range shows
 * the formatted dates; a custom range with no dates yet falls back to "Custom range". Each
 * specimen is live — open one and pick another range.
 */
export const States: Story = {
  render: () => ({
    components: { MpDateRangeSelect },
    setup() {
      const specimens = ref<{ label: string, value: DateRangeValue }[]>([
        { label: 'Preset', value: { preset: 'Last 30 days' } },
        { label: 'Custom range, both dates', value: { preset: 'Custom', from: '2026-06-01', to: '2026-06-30' } },
        { label: 'Custom range, no dates yet', value: { preset: 'Custom' } },
      ])
      return { specimens }
    },
    template: `
      <div class="d-flex flex-wrap ga-6">
        <div v-for="s in specimens" :key="s.label">
          <div class="text-caption text-medium-emphasis mb-2">{{ s.label }}</div>
          <MpDateRangeSelect v-model="s.value" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Every standard preset, closed, side by side — the trigger label is just the preset name. */
export const AllPresets: Story = {
  render: () => ({
    components: { MpDateRangeSelect },
    setup() {
      const values = ref<DateRangeValue[]>(dateRangePresets.map((preset) => ({ preset })))
      return { presets: dateRangePresets, values }
    },
    template: `
      <div class="d-flex flex-wrap ga-4">
        <MpDateRangeSelect v-for="(p, i) in presets" :key="p" v-model="values[i]" />
      </div>
    `,
  }),
  args: {} as never,
}

/** The preset menu opened automatically — the active preset is highlighted, "Custom range" sits below a divider. */
export const MenuOpen: Story = {
  args: { modelValue: { preset: 'Last 90 days' } },
  parameters: overlayDocs('420px'),
  play: async ({ canvasElement }) => {
    await wait(300)
    canvasElement.querySelector<HTMLElement>('.mp-range-trigger')?.click()
  },
}

/** Clicking "Custom range" reveals the From/To fields inline, without closing the menu. */
export const CustomPanelOpen: Story = {
  args: { modelValue: { preset: 'This month' } },
  parameters: overlayDocs('600px'),
  play: async ({ canvasElement }) => {
    await wait(300)
    const trigger = canvasElement.querySelector<HTMLElement>('.mp-range-trigger')
    trigger?.click()
    await wait(200)
    // The menu is teleported out of the canvas. The trigger's `aria-controls` names this story's
    // own menu, so the click never lands in another story's menu.
    const menu = document.getElementById(trigger?.getAttribute('aria-controls') ?? '')
    const items = Array.from(menu?.querySelectorAll<HTMLElement>('.v-list-item') ?? [])
    items.find((el) => el.textContent?.includes('Custom range'))?.click()
  },
}

/** Live wiring: picking a preset (or applying a Custom range) updates the label below immediately. */
export const LiveSelection: Story = {
  render: () => ({
    components: { MpDateRangeSelect },
    setup() {
      const value = ref<DateRangeValue>({ preset: 'Last 30 days' })
      return { value, dateRangeLabel }
    },
    template: `
      <div>
        <MpDateRangeSelect v-model="value" />
        <p class="text-body-2 text-medium-emphasis mt-4">Active range: {{ dateRangeLabel(value) }}</p>
      </div>
    `,
  }),
  args: {} as never,
}
