import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MpSplitPane from './MpSplitPane.vue'

const meta = {
  title: 'Molecules/MpSplitPane',
  component: MpSplitPane,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpSplitPane\` puts two panes side by side with a separator the user can drag or move with the
keyboard (the WAI-ARIA *window splitter*). The **start** pane keeps the width the user chose; the
**end** pane takes the rest. Built for the Service inbox (ticket list | ticket), reusable for any
master–detail screen.

The rendered width is clamped to \`min … container × maxRatio\`, but \`v-model:size\` only changes
when the user moves the separator — so shrinking the window squeezes the pane without throwing
away the preference, and widening it gives the chosen width back. **Persisting** the value
(localStorage, user settings) is the consumer's job.

\`stacked\` shows one pane at a time with no separator, for narrow screens. Both panes stay
mounted, so a list keeps its scroll position.

### Usage
\`\`\`html
<v-card flat border rounded="lg">
  <MpSplitPane v-model:size="listWidth" :default-size="380" :min="320"
               aria-label="Resize ticket list" controls="ticket-list"
               :stacked="narrow ? (selected ? 'end' : 'start') : null">
    <template #start>…list…</template>
    <template #end>…detail…</template>
  </MpSplitPane>
</v-card>
\`\`\`

### A11y
- **Provides:** \`role="separator"\` with \`aria-orientation="vertical"\`, \`aria-valuenow/min/max\`
  in px and \`aria-controls\`; focusable; ←/→ move by \`step\` (16), Home/End jump to min/max,
  Enter or double-click resets to \`defaultSize\`; a 2px focus-colour line plus the grip on focus.
- **Consumer must:** give it an \`aria-label\` that names what resizes, and an id on the start
  pane's content for \`controls\`.
        `,
      },
    },
  },
  argTypes: {
    size: { control: { type: 'number' }, description: 'Start-pane width in px (v-model:size).' },
    defaultSize: { control: { type: 'number' }, description: 'Width Enter / double-click returns to.' },
    min: { control: { type: 'number' }, description: 'Narrowest the start pane may be.' },
    maxRatio: { control: { type: 'number', step: 0.05, min: 0.2, max: 0.8 }, description: 'Largest share of the container for the start pane.' },
    stacked: { control: 'inline-radio', options: [null, 'start', 'end'], description: 'Narrow screens: one pane at a time.' },
  },
  args: { size: 320, defaultSize: 320, min: 240, maxRatio: 0.5, ariaLabel: 'Resize list', stacked: null },
} satisfies Meta<typeof MpSplitPane>

export default meta
type Story = StoryObj<typeof meta>

const frame = (body: string) => `
  <v-card flat border rounded="lg" class="overflow-hidden" height="320">
    ${body}
  </v-card>`

const panes = `
  <template #start>
    <div id="story-list" class="pa-4 h-100 overflow-y-auto">
      <div class="text-body-2 font-weight-medium mb-2">List</div>
      <div v-for="n in 12" :key="n" class="text-body-2 text-medium-emphasis py-1">Item {{ n }}</div>
    </div>
  </template>
  <template #end>
    <div class="pa-4 h-100 bg-surface-light">
      <div class="text-body-2 font-weight-medium mb-2">Detail</div>
      <p class="text-body-2 text-medium-emphasis">Drag the line, or focus it and use ← → Home End. Enter resets.</p>
    </div>
  </template>`

/** Default — drag or arrow-key the separator; the width shows below. */
export const Default: Story = {
  render: (args) => ({
    components: { MpSplitPane },
    setup: () => {
      const size = ref(args.size)
      return { args, size }
    },
    template: `
      <div>
        ${frame(`<MpSplitPane v-bind="args" v-model:size="size" controls="story-list" class="h-100">${panes}</MpSplitPane>`)}
        <p class="text-caption text-medium-emphasis mt-2">Start pane: {{ size }}px</p>
      </div>`,
  }),
}

/** Variants — side by side, and the two stacked states used below the split breakpoint. */
export const Variants: Story = {
  render: () => ({
    components: { MpSplitPane },
    setup: () => ({ size: ref(280) }),
    template: `
      <div class="d-flex flex-column ga-4">
        <div v-for="stacked in [null, 'start', 'end']" :key="String(stacked)">
          <div class="text-caption text-medium-emphasis mb-1">stacked: {{ stacked ?? 'null (side by side)' }}</div>
          ${frame(`<MpSplitPane v-model:size="size" :default-size="280" :min="200" ariaLabel="Resize list" :stacked="stacked" class="h-100">${panes}</MpSplitPane>`)}
        </div>
      </div>`,
  }),
}

/** Sizes — the clamp: a saved width wider than `maxRatio` allows renders at the cap. */
export const Sizes: Story = {
  render: () => ({
    components: { MpSplitPane },
    setup: () => ({ narrow: ref(200), wide: ref(900) }),
    template: `
      <div class="d-flex flex-column ga-4">
        <div>
          <div class="text-caption text-medium-emphasis mb-1">At min (200px)</div>
          ${frame(`<MpSplitPane v-model:size="narrow" :default-size="280" :min="200" ariaLabel="Resize list" class="h-100">${panes}</MpSplitPane>`)}
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-1">Saved 900px, rendered at the 50% cap</div>
          ${frame(`<MpSplitPane v-model:size="wide" :default-size="280" :min="200" ariaLabel="Resize list" class="h-100">${panes}</MpSplitPane>`)}
        </div>
      </div>`,
  }),
}

/** States — the separator focused (grip + 2px focus line). Tab to it if a click took focus. */
export const States: Story = {
  render: () => ({
    components: { MpSplitPane },
    setup: () => ({ size: ref(280) }),
    mounted() {
      ;(this.$el as HTMLElement).querySelector<HTMLElement>('[role="separator"]')?.focus()
    },
    template: frame(`<MpSplitPane v-model:size="size" :default-size="280" :min="200" ariaLabel="Resize list" class="h-100">${panes}</MpSplitPane>`),
  }),
}
