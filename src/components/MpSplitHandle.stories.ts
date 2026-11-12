import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MpSplitHandle from './MpSplitHandle.vue'

const meta = {
  title: 'Atoms/MpSplitHandle',
  component: MpSplitHandle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpSplitHandle\` is the separator between two panes: a hairline in a 12px hit area that the user
drags or moves with the keyboard (the WAI-ARIA *window splitter*). It owns the interaction and the
look, nothing else — the consumer lays out the panes and applies the width it emits.

- **Use \`MpSplitPane\`** for a plain start-sized split (list | detail). It composes this handle
  and does the clamping and layout for you.
- **Use the handle directly** when the sized pane is docked at the end of a layout that
  \`MpSplitPane\` can't wrap — the ticket's side panel does, with \`side="end"\`.

\`side\` says which side of the handle the sized pane is on. With \`end\`, dragging left (and ←)
makes the pane wider.

### Usage
\`\`\`html
<div class="d-flex">
  <div class="flex-grow-1">…thread…</div>
  <MpSplitHandle v-model:size="panelWidth" :min="260" :max="maxWidth" :default-size="300"
                 side="end" ariaLabel="Resize side panel" controls="side-panel" />
  <aside id="side-panel" :style="{ width: panelWidth + 'px' }">…panel…</aside>
</div>
\`\`\`

### A11y
- **Provides:** \`role="separator"\`, \`aria-orientation="vertical"\`, \`aria-valuenow/min/max\` in
  px, \`aria-controls\`; focusable; ←/→ move by \`step\` (16), Home/End jump to min/max, Enter or
  double-click resets to \`defaultSize\`; a 2px focus-colour line plus the grip on focus.
- **Consumer must:** name what resizes in \`ariaLabel\`, pass the id of the sized pane as
  \`controls\`, and keep \`size\` within \`min … max\` so the announced value matches the screen.
        `,
      },
    },
  },
  argTypes: {
    size: { control: { type: 'number' }, description: 'Current width in px of the pane the handle sizes (v-model:size).' },
    min: { control: { type: 'number' }, description: 'Narrowest that pane may be.' },
    max: { control: { type: 'number' }, description: 'Widest that pane may be.' },
    defaultSize: { control: { type: 'number' }, description: 'Width Enter / double-click returns to.' },
    side: { control: 'inline-radio', options: ['start', 'end'], description: 'Which side of the handle the sized pane is on.' },
    step: { control: { type: 'number' }, description: 'Arrow-key step in px.' },
  },
  args: { size: 240, min: 160, max: 400, defaultSize: 240, side: 'start', step: 16, ariaLabel: 'Resize panel' },
} satisfies Meta<typeof MpSplitHandle>

export default meta
type Story = StoryObj<typeof meta>

/** One bordered frame with the sized pane on the handle's `side`. */
const frame = (side: 'start' | 'end', model: string, extra = '') => {
  const sized = `<div id="story-sized-${model}" class="pa-4 bg-surface-light flex-shrink-0" :style="{ width: ${model} + 'px' }">
      <div class="text-body-2 font-weight-medium">Sized pane</div>
      <div class="text-caption text-medium-emphasis">{{ ${model} }}px</div>
    </div>`
  const rest = `<div class="pa-4 flex-grow-1"><div class="text-body-2 text-medium-emphasis">The rest</div></div>`
  const handle = `<MpSplitHandle v-model:size="${model}" :min="160" :max="400" :default-size="240" side="${side}"
      ariaLabel="Resize panel" controls="story-sized-${model}" ${extra} />`
  return `<v-card flat border rounded="lg" class="d-flex overflow-hidden" height="160">
    ${side === 'start' ? sized + handle + rest : rest + handle + sized}
  </v-card>`
}

/** Default — drag the line, or focus it and use ← → Home End. Enter resets. */
export const Default: Story = {
  render: (args) => ({
    components: { MpSplitHandle },
    setup: () => ({ args, size: ref(args.size) }),
    template: `
      <v-card flat border rounded="lg" class="d-flex overflow-hidden" height="160">
        <div id="story-default" class="pa-4 bg-surface-light flex-shrink-0" :style="{ width: size + 'px' }">
          <div class="text-body-2 font-weight-medium">Sized pane</div>
          <div class="text-caption text-medium-emphasis">{{ size }}px</div>
        </div>
        <MpSplitHandle v-bind="args" v-model:size="size" controls="story-default" />
        <div class="pa-4 flex-grow-1"><div class="text-body-2 text-medium-emphasis">The rest</div></div>
      </v-card>`,
  }),
}

/** Variants — the sized pane before the handle (`start`) and after it (`end`, where ← widens it). */
export const Variants: Story = {
  render: () => ({
    components: { MpSplitHandle },
    setup: () => ({ start: ref(240), end: ref(240) }),
    template: `
      <div class="d-flex flex-column ga-4">
        <div>
          <div class="text-caption text-medium-emphasis mb-1">side: start</div>
          ${frame('start', 'start')}
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-1">side: end</div>
          ${frame('end', 'end')}
        </div>
      </div>`,
  }),
  args: {} as never,
}

/** Sizes — the two limits: at `min` (160px) and at `max` (400px) the handle stops. */
export const Sizes: Story = {
  render: () => ({
    components: { MpSplitHandle },
    setup: () => ({ atMin: ref(160), atMax: ref(400) }),
    template: `
      <div class="d-flex flex-column ga-4">
        <div>
          <div class="text-caption text-medium-emphasis mb-1">At min</div>
          ${frame('start', 'atMin')}
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-1">At max</div>
          ${frame('start', 'atMax')}
        </div>
      </div>`,
  }),
  args: {} as never,
}

/** States — focused: the line turns the focus colour at 2px and the grip shows. Hover shows the grip alone. */
export const States: Story = {
  render: () => ({
    components: { MpSplitHandle },
    setup: () => ({ size: ref(240) }),
    mounted() {
      ;(this.$el as HTMLElement).querySelector<HTMLElement>('[role="separator"]')?.focus()
    },
    template: frame('start', 'size'),
  }),
  args: {} as never,
}
