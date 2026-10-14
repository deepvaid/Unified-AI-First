import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import ThemeDaVinciPanel, { type ThemeChatMessage } from './ThemeDaVinciPanel.vue'
import { generateSections } from '@/composables/useThemeGenerator'
import { getSectionDef } from '@/stores/themeBuilderData'
import { surfaceFrame } from '@/stories/decorators'

// Conversation fixtures mirror what StoreThemeBuilder pushes: user turns are the
// raw prompt; matched Da Vinci turns carry addedIds/addedTitles so the panel
// renders the result card with its Undo button.
const AT = '2026-10-14T09:30:00'

const conversationMessages: ThemeChatMessage[] = [
  { id: 'u-1', role: 'user', text: 'Generate me an image banner', at: AT },
  {
    id: 'd-1',
    role: 'davinci',
    text: 'Added Image banner to your Home page.',
    at: AT,
    addedIds: ['sec-banner-1'],
    addedTitles: ['Image banner'],
  },
]

const generatingMessages: ThemeChatMessage[] = [
  { id: 'u-1', role: 'user', text: 'Build an image gallery', at: AT },
]

const unmatchedMessages: ThemeChatMessage[] = [
  { id: 'u-1', role: 'user', text: 'Make my checkout faster', at: AT },
  {
    id: 'd-1',
    role: 'davinci',
    at: AT,
    text: 'I can add sections like a hero banner, featured products, an image banner, '
      + 'testimonials, or a newsletter. Try “Draft a full homepage” or “add an image banner”.',
  },
]

const meta = {
  title: 'Product/Sales Channels/ThemeDaVinciPanel',
  component: ThemeDaVinciPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Da Vinci AI Generator — the store theme builder\'s left panel, mirroring the live builder: a welcome '
          + 'with three example requests that fill the composer, a three-stage progress state while a generation '
          + 'runs (`generating`), then a conversation whose generated turns carry a per-turn Undo. `mode="edit"` is '
          + 'the live builder\'s "Edit with Da Vinci" wording of the same panel (an existing section, its own examples). '
          + 'Presentational: the parent (StoreThemeBuilder, ThemeEditorBuilder) owns the conversation and the store writes.',
      },
    },
  },
  args: {
    messages: [],
    generating: null,
  },
  argTypes: {
    messages: {
      control: 'object',
      description: 'ThemeChatMessage[] owned by the parent, newest last. Empty renders the welcome state with the example requests; davinci turns with `addedIds`/`addedTitles` render the Undo result card.',
    },
    generating: {
      control: 'object',
      description: '`{ prompt, stage }` while the parent runs a generation (stage indexes GENERATION_STAGES); the composer locks and the progress card shows. `null` when idle.',
    },
    onGenerate: { table: { category: 'events' }, description: 'Emitted with the prompt on composer submit (Enter sends, Shift+Enter newline). Example rows only fill the composer.' },
    onUndo: { table: { category: 'events' }, description: 'Emitted with the exact section ids a turn created — parent removes them and clears the turn\'s `addedIds`.' },
    onClear: { table: { category: 'events' }, description: 'Clear-conversation button clicked — parent drops this template\'s turns.' },
    onClose: { table: { category: 'events' }, description: 'Close button clicked — parent returns to the Sections/Styles tabs.' },
  },
  // The panel fills its host — stage it in a builder-panel-sized frame.
  decorators: [surfaceFrame({ width: '320px', height: '560px' })],
} satisfies Meta<typeof ThemeDaVinciPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Empty conversation — the welcome intro, three example requests that fill the composer, and the tip. */
export const Welcome: Story = {}

/** A generation in flight: stage two of three, the completed stage listed, the request echoed, composer locked. */
export const Generating: Story = {
  args: { messages: generatingMessages, generating: { prompt: 'Build an image gallery', stage: 1 } },
}

/** A matched turn: user prompt, then a result card with the added titles and an Undo button. */
export const Conversation: Story = {
  args: { messages: conversationMessages },
}

/** "Edit with Da Vinci" on an existing section — the live builder's edit wording and examples. */
export const EditMode: Story = {
  args: { mode: 'edit' },
}

/** An unmatched prompt: Da Vinci replies with the capability fallback and re-shows the chips. */
export const UnmatchedFallback: Story = {
  args: { messages: unmatchedMessages },
}

/**
 * Fully wired flow — `generate` runs the real `generateSections` against locally
 * tracked sections and `undo` removes them, mirroring StoreThemeBuilder's wiring
 * (minus the store writes). Try a chip, the textarea, or Undo on a result card.
 */
export const Interactive: Story = {
  render: () => ({
    components: { ThemeDaVinciPanel },
    setup() {
      const messages = ref<ThemeChatMessage[]>([])
      const sections = ref<{ id: string; kind: string; title: string }[]>([])
      let counter = 0
      const nextId = (prefix: string) => `${prefix}-${++counter}`

      function onGenerate(prompt: string) {
        messages.value.push({ id: nextId('u'), role: 'user', text: prompt })
        const result = generateSections(prompt, {
          template: 'home',
          existingKinds: sections.value.map((s) => s.kind),
        })
        if (!result.matched || result.kinds.length === 0) {
          messages.value.push({ id: nextId('d'), role: 'davinci', text: result.reply })
          return
        }
        const created = result.kinds.map((kind) => ({
          id: nextId('sec'),
          kind,
          title: getSectionDef(kind)?.title ?? kind,
        }))
        sections.value.push(...created)
        messages.value.push({
          id: nextId('d'),
          role: 'davinci',
          text: result.reply,
          addedIds: created.map((s) => s.id),
          addedTitles: created.map((s) => s.title),
        })
      }

      function onUndo(ids: string[]) {
        const idSet = new Set(ids)
        sections.value = sections.value.filter((s) => !idSet.has(s.id))
        // Same as the builder: drop the ids off that turn so Undo can't double-fire.
        const turn = messages.value.find((m) => m.addedIds?.some((id) => idSet.has(id)))
        if (turn) {
          turn.addedIds = undefined
          turn.text = 'Removed.'
        }
      }

      return { messages, onGenerate, onUndo }
    },
    template: `
      <ThemeDaVinciPanel :messages="messages" @generate="onGenerate" @undo="onUndo" />
    `,
  }),
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — the Da Vinci panel docked in the theme builder. Its variants are the conversation modes: welcome, generating, an active exchange, and the fallback when nothing matched. */
export const Variants: Story = {
  render: (args) => ({
    components: { ThemeDaVinciPanel },
    setup: () => ({ args }),
    template: `<ThemeDaVinciPanel v-bind="args" />`,
  }),
}

/** There is no `size` prop — the panel fills the builder's side column. Its rows and controls resolve to the shared list-row and control-height tokens. */
export const Sizes: Story = {
  render: (args) => ({
    components: { ThemeDaVinciPanel },
    setup: () => ({ args }),
    template: `<ThemeDaVinciPanel v-bind="args" />`,
  }),
}

/** Welcome, generating, mid-conversation, unmatched fallback, and interactive. */
export const States: Story = {
  render: (args) => ({
    components: { ThemeDaVinciPanel },
    setup: () => ({ args }),
    template: `<ThemeDaVinciPanel v-bind="args" />`,
  }),
}
