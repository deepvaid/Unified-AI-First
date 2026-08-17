import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpDateRangeSelect from './MpDateRangeSelect.vue'
import { dateRangeLabel, type DateRangePreset, type DateRangeValue } from '@/stores/useAnalytics'

const meta = {
  title: 'Data Display/MpDateRangeSelect',
  component: MpDateRangeSelect,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpDateRangeSelect\` is the shared report date-range control used across every Analytics report
view (Sales Summary, Campaign Reports, Orders Report, Website Reports, and more — 14 usages).
It renders as a single trigger button showing the active range as text, backed by a popover menu
of standard presets plus a "Custom range" option that reveals From/To date fields inline.

**Use when:** a report or dashboard needs one date-range filter driving its queried data — pair
it with \`isWithinRange()\` from \`useAnalytics\` to filter rows against the selected value.

**Don't use when:** the page needs two independent date pickers, or a range that isn't
report-scoped (use plain \`v-text-field type="date"\` fields instead).

### Usage
\`\`\`html
<script setup>
import { ref } from 'vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import { isWithinRange, type DateRangeValue } from '@/stores/useAnalytics'
import { darkModeGlobals } from '@/stories/storybookTheme'

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
    template: `
      <section style="padding:24px;background:rgb(var(--v-theme-background));min-height:280px;">
        <MpDateRangeSelect v-model="value" />
      </section>
    `,
  }),
} satisfies Meta<typeof MpDateRangeSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { modelValue: { preset: 'Last 30 days' } },
}

/** Every standard preset, closed, side by side — the trigger label is just the preset name. */
export const AllPresets: Story = {
  render: () => ({
    components: { MpDateRangeSelect },
    setup() {
      const presets: DateRangePreset[] = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This month', 'This year']
      const values = ref<DateRangeValue[]>(presets.map((preset) => ({ preset })))
      return { presets, values }
    },
    template: `
      <div style="padding:24px;display:flex;flex-wrap:wrap;gap:16px;background:rgb(var(--v-theme-background));">
        <MpDateRangeSelect v-for="(p, i) in presets" :key="p" v-model="values[i]" />
      </div>
    `,
  }),
  args: {} as any,
}

/** An active Custom range with both bounds set — the trigger shows the formatted date span. */
export const CustomRange: Story = {
  args: { modelValue: { preset: 'Custom', from: '2026-06-01', to: '2026-06-30' } },
}

/** Custom selected but no bounds filled yet — the trigger falls back to "Custom range". */
export const CustomRangeUnset: Story = {
  args: { modelValue: { preset: 'Custom' } },
}

/** The preset menu opened automatically — the active preset is highlighted, "Custom range" sits below a divider. */
export const MenuOpen: Story = {
  args: { modelValue: { preset: 'Last 90 days' } },
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('.mp-range-trigger')
    trigger?.click()
  },
}

/** Clicking "Custom range" reveals the From/To fields inline, without closing the menu. */
export const CustomPanelOpen: Story = {
  args: { modelValue: { preset: 'This month' } },
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('.mp-range-trigger')
    trigger?.click()
    await new Promise((resolve) => setTimeout(resolve, 200))
    const items = Array.from(document.querySelectorAll<HTMLElement>('.v-list-item'))
    const customItem = items.find((el) => el.textContent?.includes('Custom range'))
    customItem?.click()
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
      <div style="padding:24px;background:rgb(var(--v-theme-background));min-height:280px;">
        <MpDateRangeSelect v-model="value" />
        <p class="text-body-2 text-medium-emphasis mt-4">Active range: {{ dateRangeLabel(value) }}</p>
      </div>
    `,
  }),
  args: {} as any,
}

/** Preset list and trigger on the dark theme. */
export const DarkMode: Story = {
  ...AllPresets,
  globals: darkModeGlobals,
}
