import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import ThemeDaVinciPanel, { type ThemeChatMessage } from './ThemeDaVinciPanel.vue'
import { generateSections } from '@/composables/useThemeGenerator'
import { getSectionDef } from '@/stores/themeBuilderData'
import { surfaceFrame } from '@/stories/decorators'

// Conversation fixtures mirror what StoreThemeBuilder pushes: user turns are the
// raw prompt; matched Da Vinci turns carry addedIds/addedTitles so the panel
// renders the result card with its Undo button.
const conversationMessages: ThemeChatMessage[] = [
  { id: 'u-1', role: 'user', text: 'Add a hero “Winter Sale” and featured products' },
  {
    id: 'd-1',
    role: 'davinci',
    text: 'Added Hero and Featured products to your Home page.',
    addedIds: ['sec-hero-1', 'sec-featured-1'],
    addedTitles: ['Hero', 'Featured products'],
  },
]

const unmatchedMessages: ThemeChatMessage[] = [
  { id: 'u-1', role: 'user', text: 'Make my checkout faster' },
  {
    id: 'd-1',
    role: 'davinci',
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
          'Da Vinci chat surface for the store theme builder\'s left panel — presentational: the parent '
          + '(StoreThemeBuilder) owns the conversation, runs `generateSections` on `generate`, and removes '
          + 'sections on `undo`; turns with `addedIds` render a result card with a per-turn Undo button.',
      },
    },
  },
  args: {
    messages: [],
  },
  argTypes: {
    messages: {
      control: 'object',
      description: 'ThemeChatMessage[] owned by the parent, newest last. Empty renders the welcome state with example-prompt chips; davinci turns with `addedIds`/`addedTitles` render the Undo result card.',
    },
    onGenerate: { table: { category: 'events' }, description: 'Emitted with the prompt on chip click or textarea submit (Enter sends, Shift+Enter newline).' },
    onUndo: { table: { category: 'events' }, description: 'Emitted with the exact section ids a turn created — parent removes them and clears the turn\'s `addedIds`.' },
    onClose: { table: { category: 'events' }, description: 'Back button clicked — parent returns to the Sections/Styles tabs.' },
  },
  // The panel fills its host — stage it in a builder-panel-sized frame.
  decorators: [surfaceFrame({ width: '320px', height: '560px' })],
} satisfies Meta<typeof ThemeDaVinciPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Empty conversation — avatar intro, example-prompt chips, and the quoted-headline tip. */
export const Welcome: Story = {}

/** A matched turn: user prompt, then a result card with the added titles and an Undo button. */
export const Conversation: Story = {
  args: { messages: conversationMessages },
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

/** One structure — the Da Vinci panel docked in the theme builder. Its variants are the conversation modes: welcome prompts, an active exchange, and the fallback when nothing matched. */
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

/** Welcome, mid-conversation, unmatched fallback, and interactive. */
export const States: Story = {
  render: (args) => ({
    components: { ThemeDaVinciPanel },
    setup: () => ({ args }),
    template: `<ThemeDaVinciPanel v-bind="args" />`,
  }),
}
