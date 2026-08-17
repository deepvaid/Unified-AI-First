import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import LandingPageStylePanel from './LandingPageStylePanel.vue'
import { PAGE_STYLE } from './landingStoryFixtures'
import type { LandingPageStyle } from '@/stores/useLandingPages'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Marketing/LandingPageStylePanel',
  component: LandingPageStylePanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`LandingPageStylePanel\` is the page-level settings panel shown in the landing editor's right
rail **when no block is selected** — the counterpart to \`LandingBlockSettings\`. It edits the
five \`LandingPageStyle\` fields that apply across every block: background colour, content width,
base font (Inter / Georgia / Monospace), accent colour, and button radius.

Unlike \`LandingBlockSettings\` (which mutates its \`block\` prop directly), this panel is
**controlled**: it never mutates \`style\`, emitting \`update\` with a \`Partial<LandingPageStyle>\`
patch instead. The parent applies it.

**Use when:** nothing is selected on the canvas — it's the \`v-else\` branch of the settings rail.

**Don't use when:** editing one block's appearance — that's \`LandingBlockSettings\`.

### 🟢 Do's
- **Do** merge the emitted patch into the page style and pass the new object back down.

### 🔴 Don'ts
- **Don't** mutate the \`style\` prop in place — the panel expects a controlled value.
- **Don't** hand-roll another swatch + \`v-menu\` + \`v-color-picker\`; this is one of several ad hoc
  colour pickers awaiting a shared \`MpColorPicker\` (see the overlay audit).

### A11y
- **Provides:** each colour swatch is a labelled \`<button>\` (\`aria-label="Background color"\`),
  and the sliders are native Vuetify controls with keyboard support.
- **Consumer must:** nothing beyond applying the patch.
        `,
      },
    },
  },
  argTypes: {
    style: { control: 'object', description: 'The current LandingPageStyle — background, content width, base font, accent, button radius.' },
    onUpdate: { action: 'update', description: 'Emitted with a Partial<LandingPageStyle> patch; the parent applies it.' },
  },
} satisfies Meta<typeof LandingPageStylePanel>

export default meta
type Story = StoryObj<typeof meta>

/** Default page style, controlled by the parent. */
export const Default: Story = {
  args: { style: PAGE_STYLE },
  render: (args) => ({
    components: { LandingPageStylePanel },
    setup: () => ({ args }),
    template: '<div style="max-width: 300px"><LandingPageStylePanel v-bind="args" /></div>',
  }),
}

/** A dark-background page with a wide content column and a serif base font. */
export const CustomTheme: Story = {
  args: {
    style: { backgroundColor: '#111827', contentWidth: 920, baseFont: 'Georgia', accentColor: '#7E3AF2', buttonRadius: 24 },
  },
  render: Default.render,
}

/**
 * Wired up the way the editor does it: the story holds the style and applies each emitted patch,
 * so the controls actually move.
 */
export const Interactive: Story = {
  args: { style: PAGE_STYLE },
  render: () => ({
    components: { LandingPageStylePanel },
    setup() {
      const style = ref<LandingPageStyle>({ ...PAGE_STYLE })
      const apply = (patch: Partial<LandingPageStyle>) => { style.value = { ...style.value, ...patch } }
      return { style, apply }
    },
    template: `
      <div style="max-width: 300px">
        <LandingPageStylePanel :style="style" @update="apply" />
      </div>
    `,
  }),
}

export const DarkMode: Story = {
  ...Default,
  globals: darkModeGlobals,
}
